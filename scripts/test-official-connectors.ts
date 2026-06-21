// @ts-nocheck -- Kept as CommonJS-compatible JavaScript so `node file.ts` can
// bootstrap the repository's existing TypeScript register without a new package.
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
  validateOfficialPrice,
} = require("../connectors/official-price-validator");
const {
  TwseOfficialPriceReader,
} = require("../connectors/twse-official-price-reader");
const {
  TpexOfficialPriceReader,
} = require("../connectors/tpex-official-price-reader");

function output(result) {
  console.log(
    JSON.stringify(
      {
        source_name: result.source_name,
        record_date: result.record_date,
        record_time: result.record_time,
        status: result.status,
        data_warning: result.data_warning,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const twse = new TwseConnector();
  const yahoo = new YahooConnector();
  const official = twse.normalize([TWSE_QUOTE_FIXTURES.normalPrice.raw])[0];
  const missingOfficial = twse.normalize([TWSE_QUOTE_FIXTURES.missingPrice.raw])[0];
  const fallbackHalf = yahoo.normalize([
    YAHOO_QUOTE_FIXTURES.officialDifferenceHalfPercent.raw,
  ])[0];
  const fallbackOnePointFive = yahoo.normalize([
    YAHOO_QUOTE_FIXTURES.officialDifferenceOnePointFivePercent.raw,
  ])[0];
  const sameSymbol = (record) => ({
    ...record,
    symbol: official.symbol,
    market: official.market,
    currency: official.currency,
  });

  const fixtureResults = [
    validateOfficialPrice(official, sameSymbol(fallbackHalf)),
    validateOfficialPrice(official, sameSymbol(fallbackOnePointFive)),
    validateOfficialPrice(missingOfficial, sameSymbol(fallbackHalf)),
  ];
  console.log("Official connector fixture results:");
  fixtureResults.forEach(output);

  const expected = ["PASS", "WARNING", "FAIL"];
  if (!fixtureResults.every((result, index) => result.status === expected[index])) {
    console.error("Official connector fixture test failed.");
    process.exit(1);
  }

  const httpEnabled =
    process.env.CONNECTOR_HTTP_ENABLED?.trim().toLowerCase() === "true";
  const readers = [
    new TwseOfficialPriceReader(),
    new TpexOfficialPriceReader(),
  ];
  if (!httpEnabled) {
    const disabledResults = await Promise.all(
      readers.map((reader) => reader.read({ symbols: [], fixtureOnly: true })),
    );
    if (!disabledResults.every((result) => result.status === "disabled")) {
      console.error("Official HTTP readers must be disabled by default.");
      process.exit(1);
    }
    console.log("HTTP runtime: disabled (fixtures only; no request sent)");
    process.exit(0);
  }

  console.log("HTTP runtime: enabled by CONNECTOR_HTTP_ENABLED=true");
  const liveResults = await Promise.all([
    readers[0].read({ symbols: ["2330"] }),
    readers[1].read({ symbols: ["6488"] }),
  ]);
  for (const result of liveResults) {
    const record = result.records[0];
    console.log(
      JSON.stringify(
        {
          source_name: result.sourceName,
          record_date: record?.record_date ?? "",
          record_time: record?.record_time ?? "",
          status: result.status,
          data_warning: result.warnings[0] ?? null,
        },
        null,
        2,
      ),
    );
  }
  if (liveResults.some((result) => result.status !== "success")) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown connector test error.");
  process.exit(1);
});
