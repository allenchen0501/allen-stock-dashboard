import {
  comparePriceSources,
  createDataQualityResult,
  validateDecisionReady,
  validateQuoteFreshness,
  type DataQualityIssue,
  type DataQualityRecordInput,
  type DataValidationResult,
  type QuoteFreshnessOptions,
  type SourceComparisonResult,
} from "@/lib/data-quality";

export interface PortfolioQuoteValidation {
  result: DataValidationResult<DataQualityRecordInput>;
  comparison: SourceComparisonResult | null;
  canEnterDecision: boolean;
  canUseAsReference: boolean;
}

function uniqueIssues(issues: readonly DataQualityIssue[]): DataQualityIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}:${String(issue.field)}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Applies V3-3.5 freshness and optional two-source price comparison rules. */
export function validatePortfolioQuote(
  primary: DataQualityRecordInput,
  secondary?: DataQualityRecordInput,
  options: QuoteFreshnessOptions = {},
): PortfolioQuoteValidation {
  const freshness = validateQuoteFreshness(primary, options);
  const comparison = secondary
    ? comparePriceSources(primary, secondary)
    : null;
  const portfolioIssues: DataQualityIssue[] = [];
  if (
    typeof primary.value === "number" &&
    Number.isFinite(primary.value) &&
    primary.value <= 0
  ) {
    portfolioIssues.push({
      code: "INVALID_VALUE",
      severity: "invalid",
      field: "value",
      message: "Portfolio current price must be greater than zero.",
      actual: primary.value,
    });
  }
  const issues = uniqueIssues([
    ...freshness.issues,
    ...(comparison?.issues ?? []),
    ...portfolioIssues,
  ]);
  const result = createDataQualityResult(
    primary,
    issues,
    freshness.freshness,
    options.now,
  );
  const readinessInputs = comparison ? [result, comparison] : [result];
  const canEnterDecision = validateDecisionReady(readinessInputs);

  return {
    result: {
      ...result,
      decisionReady: canEnterDecision,
      referenceOnly: result.status === "stale",
    },
    comparison,
    canEnterDecision,
    canUseAsReference:
      result.status === "valid" || result.status === "stale",
  };
}
