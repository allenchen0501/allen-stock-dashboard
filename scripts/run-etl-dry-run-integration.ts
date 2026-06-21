// @ts-nocheck -- CommonJS-compatible fixture runner using the existing TS register.
require("./register-typescript.cjs");

const { TwseConnector } = require("../connectors/twse-connector");
const { YahooConnector } = require("../connectors/yahoo-connector");
const {
  TWSE_QUOTE_FIXTURES,
} = require("../connectors/fixtures/twse-quote-fixture");
const {
  YAHOO_QUOTE_FIXTURES,
} = require("../connectors/fixtures/yahoo-quote-fixture");
const {
  runOfficialPricePipeline,
} = require("../pipelines/official-price");
const { gateWarRoomInputs } = require("../war-room/input");
const { planEtlWrites } = require("../etl/write");

function sameIdentity(record, official, symbol) {
  return {
    ...record,
    symbol,
    market: official.market,
    currency: official.currency,
    record_date: official.record_date,
    record_time: official.record_time,
  };
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ status: "FAIL", message, ...details }, null, 2));
  process.exit(1);
}

function main() {
  const twse = new TwseConnector();
  const yahoo = new YahooConnector();
  const normalOfficial = twse.normalize([TWSE_QUOTE_FIXTURES.normalPrice.raw])[0];
  const missingPriceOfficial = twse.normalize([
    TWSE_QUOTE_FIXTURES.missingPrice.raw,
  ])[0];
  const halfPercentFallback = yahoo.normalize([
    YAHOO_QUOTE_FIXTURES.officialDifferenceHalfPercent.raw,
  ])[0];
  const onePointFiveFallback = yahoo.normalize([
    YAHOO_QUOTE_FIXTURES.officialDifferenceOnePointFivePercent.raw,
  ])[0];

  const passSymbol = "FIXTURE-INTEGRATION-PASS";
  const warningSymbol = "FIXTURE-INTEGRATION-WARNING";
  const failSymbol = "FIXTURE-INTEGRATION-FAIL";
  const pass = runOfficialPricePipeline({
    official_quote: { ...normalOfficial, symbol: passSymbol },
    fallback_quote: sameIdentity(
      halfPercentFallback,
      normalOfficial,
      passSymbol,
    ),
  });
  const warning = runOfficialPricePipeline({
    official_quote: { ...normalOfficial, symbol: warningSymbol },
    fallback_quote: sameIdentity(
      onePointFiveFallback,
      normalOfficial,
      warningSymbol,
    ),
  });
  const rejected = runOfficialPricePipeline({
    official_quote: { ...missingPriceOfficial, symbol: failSymbol },
    fallback_quote: sameIdentity(
      halfPercentFallback,
      missingPriceOfficial,
      failSymbol,
    ),
  });

  if (
    pass.validation_status !== "PASS" ||
    warning.validation_status !== "WARNING" ||
    rejected.validation_status !== "FAIL"
  ) {
    fail("Fixture pipeline statuses did not match PASS/WARNING/FAIL.");
  }

  const warRoom = gateWarRoomInputs([pass, warning, rejected]);
  const writeResult = planEtlWrites({
    mode: "dry_run",
    run_id: "v9-5-fixture-integration",
    requested_at: "2026-06-22T00:00:00.000Z",
    target_table: "staging_official_prices",
    data_frequency: "daily_close",
    war_room_inputs: warRoom,
  });
  const plannedSymbols = new Set(
    writeResult.planned_operations.map((operation) => operation.payload.symbol),
  );
  const forbiddenPlannedSymbols = new Set([
    ...warRoom.reference_inputs.map((input) => input.symbol),
    ...warRoom.rejected_inputs.map((input) => input.symbol),
  ]);
  const leakedSymbols = [...forbiddenPlannedSymbols].filter((symbol) =>
    plannedSymbols.has(symbol),
  );
  const writtenCount = writeResult.audit.written_record_count;

  if (leakedSymbols.length > 0) {
    fail("WARNING or FAIL data entered planned operations.", {
      leaked_symbols: leakedSymbols,
    });
  }
  if (writtenCount !== 0 || writeResult.write_performed) {
    fail("Dry-run attempted to write records.", {
      written_count: writtenCount,
      write_performed: writeResult.write_performed,
    });
  }
  if (
    writeResult.planned_operations.length !== warRoom.primary_inputs.length
  ) {
    fail("Planned operation count does not match eligible primary inputs.");
  }
  if (
    !writeResult.quarantine.some(
      (payload) => payload.reason === "REFERENCE_INPUT",
    ) ||
    !writeResult.quarantine.some(
      (payload) => payload.reason === "REJECTED_INPUT",
    )
  ) {
    fail("WARNING and FAIL inputs were not quarantined.");
  }

  console.log(
    JSON.stringify(
      {
        primary_count: warRoom.primary_inputs.length,
        reference_count: warRoom.reference_inputs.length,
        rejected_count: warRoom.rejected_inputs.length,
        planned_operations_count: writeResult.planned_operations.length,
        quarantine_count: writeResult.quarantine.length,
        written_count: writtenCount,
        audit_summary: writeResult.audit,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

try {
  main();
} catch (error) {
  fail(
    error instanceof Error
      ? error.message
      : "Unknown ETL dry-run integration error.",
  );
}
