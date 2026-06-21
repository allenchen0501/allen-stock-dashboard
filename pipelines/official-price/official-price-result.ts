export type OfficialPricePipelineStatus = "PASS" | "WARNING" | "FAIL";
export type OfficialPriceSourceRole = "official" | "fallback" | "comparison";

export type OfficialPriceIssueCode =
  | "MISSING_SYMBOL"
  | "MISSING_CLOSE_PRICE"
  | "MISSING_RECORD_DATE"
  | "INVALID_RECORD_DATE"
  | "MISSING_RECORD_TIME"
  | "INVALID_RECORD_TIME"
  | "MISSING_SOURCE_NAME"
  | "INVALID_OFFICIAL_SOURCE"
  | "INVALID_FALLBACK_SOURCE"
  | "SYMBOL_MISMATCH"
  | "RECORD_DATE_MISMATCH"
  | "PRICE_DIVERGENCE";

export interface OfficialPricePipelineIssue {
  code: OfficialPriceIssueCode;
  severity: "WARNING" | "FAIL";
  source_role: OfficialPriceSourceRole;
  field: "symbol" | "close_price" | "record_date" | "record_time" | "source_name" | "comparison";
  message: string;
}

export interface OfficialPricePipelineResult {
  symbol: string;
  close_price: number | null;
  record_date: string;
  record_time: string;
  source_name: string;
  validation_status: OfficialPricePipelineStatus;
  data_warning: boolean;
  decision_allowed: boolean;
  issues: OfficialPricePipelineIssue[];
}
