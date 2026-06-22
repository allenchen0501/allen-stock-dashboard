/**
 * Portfolio Valuation Tier — Pure Function Skeletons
 *
 * V16 skeletons. Both functions default to '資料不足' until the valuation
 * formula is documented and a real price/EPS pipeline is wired up.
 *
 * Constraints (permanent):
 *   - No external data fetching
 *   - No Supabase connection
 *   - No env key reads
 *   - No buy/sell commands in output ('買進' / '賣出' must never appear)
 *   - actionSignal must not trigger automated trades
 */

import type {
  PortfolioActionSignal,
  PortfolioValuationDataQualityStatus,
  PortfolioValuationTier,
} from "./valuation-summary-contract";

export interface ValuationTierInput {
  price?: number | null;
  ttmEPS?: number | null;
  estimatedEPS?: number | null;
  forwardPE?: number | null;
  dataQualityStatus?: PortfolioValuationDataQualityStatus | null;
}

export interface ActionSignalInput {
  valuationTier: PortfolioValuationTier;
  dataQualityStatus?: PortfolioValuationDataQualityStatus | null;
  technicalStatus?: string | null;
  capitalFlowStatus?: string | null;
}

/**
 * Resolves the valuation tier for a single stock.
 *
 * V16 skeleton: returns '資料不足' when any required input is missing.
 * Future versions will implement PE-band logic once:
 *   1. Official price pipeline (TWSE/TPEx) is stable.
 *   2. EPS / estimated EPS source is audited and documented.
 *   3. valuationTier formula (PE percentile bands) is finalised in docs.
 */
export function resolvePortfolioValuationTier(
  input: ValuationTierInput,
): PortfolioValuationTier {
  const hasPrice =
    input.price != null && Number.isFinite(input.price) && input.price > 0;
  const hasEPS =
    (input.ttmEPS != null && Number.isFinite(input.ttmEPS) && input.ttmEPS > 0) ||
    (input.estimatedEPS != null &&
      Number.isFinite(input.estimatedEPS) &&
      input.estimatedEPS > 0);
  const dataQualityOk =
    input.dataQualityStatus == null || input.dataQualityStatus === "PASS";

  if (!hasPrice || !hasEPS || !dataQualityOk) {
    return "資料不足";
  }

  // V16: formula not yet implemented — always return '資料不足' until
  // PE-band thresholds are documented in portfolio-valuation-radar-spec.md.
  return "資料不足";
}

/**
 * Resolves the action signal for a single stock.
 *
 * V16 skeleton: conservative default — returns '資料不足' whenever
 * valuationTier is '資料不足' or data quality is not PASS.
 *
 * Output constraints (permanent):
 *   - Must never contain '買進' or '賣出'.
 *   - Must not trigger automated trades.
 *   - Serves as decision aid only; Allen makes the final call.
 */
export function resolvePortfolioActionSignal(
  input: ActionSignalInput,
): PortfolioActionSignal {
  if (input.valuationTier === "資料不足") {
    return "資料不足";
  }

  const dataQualityOk =
    input.dataQualityStatus == null || input.dataQualityStatus === "PASS";

  if (!dataQualityOk) {
    return "資料不足";
  }

  // V16: signal logic not yet implemented — always '觀察' once tier is known.
  // Future versions will factor in technicalStatus and capitalFlowStatus.
  return "觀察";
}
