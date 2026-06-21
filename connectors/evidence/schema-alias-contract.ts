import type { ConnectorSourceName } from "../types";

export type OfficialSchemaSource = Extract<
  ConnectorSourceName,
  "twse-openapi" | "tpex-openapi"
>;

export type CanonicalQuoteField =
  | "symbol"
  | "close_price"
  | "volume"
  | "record_date"
  | "record_time"
  | "source_name";

export type AliasEvidenceStatus =
  | "configured_candidate"
  | "attempted_not_resolved"
  | "candidate_unverified";

export type RuntimeResolution = "resolved" | "not_resolved" | "not_evaluated";

export interface SchemaAliasCandidate {
  readonly alias: string;
  readonly evidence_status: AliasEvidenceStatus;
  readonly approved: false;
}

export interface SchemaAliasFieldContract {
  readonly canonical_field: CanonicalQuoteField;
  readonly origin: "payload" | "adapter_metadata";
  readonly runtime_resolution: RuntimeResolution;
  readonly aliases: readonly SchemaAliasCandidate[];
  readonly missing_value: null;
  readonly missing_behavior: "FAIL" | "validation_policy_unchanged";
}

export interface OfficialSchemaAliasContract {
  readonly contract_version: "V10.7";
  readonly source_name: OfficialSchemaSource;
  readonly aliases_require_manual_approval: true;
  readonly automatic_alias_selection: false;
  readonly automatic_field_correction: false;
  readonly fields: readonly SchemaAliasFieldContract[];
}

const configured = (alias: string): SchemaAliasCandidate => ({
  alias,
  evidence_status: "configured_candidate",
  approved: false,
});

const attemptedTime = (alias: string): SchemaAliasCandidate => ({
  alias,
  evidence_status: "attempted_not_resolved",
  approved: false,
});

const unverifiedTime = (alias: string): SchemaAliasCandidate => ({
  alias,
  evidence_status: "candidate_unverified",
  approved: false,
});

const timeAliases = [
  attemptedTime("Time"),
  attemptedTime("time"),
  attemptedTime("TradeTime"),
  attemptedTime("資料時間"),
  unverifiedTime("record_time"),
  unverifiedTime("update_time"),
  unverifiedTime("trade_time"),
  unverifiedTime("data_time"),
  unverifiedTime("timestamp"),
] as const;

export const TWSE_SCHEMA_ALIAS_CONTRACT = {
  contract_version: "V10.7",
  source_name: "twse-openapi",
  aliases_require_manual_approval: true,
  automatic_alias_selection: false,
  automatic_field_correction: false,
  fields: [
    {
      canonical_field: "symbol",
      origin: "payload",
      runtime_resolution: "resolved",
      aliases: [configured("Code"), configured("code"), configured("StockNo"), configured("證券代號")],
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "close_price",
      origin: "payload",
      runtime_resolution: "resolved",
      aliases: [
        configured("ClosingPrice"),
        configured("Close"),
        configured("close"),
        configured("收盤價"),
      ],
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "volume",
      origin: "payload",
      runtime_resolution: "not_evaluated",
      aliases: [
        configured("TradeVolume"),
        configured("TradingShares"),
        configured("volume"),
        configured("成交股數"),
      ],
      missing_value: null,
      missing_behavior: "validation_policy_unchanged",
    },
    {
      canonical_field: "record_date",
      origin: "payload",
      runtime_resolution: "resolved",
      aliases: [configured("Date"), configured("date"), configured("TradeDate"), configured("資料日期")],
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "record_time",
      origin: "payload",
      runtime_resolution: "not_resolved",
      aliases: timeAliases,
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "source_name",
      origin: "adapter_metadata",
      runtime_resolution: "resolved",
      aliases: [],
      missing_value: null,
      missing_behavior: "FAIL",
    },
  ],
} as const satisfies OfficialSchemaAliasContract;

export const TPEX_SCHEMA_ALIAS_CONTRACT = {
  contract_version: "V10.7",
  source_name: "tpex-openapi",
  aliases_require_manual_approval: true,
  automatic_alias_selection: false,
  automatic_field_correction: false,
  fields: [
    {
      canonical_field: "symbol",
      origin: "payload",
      runtime_resolution: "resolved",
      aliases: [
        configured("SecuritiesCompanyCode"),
        configured("Code"),
        configured("code"),
        configured("證券代號"),
      ],
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "close_price",
      origin: "payload",
      runtime_resolution: "resolved",
      aliases: [
        configured("Close"),
        configured("ClosingPrice"),
        configured("close"),
        configured("收盤價"),
      ],
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "volume",
      origin: "payload",
      runtime_resolution: "not_evaluated",
      aliases: [
        configured("TradingShares"),
        configured("TradeVolume"),
        configured("volume"),
        configured("成交股數"),
      ],
      missing_value: null,
      missing_behavior: "validation_policy_unchanged",
    },
    {
      canonical_field: "record_date",
      origin: "payload",
      runtime_resolution: "resolved",
      aliases: [configured("Date"), configured("date"), configured("TradeDate"), configured("資料日期")],
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "record_time",
      origin: "payload",
      runtime_resolution: "not_resolved",
      aliases: timeAliases,
      missing_value: null,
      missing_behavior: "FAIL",
    },
    {
      canonical_field: "source_name",
      origin: "adapter_metadata",
      runtime_resolution: "resolved",
      aliases: [],
      missing_value: null,
      missing_behavior: "FAIL",
    },
  ],
} as const satisfies OfficialSchemaAliasContract;

export const OFFICIAL_SCHEMA_ALIAS_CONTRACTS = {
  "twse-openapi": TWSE_SCHEMA_ALIAS_CONTRACT,
  "tpex-openapi": TPEX_SCHEMA_ALIAS_CONTRACT,
} as const;
