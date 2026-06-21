import type { NormalizedQuoteRecord } from "./types";

export interface OfficialPriceValidationIssue {
  code:
    | "MISSING_SYMBOL"
    | "MISSING_PRICE"
    | "MISSING_RECORD_DATE"
    | "MISSING_RECORD_TIME"
    | "MISSING_SOURCE"
    | "SYMBOL_MISMATCH"
    | "PRICE_DIVERGENCE";
  severity: "WARNING" | "FAIL";
  message: string;
}

export interface OfficialPriceValidationResult {
  source_name: string;
  record_date: string;
  record_time: string;
  status: "PASS" | "WARNING" | "FAIL";
  issues: OfficialPriceValidationIssue[];
  difference_ratio: number | null;
  data_warning: string | null;
}

const PRICE_WARNING_RATIO = 0.01;

function missingIssues(
  record: NormalizedQuoteRecord,
  role: "official" | "fallback",
): OfficialPriceValidationIssue[] {
  const issues: OfficialPriceValidationIssue[] = [];
  if (!record.symbol.trim()) {
    issues.push({
      code: "MISSING_SYMBOL",
      severity: "FAIL",
      message: `${role} quote is missing symbol.`,
    });
  }
  if (record.price === null || !Number.isFinite(record.price) || record.price <= 0) {
    issues.push({
      code: "MISSING_PRICE",
      severity: "FAIL",
      message: `${role} quote is missing a valid price.`,
    });
  }
  if (!record.record_date.trim()) {
    issues.push({
      code: "MISSING_RECORD_DATE",
      severity: "FAIL",
      message: `${role} quote is missing record_date.`,
    });
  }
  if (!record.record_time.trim()) {
    issues.push({
      code: "MISSING_RECORD_TIME",
      severity: "FAIL",
      message: `${role} quote is missing record_time.`,
    });
  }
  if (!record.source_name.trim()) {
    issues.push({
      code: "MISSING_SOURCE",
      severity: "FAIL",
      message: `${role} quote is missing source_name.`,
    });
  }
  return issues;
}

/** Official is primary; Yahoo is comparison-only and never replaces it. */
export function validateOfficialPrice(
  official: NormalizedQuoteRecord,
  yahooFallback: NormalizedQuoteRecord,
): OfficialPriceValidationResult {
  const issues = [
    ...missingIssues(official, "official"),
    ...missingIssues(yahooFallback, "fallback"),
  ];

  if (
    official.symbol.trim() &&
    yahooFallback.symbol.trim() &&
    official.symbol.trim() !== yahooFallback.symbol.trim()
  ) {
    issues.push({
      code: "SYMBOL_MISMATCH",
      severity: "FAIL",
      message: "Official and Yahoo symbols do not match.",
    });
  }

  let differenceRatio: number | null = null;
  if (
    issues.every((issue) => issue.severity !== "FAIL") &&
    official.price !== null &&
    yahooFallback.price !== null
  ) {
    differenceRatio =
      Math.abs(official.price - yahooFallback.price) / official.price;
    if (differenceRatio > PRICE_WARNING_RATIO) {
      issues.push({
        code: "PRICE_DIVERGENCE",
        severity: "WARNING",
        message: "Official and Yahoo prices differ by more than 1%.",
      });
    }
  }

  const status = issues.some((issue) => issue.severity === "FAIL")
    ? "FAIL"
    : issues.some((issue) => issue.severity === "WARNING")
      ? "WARNING"
      : "PASS";

  return {
    source_name: official.source_name,
    record_date: official.record_date,
    record_time: official.record_time,
    status,
    issues,
    difference_ratio: differenceRatio,
    data_warning:
      status === "PASS"
        ? null
        : status === "WARNING"
          ? "Official and fallback prices require review; official data remains primary."
          : "Official price validation failed; do not use this quote for decisions.",
  };
}
