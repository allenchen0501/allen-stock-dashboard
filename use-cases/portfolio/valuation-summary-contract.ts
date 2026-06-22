/**
 * Portfolio Valuation Summary — TypeScript Contract
 *
 * V16 spec-only contract. Does not depend on DB types or Supabase.
 * All valuation fields are nullable until a real data pipeline is wired up.
 *
 * Source: docs/portfolio-valuation-radar-spec.md (V15)
 */

export type PortfolioValuationMarket = "TWSE" | "TPEx" | "NASDAQ" | "NYSE";

export type PortfolioValuationTier =
  | "特價"
  | "便宜"
  | "合理"
  | "昂貴"
  | "瘋狂"
  | "資料不足";

export type PortfolioActionSignal =
  | "觀察"
  | "可分批"
  | "續抱"
  | "減碼觀察"
  | "避開"
  | "資料不足";

export type PortfolioValuationDataQualityStatus = "PASS" | "WARNING" | "FAIL";

export type PortfolioValuationSummaryItem = {
  stockId: string;
  stockName: string;
  market: PortfolioValuationMarket;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  valuationTier: PortfolioValuationTier;
  valuationReason: string | null;
  avgCost: number | null;
  quantity: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPercent: number | null;
  positionWeight: number | null;
  ttmEPS: number | null;
  estimatedEPS: number | null;
  forwardPE: number | null;
  fairPrice: number | null;
  cheapPrice: number | null;
  expensivePrice: number | null;
  riskRewardRatio: number | null;
  technicalStatus: string | null;
  capitalFlowStatus: string | null;
  newsSignal: string | null;
  eventRisk: string | null;
  actionSignal: PortfolioActionSignal;
  dataQualityStatus: PortfolioValuationDataQualityStatus;
};

export type PortfolioValuationSummaryMetadata = {
  source_mode: "spec_only";
  response_source: "mock_or_contract";
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  model_inference_used: false;
  api_contract_version: "V16";
  sql_migration_created: false;
  stock_valuation_snapshots_created: false;
};

export type PortfolioValuationSummaryResponse = {
  data: PortfolioValuationSummaryItem[];
  metadata: PortfolioValuationSummaryMetadata;
};

export const PORTFOLIO_VALUATION_TIERS: readonly PortfolioValuationTier[] = [
  "特價",
  "便宜",
  "合理",
  "昂貴",
  "瘋狂",
  "資料不足",
] as const;

export const PORTFOLIO_ACTION_SIGNALS: readonly PortfolioActionSignal[] = [
  "觀察",
  "可分批",
  "續抱",
  "減碼觀察",
  "避開",
  "資料不足",
] as const;

export const PORTFOLIO_VALUATION_SUMMARY_METADATA: PortfolioValuationSummaryMetadata =
  {
    source_mode: "spec_only",
    response_source: "mock_or_contract",
    production_write_performed: false,
    request_performed: false,
    supabase_connected: false,
    model_inference_used: false,
    api_contract_version: "V16",
    sql_migration_created: false,
    stock_valuation_snapshots_created: false,
  } as const;
