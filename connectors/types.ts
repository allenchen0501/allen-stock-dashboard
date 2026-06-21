import type { DataQualityStatus, DataSourceType } from "../lib/data-quality";

export type ConnectorSourceName =
  | "twse-openapi"
  | "tpex-openapi"
  | "yahoo-finance";

export type ConnectorMarket = "TWSE" | "TPEx" | "US" | "GLOBAL";

export type ConnectorStatus = "disabled" | "success" | "partial" | "failed";

export interface ConnectorRequestOptions {
  symbols: readonly string[];
  requestedAt?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fixtureOnly?: true;
}

export type ConnectorErrorCode =
  | "CONNECTOR_DISABLED"
  | "INVALID_REQUEST"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "NORMALIZATION_FAILED"
  | "VALIDATION_FAILED"
  | "UPSTREAM_UNAVAILABLE";

export interface ConnectorError {
  code: ConnectorErrorCode;
  message: string;
  retryable: boolean;
  sourceName: ConnectorSourceName;
}

export interface ConnectorResponse<TRecord> {
  sourceName: ConnectorSourceName;
  status: ConnectorStatus;
  records: TRecord[];
  warnings: string[];
  errors: ConnectorError[];
  requestedAt: string | null;
  completedAt: string | null;
  fromFixture: boolean;
}

export interface NormalizedQuoteRecord {
  symbol: string;
  market: ConnectorMarket;
  price: number | null;
  volume: number | null;
  currency: "TWD" | "USD" | null;
  record_date: string;
  record_time: string;
  source_name: ConnectorSourceName;
  source_type: DataSourceType;
  source_confidence: number;
  data_frequency: "daily_close" | "delayed_quote" | "global_snapshot";
  is_model_inference: false;
}

export interface ConnectorValidationOptions {
  now?: Date;
  usage?: "today_war_room" | "weekly_review" | "historical_analysis";
  maxAgeMinutes?: number;
  expectedMarkets?: readonly ConnectorMarket[];
}

export interface ConnectorValidationIssue {
  code: string;
  severity: Exclude<DataQualityStatus, "valid">;
  message: string;
  symbol: string;
  field?: string;
}

export interface ConnectorRecordValidation {
  symbol: string;
  status: "PASS" | "WARNING" | "FAIL";
  dataQualityStatus: DataQualityStatus;
  issues: ConnectorValidationIssue[];
  data_warning: string | null;
}

export interface ConnectorValidationResult {
  status: "PASS" | "WARNING" | "FAIL";
  records: ConnectorRecordValidation[];
  decisionAllowed: boolean;
  data_warning: string | null;
}

export interface QuoteFixtureCase<TRawRecord> {
  scenario: string;
  expectedStatus: "PASS" | "WARNING" | "FAIL";
  raw: TRawRecord;
}
