// @ts-nocheck -- CommonJS-compatible manual runner using the existing TS register.
require("./register-typescript.cjs");

const {
  ConnectorHttpTransport,
} = require("../connectors/transports/http-transport");
const {
  TWSE_OFFICIAL_PRICE_ENDPOINT,
} = require("../connectors/twse-official-price-reader");
const {
  TPEX_OFFICIAL_PRICE_ENDPOINT,
} = require("../connectors/tpex-official-price-reader");
const {
  OFFICIAL_SCHEMA_ALIAS_CONTRACTS,
} = require("../connectors/evidence/schema-alias-contract");
const {
  createSchemaDescriptor,
  matchedRecordTimeAliases,
} = require("../connectors/evidence/schema-descriptor");

const SOURCES = [
  {
    source_name: "twse-openapi",
    endpoint: TWSE_OFFICIAL_PRICE_ENDPOINT,
  },
  {
    source_name: "tpex-openapi",
    endpoint: TPEX_OFFICIAL_PRICE_ENDPOINT,
  },
];

function enabled() {
  return process.env.CONNECTOR_HTTP_ENABLED?.trim().toLowerCase() === "true";
}

function schemaHash(descriptor) {
  return descriptor[0]?.schema_hash ?? null;
}

async function main() {
  if (!enabled()) {
    console.log(
      JSON.stringify(
        {
          status: "disabled",
          message:
            "CONNECTOR_HTTP_ENABLED is not true; no schema descriptor request was sent.",
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const transport = new ConnectorHttpTransport({ defaultTimeoutMs: 10_000 });
  let verificationFailed = false;

  // Exactly one request per source. No retries, polling, persistence, or raw output.
  for (const source of SOURCES) {
    const response = await transport.getJson({
      url: source.endpoint,
      timeoutMs: 10_000,
    });
    const contract = OFFICIAL_SCHEMA_ALIAS_CONTRACTS[source.source_name];
    const descriptor =
      response.status === "success" && response.data !== null
        ? createSchemaDescriptor(response.data, contract)
        : [];
    const timeAliases = matchedRecordTimeAliases(descriptor);
    const passed = response.status === "success" && timeAliases.length > 0;
    verificationFailed ||= !passed;

    console.log(
      JSON.stringify(
        {
          source_name: source.source_name,
          http_status: response.httpStatus,
          verification_status: passed ? "PASS" : "FAIL",
          schema_hash: schemaHash(descriptor),
          record_time_alias_matched: timeAliases.length > 0,
          record_time_aliases: timeAliases,
          fields: descriptor,
          issues:
            response.status !== "success"
              ? [response.errorCode ?? "TRANSPORT_FAILED"]
              : timeAliases.length === 0
                ? ["RECORD_TIME_ALIAS_NOT_MATCHED"]
                : [],
        },
        null,
        2,
      ),
    );
  }

  process.exit(verificationFailed ? 1 : 0);
}

main().catch(() => {
  console.error(
    JSON.stringify(
      {
        verification_status: "FAIL",
        issues: ["SCHEMA_DESCRIPTOR_VERIFICATION_ERROR"],
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
