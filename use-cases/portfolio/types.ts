export type PortfolioMode = "hardcoded" | "shadow" | "supabase";
export type ShadowStatus = "pass" | "warning" | "fail";
export type ShadowSeverity = "warning" | "fail";

export interface PortfolioIdentityRecord {
  symbol: string;
  market: string;
  name?: string;
}

export interface DatabasePortfolioShadowRecord extends PortfolioIdentityRecord {
  id: string;
  is_active: boolean;
}

/** Contract only. V3-4.7 does not contain or write a real seed manifest. */
export interface PortfolioSeedRecord extends PortfolioIdentityRecord {
  owner_id: string;
  cost_price: number;
  shares: number;
  position_type: "long" | "short";
  is_active: boolean;
  effective_date: string;
  source_document_ref: string;
  confirmed_by: string;
  confirmed_at: string;
}

export interface PortfolioSeedManifest {
  contract_version: "v3-4.7";
  manifest_id: string;
  owner_id: string;
  created_at: string;
  source_checksum: string;
  records: PortfolioSeedRecord[];
}

export type ShadowDifferenceCode =
  | "DUPLICATE_HARDCODED_IDENTITY"
  | "DUPLICATE_DATABASE_IDENTITY"
  | "MISSING_DATABASE_RECORD"
  | "UNEXPECTED_DATABASE_RECORD"
  | "MARKET_MISMATCH"
  | "NAME_MISMATCH"
  | "INACTIVE_DATABASE_RECORD";

export interface ShadowDifference {
  code: ShadowDifferenceCode;
  severity: ShadowSeverity;
  symbol: string;
  hardcoded_market?: string;
  database_market?: string;
  message: string;
}

export interface ShadowComparisonContext {
  comparison_id: string;
  compared_at: string;
  hardcoded_version: string;
  database_snapshot_id: string;
}

export interface ShadowComparisonInput {
  context: ShadowComparisonContext;
  hardcoded: readonly PortfolioIdentityRecord[];
  database: readonly DatabasePortfolioShadowRecord[];
}

export interface ShadowComparisonMetrics {
  hardcoded_count: number;
  database_total_count: number;
  database_active_count: number;
  matched_count: number;
  warning_count: number;
  failure_count: number;
}

export interface ShadowComparisonResult {
  context: ShadowComparisonContext;
  status: ShadowStatus;
  response_source: "hardcoded";
  identity_parity: boolean;
  metrics: ShadowComparisonMetrics;
  differences: ShadowDifference[];
}

export interface PortfolioModePolicy {
  allow_shadow: boolean;
  allow_supabase: boolean;
}

export interface PortfolioModeResolution {
  requested_mode: string | null;
  effective_mode: PortfolioMode;
  fallback_applied: boolean;
  warnings: string[];
}

export interface PortfolioShadowReport {
  report_version: "v3-4.7";
  comparison_id: string;
  compared_at: string;
  mode: "shadow";
  response_source: "hardcoded";
  status: ShadowStatus;
  identity_parity: boolean;
  metrics: ShadowComparisonMetrics;
  differences: ShadowDifference[];
  contains_sensitive_values: false;
  recommendation: "continue_shadow" | "block_rollout";
}
