export type DataSourceType =
  | "official_exchange"
  | "market_api"
  | "financial_platform"
  | "broker"
  | "manual"
  | "calculated"
  | "model";

export type DataFreshness =
  | "current"
  | "today"
  | "this_week"
  | "historical"
  | "future"
  | "unknown";

export type DataQualityStatus =
  | "valid"
  | "stale"
  | "suspicious"
  | "invalid";

export type DataQualityIssueCode =
  | "MISSING_SYMBOL"
  | "INVALID_VALUE"
  | "MISSING_RECORD_DATE"
  | "MISSING_RECORD_TIME"
  | "INVALID_RECORD_DATE"
  | "INVALID_RECORD_TIME"
  | "FUTURE_TIMESTAMP"
  | "MISSING_SOURCE_NAME"
  | "INVALID_SOURCE_TYPE"
  | "INVALID_SOURCE_CONFIDENCE"
  | "MISSING_INFERENCE_FLAG"
  | "MODEL_INFERENCE_NOT_MARKED"
  | "STALE_QUOTE"
  | "NOT_TODAY_DATA"
  | "NOT_THIS_WEEK_DATA"
  | "PRICE_SOURCE_DIVERGENCE"
  | "VOLUME_SOURCE_DIVERGENCE";

export interface DataQualityRecord {
  symbol: string;
  value: number;
  record_date: string;
  record_time: string;
  source_name: string;
  source_type: DataSourceType;
  source_confidence: number;
  is_model_inference: boolean;
}

/** Partial allows validators to report missing runtime fields instead of crashing. */
export type DataQualityRecordInput = Partial<DataQualityRecord>;

export interface DataQualityIssue {
  code: DataQualityIssueCode;
  severity: Exclude<DataQualityStatus, "valid">;
  field?: keyof DataQualityRecord | "source_comparison";
  message: string;
  actual?: unknown;
  expected?: string;
}

export interface DataValidationResult<T = DataQualityRecordInput> {
  status: DataQualityStatus;
  freshness: DataFreshness;
  issues: DataQualityIssue[];
  data: T;
  decisionReady: boolean;
  referenceOnly: boolean;
  validatedAt: string;
}

export interface SourceComparisonResult {
  metric: "price" | "volume";
  status: DataQualityStatus;
  primary: DataQualityRecordInput;
  secondary: DataQualityRecordInput;
  differenceRatio: number | null;
  differencePercent: number | null;
  thresholdRatio: number;
  issues: DataQualityIssue[];
  decisionReady: boolean;
}

export interface QuoteFreshnessOptions {
  now?: Date;
  usage?: "today_war_room" | "weekly_review" | "historical_analysis";
  maxAgeMinutes?: number;
}
