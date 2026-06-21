import {
  isValidRecordDate,
  isValidRecordTime,
} from "../../lib/data-quality";
import type { NormalizedOfficialPriceQuote } from "./official-price-normalizer";
import type {
  OfficialPricePipelineIssue,
  OfficialPricePipelineStatus,
  OfficialPriceSourceRole,
} from "./official-price-result";

export const OFFICIAL_PRICE_WARNING_RATIO = 0.01;

export interface OfficialPriceQualityGateResult {
  status: OfficialPricePipelineStatus;
  issues: OfficialPricePipelineIssue[];
  difference_ratio: number | null;
}

function requiredIssues(
  quote: NormalizedOfficialPriceQuote,
  role: Exclude<OfficialPriceSourceRole, "comparison">,
): OfficialPricePipelineIssue[] {
  const issues: OfficialPricePipelineIssue[] = [];

  if (!quote.symbol) {
    issues.push({
      code: "MISSING_SYMBOL",
      severity: "FAIL",
      source_role: role,
      field: "symbol",
      message: `${role} quote is missing symbol.`,
    });
  }
  if (
    quote.close_price === null ||
    !Number.isFinite(quote.close_price) ||
    quote.close_price <= 0
  ) {
    issues.push({
      code: "MISSING_CLOSE_PRICE",
      severity: "FAIL",
      source_role: role,
      field: "close_price",
      message: `${role} quote is missing a valid close price.`,
    });
  }
  if (!quote.record_date) {
    issues.push({
      code: "MISSING_RECORD_DATE",
      severity: "FAIL",
      source_role: role,
      field: "record_date",
      message: `${role} quote is missing record_date.`,
    });
  } else if (!isValidRecordDate(quote.record_date)) {
    issues.push({
      code: "INVALID_RECORD_DATE",
      severity: "FAIL",
      source_role: role,
      field: "record_date",
      message: `${role} record_date is not a valid YYYY-MM-DD date.`,
    });
  }
  if (!quote.record_time) {
    issues.push({
      code: "MISSING_RECORD_TIME",
      severity: "FAIL",
      source_role: role,
      field: "record_time",
      message: `${role} quote is missing record_time.`,
    });
  } else if (!isValidRecordTime(quote.record_time)) {
    issues.push({
      code: "INVALID_RECORD_TIME",
      severity: "FAIL",
      source_role: role,
      field: "record_time",
      message: `${role} record_time is invalid.`,
    });
  }
  if (!quote.source_name) {
    issues.push({
      code: "MISSING_SOURCE_NAME",
      severity: "FAIL",
      source_role: role,
      field: "source_name",
      message: `${role} quote is missing source_name.`,
    });
  }

  return issues;
}

/** Official remains primary. Fallback is comparison-only. */
export function evaluateOfficialPriceQuality(
  official: NormalizedOfficialPriceQuote,
  fallback: NormalizedOfficialPriceQuote,
): OfficialPriceQualityGateResult {
  const issues = [
    ...requiredIssues(official, "official"),
    ...requiredIssues(fallback, "fallback"),
  ];

  if (
    official.source_name &&
    official.source_name !== "twse-openapi" &&
    official.source_name !== "tpex-openapi"
  ) {
    issues.push({
      code: "INVALID_OFFICIAL_SOURCE",
      severity: "FAIL",
      source_role: "official",
      field: "source_name",
      message: "Official quote source must be TWSE or TPEx OpenAPI.",
    });
  }
  if (fallback.source_name && fallback.source_name !== "yahoo-finance") {
    issues.push({
      code: "INVALID_FALLBACK_SOURCE",
      severity: "FAIL",
      source_role: "fallback",
      field: "source_name",
      message: "Fallback quote source must be Yahoo Finance.",
    });
  }
  if (official.symbol && fallback.symbol && official.symbol !== fallback.symbol) {
    issues.push({
      code: "SYMBOL_MISMATCH",
      severity: "FAIL",
      source_role: "comparison",
      field: "comparison",
      message: "Official and fallback symbols do not match.",
    });
  }
  if (
    official.record_date &&
    fallback.record_date &&
    official.record_date !== fallback.record_date
  ) {
    issues.push({
      code: "RECORD_DATE_MISMATCH",
      severity: "FAIL",
      source_role: "comparison",
      field: "comparison",
      message: "Official and fallback record dates do not match.",
    });
  }

  let differenceRatio: number | null = null;
  if (
    !issues.some((issue) => issue.severity === "FAIL") &&
    official.close_price !== null &&
    fallback.close_price !== null
  ) {
    differenceRatio =
      Math.abs(official.close_price - fallback.close_price) /
      official.close_price;
    if (differenceRatio > OFFICIAL_PRICE_WARNING_RATIO) {
      issues.push({
        code: "PRICE_DIVERGENCE",
        severity: "WARNING",
        source_role: "comparison",
        field: "comparison",
        message: "Official and fallback close prices differ by more than 1%.",
      });
    }
  }

  const status: OfficialPricePipelineStatus = issues.some(
    (issue) => issue.severity === "FAIL",
  )
    ? "FAIL"
    : issues.some((issue) => issue.severity === "WARNING")
      ? "WARNING"
      : "PASS";

  return { status, issues, difference_ratio: differenceRatio };
}
