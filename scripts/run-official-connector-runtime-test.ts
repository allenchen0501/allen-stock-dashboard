// @ts-nocheck -- CommonJS-compatible entry; uses the existing local TS register.
require("./register-typescript.cjs");

const {
  DEFAULT_OFFICIAL_RUNTIME_SYMBOLS,
  resolveOfficialRuntimeSymbols,
} = require("../connectors/runtime-symbol-whitelist");
const {
  TwseOfficialPriceReader,
} = require("../connectors/twse-official-price-reader");
const {
  TpexOfficialPriceReader,
} = require("../connectors/tpex-official-price-reader");

function httpEnabled() {
  return process.env.CONNECTOR_HTTP_ENABLED?.trim().toLowerCase() === "true";
}

function requiredFieldIssues(record, expectedSymbol, expectedSource) {
  const issues = [];
  if (!record) {
    return [{ code: "MISSING_RECORD", message: "Official endpoint returned no matching record." }];
  }
  if (!record.symbol?.trim()) {
    issues.push({ code: "MISSING_SYMBOL", message: "Official record is missing symbol." });
  } else if (record.symbol.trim() !== expectedSymbol) {
    issues.push({ code: "SYMBOL_MISMATCH", message: "Official record symbol does not match the request." });
  }
  if (record.price === null || !Number.isFinite(record.price) || record.price <= 0) {
    issues.push({ code: "MISSING_PRICE", message: "Official record is missing a valid close price." });
  }
  if (!record.record_date?.trim()) {
    issues.push({ code: "MISSING_RECORD_DATE", message: "Official record is missing record_date." });
  }
  if (!record.record_time?.trim()) {
    issues.push({ code: "MISSING_RECORD_TIME", message: "Official record is missing record_time." });
  }
  if (!record.source_name?.trim()) {
    issues.push({ code: "MISSING_SOURCE", message: "Official record is missing source_name." });
  } else if (record.source_name !== expectedSource) {
    issues.push({ code: "UNEXPECTED_SOURCE", message: "Official record source is unexpected." });
  }
  if (record.volume === null || !Number.isFinite(record.volume) || record.volume < 0) {
    issues.push({ code: "INVALID_VOLUME", message: "Official record volume is missing or invalid." });
  }
  return issues;
}

function runtimeResult(symbol, expectedSource, response) {
  const record = response.records.find((item) => item.symbol === symbol);
  const issues = [
    ...response.errors.map((error) => ({ code: error.code, message: error.message })),
    ...requiredFieldIssues(record, symbol, expectedSource),
  ];
  const status = issues.length === 0 && response.status === "success" ? "PASS" : "FAIL";

  return {
    symbol,
    source_name: record?.source_name ?? "",
    record_date: record?.record_date ?? "",
    record_time: record?.record_time ?? "",
    close_price: record?.price ?? null,
    volume: record?.volume ?? null,
    status,
    data_warning:
      status === "PASS"
        ? null
        : "Official runtime quote failed validation; do not use it as decision data.",
    issues,
  };
}

async function main() {
  if (!httpEnabled()) {
    console.log(
      JSON.stringify(
        {
          status: "disabled",
          data_warning:
            "CONNECTOR_HTTP_ENABLED is not true; no official request was sent.",
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const cliSymbols = process.argv.slice(2).filter((value) => value !== "--");
  const requestedSymbols =
    cliSymbols.length > 0 ? cliSymbols : DEFAULT_OFFICIAL_RUNTIME_SYMBOLS;
  const resolution = resolveOfficialRuntimeSymbols(requestedSymbols);

  if (resolution.rejected.length > 0 || resolution.allowed.length === 0) {
    console.error(
      JSON.stringify(
        {
          status: "FAIL",
          data_warning: "Runtime symbols failed whitelist validation; no request was sent.",
          issues: resolution.rejected,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const twseSymbols = resolution.allowed
    .filter((item) => item.market === "TWSE")
    .map((item) => item.symbol);
  const tpexSymbols = resolution.allowed
    .filter((item) => item.market === "TPEx")
    .map((item) => item.symbol);
  const results = [];

  // Low-frequency manual execution: at most one read per official market.
  if (twseSymbols.length > 0) {
    const response = await new TwseOfficialPriceReader().read({ symbols: twseSymbols });
    results.push(
      ...twseSymbols.map((symbol) => runtimeResult(symbol, "twse-openapi", response)),
    );
  }
  if (tpexSymbols.length > 0) {
    const response = await new TpexOfficialPriceReader().read({ symbols: tpexSymbols });
    results.push(
      ...tpexSymbols.map((symbol) => runtimeResult(symbol, "tpex-openapi", response)),
    );
  }

  for (const result of results) console.log(JSON.stringify(result, null, 2));
  process.exit(results.some((result) => result.status === "FAIL") ? 1 : 0);
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "FAIL",
        data_warning: "Official runtime test failed before completion.",
        issues: [error instanceof Error ? error.message : "Unknown runtime error."],
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
