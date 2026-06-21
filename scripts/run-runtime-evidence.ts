// @ts-nocheck -- CommonJS-compatible manual runner using the existing TS register.
require("./register-typescript.cjs");

const {
  ConnectorHttpTransport,
} = require("../connectors/transports/http-transport");
const {
  TWSE_OFFICIAL_PRICE_ENDPOINT,
  normalizeTwseOfficialPayload,
} = require("../connectors/twse-official-price-reader");
const {
  TPEX_OFFICIAL_PRICE_ENDPOINT,
  normalizeTpexOfficialPayload,
} = require("../connectors/tpex-official-price-reader");
const {
  recordRuntimeEvidence,
} = require("../connectors/evidence/runtime-evidence-recorder");

const SOURCES = [
  {
    source_name: "twse-openapi",
    symbols: ["2330", "2455"],
    endpoint: TWSE_OFFICIAL_PRICE_ENDPOINT,
    normalize: normalizeTwseOfficialPayload,
  },
  {
    source_name: "tpex-openapi",
    symbols: ["4979", "5347"],
    endpoint: TPEX_OFFICIAL_PRICE_ENDPOINT,
    normalize: normalizeTpexOfficialPayload,
  },
];

function enabled() {
  return process.env.CONNECTOR_HTTP_ENABLED?.trim().toLowerCase() === "true";
}

function validationIssues(source, symbol, transport, record) {
  const issues = [];
  if (transport.status !== "success") {
    issues.push({
      code: transport.errorCode ?? "TRANSPORT_FAILED",
      severity: "FAIL",
      field: "transport",
      message: transport.errorMessage ?? "Official transport failed.",
    });
  }
  if (!record) {
    issues.push({
      code: "MISSING_RECORD",
      severity: "FAIL",
      field: "symbol",
      message: `Official payload contained no record for ${symbol}.`,
    });
    return issues;
  }
  if (!record.record_date?.trim()) {
    issues.push({
      code: "MISSING_RECORD_DATE",
      severity: "FAIL",
      field: "record_date",
      message: "Official record is missing record_date.",
    });
  }
  if (!record.record_time?.trim()) {
    issues.push({
      code: "MISSING_RECORD_TIME",
      severity: "FAIL",
      field: "record_time",
      message: "Official record is missing record_time.",
    });
  }
  if (record.price === null || !Number.isFinite(record.price) || record.price <= 0) {
    issues.push({
      code: "MISSING_CLOSE_PRICE",
      severity: "FAIL",
      field: "close_price",
      message: "Official record is missing a valid close price.",
    });
  }
  if (!record.source_name?.trim()) {
    issues.push({
      code: "MISSING_SOURCE_NAME",
      severity: "FAIL",
      field: "source_name",
      message: "Official record is missing source_name.",
    });
  } else if (record.source_name !== source.source_name) {
    issues.push({
      code: "UNEXPECTED_SOURCE_NAME",
      severity: "FAIL",
      field: "source_name",
      message: "Normalized source_name does not match the requested official source.",
    });
  }
  return issues;
}

async function main() {
  if (!enabled()) {
    console.log(
      JSON.stringify(
        {
          status: "disabled",
          message:
            "CONNECTOR_HTTP_ENABLED is not true; no runtime evidence request was sent.",
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const transport = new ConnectorHttpTransport({ defaultTimeoutMs: 10_000 });
  const evidence = [];

  // Exactly one request per official source; no retry, polling, or persistence.
  for (const source of SOURCES) {
    const response = await transport.getJson({
      url: source.endpoint,
      timeoutMs: 10_000,
    });
    const records =
      response.status === "success" && response.data !== null
        ? source.normalize(response.data, source.symbols)
        : [];

    for (const symbol of source.symbols) {
      const record = records.find((item) => item.symbol === symbol) ?? null;
      const issues = validationIssues(source, symbol, response, record);
      evidence.push(
        recordRuntimeEvidence({
          source_name: source.source_name,
          symbol,
          transport: response,
          raw_payload: response.data,
          record,
          validation_status: issues.length === 0 ? "PASS" : "FAIL",
          issues,
        }),
      );
    }
  }

  for (const item of evidence) {
    console.log(
      JSON.stringify(
        {
          source: item.source_name,
          symbol: item.symbol,
          request_time: item.request_time,
          response_time: item.response_time,
          http_status: item.http_status,
          latency_ms: item.latency_ms,
          schema_hash: item.schema_hash,
          record_date: item.record_date,
          record_time: item.record_time,
          validation_status: item.validation_status,
          issues: item.issues,
        },
        null,
        2,
      ),
    );
  }

  process.exit(
    evidence.some((item) => item.validation_status === "FAIL") ? 1 : 0,
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        validation_status: "FAIL",
        issues: [
          {
            code: "RUNTIME_EVIDENCE_ERROR",
            severity: "FAIL",
            message:
              error instanceof Error ? error.message : "Unknown runtime error.",
          },
        ],
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
