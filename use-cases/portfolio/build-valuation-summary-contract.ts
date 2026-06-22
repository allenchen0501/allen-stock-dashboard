/**
 * Portfolio Valuation Summary — Spec-Only Mock Builder
 *
 * Builds a PortfolioValuationSummaryResponse from hardcoded stock identity.
 * V16 spec-only: all valuation fields are null; tier and signal default to
 * '資料不足' until a real price/EPS pipeline and formula are wired up.
 *
 * Constraints:
 *   - No Supabase connection
 *   - No env key reads
 *   - No HTTP requests
 *   - No real holdings data (cost_price / quantity / owner_id)
 *   - No real valuation formula
 *   - No buy/sell commands
 */

import type {
  PortfolioValuationMarket,
  PortfolioValuationSummaryItem,
  PortfolioValuationSummaryResponse,
} from "./valuation-summary-contract";
import { PORTFOLIO_VALUATION_SUMMARY_METADATA } from "./valuation-summary-contract";

interface SpecOnlyPortfolioIdentity {
  readonly stockId: string;
  readonly stockName: string;
  readonly market: PortfolioValuationMarket;
}

// Spec-only stock identity drawn from the hardcoded portfolio baseline.
// Contains NO cost_price, quantity, or owner_id — those require
// owner-scoped Supabase data which is not available in V16.
const SPEC_ONLY_PORTFOLIO_IDENTITY: readonly SpecOnlyPortfolioIdentity[] = [
  { stockId: "3019", stockName: "亞洲光學", market: "TWSE" },
  { stockId: "4966", stockName: "譜瑞-KY", market: "TWSE" },
  { stockId: "5347", stockName: "世界", market: "TPEx" },
  { stockId: "2455", stockName: "全新", market: "TWSE" },
  { stockId: "4979", stockName: "華星光", market: "TPEx" },
] as const;

function buildSpecOnlyItem(
  identity: SpecOnlyPortfolioIdentity,
): PortfolioValuationSummaryItem {
  return {
    stockId: identity.stockId,
    stockName: identity.stockName,
    market: identity.market,
    price: null,
    change: null,
    changePercent: null,
    valuationTier: "資料不足",
    valuationReason:
      "V16 spec-only contract; valuation formula not enabled.",
    avgCost: null,
    quantity: null,
    unrealizedPnL: null,
    unrealizedPnLPercent: null,
    positionWeight: null,
    ttmEPS: null,
    estimatedEPS: null,
    forwardPE: null,
    fairPrice: null,
    cheapPrice: null,
    expensivePrice: null,
    riskRewardRatio: null,
    technicalStatus: null,
    capitalFlowStatus: null,
    newsSignal: null,
    eventRisk: null,
    actionSignal: "資料不足",
    dataQualityStatus: "WARNING",
  };
}

/**
 * Returns a spec-only Portfolio Valuation Summary response.
 * All valuation-derived fields are null or defaulted to '資料不足'.
 * Metadata is fixed to reflect the spec-only nature of this response.
 */
export function buildPortfolioValuationSummaryContract(): PortfolioValuationSummaryResponse {
  return {
    data: SPEC_ONLY_PORTFOLIO_IDENTITY.map(buildSpecOnlyItem),
    metadata: PORTFOLIO_VALUATION_SUMMARY_METADATA,
  };
}
