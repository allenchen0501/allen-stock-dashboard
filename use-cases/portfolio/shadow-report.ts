import type {
  PortfolioShadowReport,
  ShadowComparisonResult,
} from "./types";

/** Creates a serializable, non-sensitive report; never changes response mode. */
export function createPortfolioShadowReport(
  comparison: ShadowComparisonResult,
): PortfolioShadowReport {
  return {
    report_version: "v3-4.7",
    comparison_id: comparison.context.comparison_id,
    compared_at: comparison.context.compared_at,
    mode: "shadow",
    response_source: "hardcoded",
    status: comparison.status,
    identity_parity: comparison.identity_parity,
    metrics: { ...comparison.metrics },
    differences: comparison.differences.map((difference) => ({ ...difference })),
    contains_sensitive_values: false,
    recommendation:
      comparison.status === "fail" ? "block_rollout" : "continue_shadow",
  };
}
