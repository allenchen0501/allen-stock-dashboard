import {
  DATA_QUALITY_THRESHOLDS,
  classifyDataFreshness,
  hasValidModelInferenceFlag,
  isDataSourceType,
  isHistoricalData,
  isThisWeekData,
  isTodayData,
  isValidRecordDate,
  isValidRecordTime,
  toTaipeiTimestamp,
} from "./rules";
import type {
  DataFreshness,
  DataQualityIssue,
  DataQualityRecordInput,
  DataQualityStatus,
  DataValidationResult,
  QuoteFreshnessOptions,
  SourceComparisonResult,
} from "./types";

const STATUS_PRIORITY: Record<DataQualityStatus, number> = {
  valid: 0,
  stale: 1,
  suspicious: 2,
  invalid: 3,
};

function resolveStatus(issues: readonly DataQualityIssue[]): DataQualityStatus {
  return issues.reduce<DataQualityStatus>(
    (status, issue) =>
      STATUS_PRIORITY[issue.severity] > STATUS_PRIORITY[status]
        ? issue.severity
        : status,
    "valid",
  );
}

function requiredFieldIssues(record: DataQualityRecordInput): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (typeof record.symbol !== "string" || record.symbol.trim() === "") {
    issues.push({
      code: "MISSING_SYMBOL",
      severity: "invalid",
      field: "symbol",
      message: "Data point must include a non-empty symbol.",
    });
  }

  if (typeof record.value !== "number" || !Number.isFinite(record.value)) {
    issues.push({
      code: "INVALID_VALUE",
      severity: "invalid",
      field: "value",
      message: "Data point value must be a finite number.",
      actual: record.value,
    });
  }

  if (typeof record.source_name !== "string" || record.source_name.trim() === "") {
    issues.push({
      code: "MISSING_SOURCE_NAME",
      severity: "invalid",
      field: "source_name",
      message: "Data point must identify its source.",
    });
  }

  if (!isDataSourceType(record.source_type)) {
    issues.push({
      code: "INVALID_SOURCE_TYPE",
      severity: "invalid",
      field: "source_type",
      message: "Data point source_type is missing or unsupported.",
      actual: record.source_type,
    });
  }

  if (
    typeof record.source_confidence !== "number" ||
    !Number.isFinite(record.source_confidence) ||
    record.source_confidence < 0 ||
    record.source_confidence > 100
  ) {
    issues.push({
      code: "INVALID_SOURCE_CONFIDENCE",
      severity: "invalid",
      field: "source_confidence",
      message: "source_confidence must be between 0 and 100.",
      actual: record.source_confidence,
    });
  }

  if (typeof record.is_model_inference !== "boolean") {
    issues.push({
      code: "MISSING_INFERENCE_FLAG",
      severity: "invalid",
      field: "is_model_inference",
      message: "Data point must explicitly declare whether it is model inference.",
    });
  } else if (!hasValidModelInferenceFlag(record)) {
    issues.push({
      code: "MODEL_INFERENCE_NOT_MARKED",
      severity: "invalid",
      field: "is_model_inference",
      message: "Model-sourced data must set is_model_inference to true.",
      actual: record.is_model_inference,
      expected: "true when source_type is model",
    });
  }

  return issues;
}

export function createDataQualityResult<T>(
  data: T,
  issues: DataQualityIssue[] = [],
  freshness: DataFreshness = "unknown",
  validatedAt = new Date(),
): DataValidationResult<T> {
  const status = resolveStatus(issues);
  return {
    status,
    freshness,
    issues,
    data,
    decisionReady: status === "valid",
    referenceOnly: status === "stale",
    validatedAt: validatedAt.toISOString(),
  };
}

export function validateSourceTimestamp(
  record: DataQualityRecordInput,
  now = new Date(),
): DataValidationResult<DataQualityRecordInput> {
  const issues: DataQualityIssue[] = [];

  if (record.record_date === undefined || record.record_date === "") {
    issues.push({
      code: "MISSING_RECORD_DATE",
      severity: "invalid",
      field: "record_date",
      message: "Data point must include record_date.",
    });
  } else if (!isValidRecordDate(record.record_date)) {
    issues.push({
      code: "INVALID_RECORD_DATE",
      severity: "invalid",
      field: "record_date",
      message: "record_date must be a real date in YYYY-MM-DD format.",
      actual: record.record_date,
    });
  }

  if (record.record_time === undefined || record.record_time === "") {
    issues.push({
      code: "MISSING_RECORD_TIME",
      severity: "invalid",
      field: "record_time",
      message: "Data point must include record_time.",
    });
  } else if (!isValidRecordTime(record.record_time)) {
    issues.push({
      code: "INVALID_RECORD_TIME",
      severity: "invalid",
      field: "record_time",
      message: "record_time must use HH:mm, HH:mm:ss, or fractional seconds.",
      actual: record.record_time,
    });
  }

  const timestamp = toTaipeiTimestamp(record.record_date, record.record_time);
  if (
    timestamp &&
    timestamp.getTime() - now.getTime() >
      DATA_QUALITY_THRESHOLDS.futureToleranceMinutes * 60_000
  ) {
    issues.push({
      code: "FUTURE_TIMESTAMP",
      severity: "suspicious",
      field: "record_time",
      message: "Source timestamp is beyond the allowed future clock skew.",
      actual: timestamp.toISOString(),
      expected: `no more than ${DATA_QUALITY_THRESHOLDS.futureToleranceMinutes} minutes in the future`,
    });
  }

  return createDataQualityResult(
    record,
    issues,
    classifyDataFreshness(record.record_date, now),
    now,
  );
}

export function validateQuoteFreshness(
  record: DataQualityRecordInput,
  options: QuoteFreshnessOptions = {},
): DataValidationResult<DataQualityRecordInput> {
  const now = options.now ?? new Date();
  const usage = options.usage ?? "today_war_room";
  const maxAgeMinutes =
    options.maxAgeMinutes ?? DATA_QUALITY_THRESHOLDS.quoteMaxAgeMinutes;
  const timestampResult = validateSourceTimestamp(record, now);
  const issues = [...requiredFieldIssues(record), ...timestampResult.issues];
  let freshness = timestampResult.freshness;
  const timestamp = toTaipeiTimestamp(record.record_date, record.record_time);

  if (usage === "today_war_room" && isValidRecordDate(record.record_date)) {
    if (!isTodayData(record.record_date, now)) {
      issues.push({
        code: "NOT_TODAY_DATA",
        severity: "stale",
        field: "record_date",
        message: "Non-today data cannot be a primary input for today's war room.",
        actual: record.record_date,
        expected: "today in Asia/Taipei",
      });
    } else if (timestamp) {
      const ageMinutes = (now.getTime() - timestamp.getTime()) / 60_000;
      if (ageMinutes > maxAgeMinutes) {
        issues.push({
          code: "STALE_QUOTE",
          severity: "stale",
          field: "record_time",
          message: "Quote is older than the configured freshness threshold.",
          actual: `${Math.floor(ageMinutes)} minutes old`,
          expected: `at most ${maxAgeMinutes} minutes old`,
        });
      } else if (ageMinutes >= -DATA_QUALITY_THRESHOLDS.futureToleranceMinutes) {
        freshness = "current";
      }
    }
  }

  if (
    usage === "weekly_review" &&
    isValidRecordDate(record.record_date) &&
    !isThisWeekData(record.record_date, now)
  ) {
    issues.push({
      code: "NOT_THIS_WEEK_DATA",
      severity: "stale",
      field: "record_date",
      message: "Data is outside the current Asia/Taipei calendar week.",
      actual: record.record_date,
      expected: "a date in the current week",
    });
  }

  if (
    usage === "historical_analysis" &&
    isHistoricalData(record.record_date, now)
  ) {
    freshness = "historical";
  }

  return createDataQualityResult(record, issues, freshness, now);
}

function compareSources(
  metric: "price" | "volume",
  primary: DataQualityRecordInput,
  secondary: DataQualityRecordInput,
  thresholdRatio: number,
): SourceComparisonResult {
  const primaryValidation = validateQuoteFreshness(primary, {
    usage: "historical_analysis",
  });
  const secondaryValidation = validateQuoteFreshness(secondary, {
    usage: "historical_analysis",
  });
  const issues = [...primaryValidation.issues, ...secondaryValidation.issues];
  const primaryValue = primary.value;
  const secondaryValue = secondary.value;
  const valuesAreValid =
    typeof primaryValue === "number" &&
    Number.isFinite(primaryValue) &&
    typeof secondaryValue === "number" &&
    Number.isFinite(secondaryValue) &&
    (metric === "price"
      ? primaryValue > 0 && secondaryValue > 0
      : primaryValue >= 0 && secondaryValue >= 0);
  let differenceRatio: number | null = null;

  if (!valuesAreValid) {
    issues.push({
      code: "INVALID_VALUE",
      severity: "invalid",
      field: "source_comparison",
      message:
        metric === "price"
          ? "Compared prices must both be greater than zero."
          : "Compared volumes must both be zero or greater.",
    });
  } else if (primaryValue === 0) {
    differenceRatio = secondaryValue === 0 ? 0 : null;
  } else {
    differenceRatio = Math.abs(primaryValue - secondaryValue) / primaryValue;
  }

  if (valuesAreValid && (differenceRatio === null || differenceRatio > thresholdRatio)) {
    issues.push({
      code:
        metric === "price"
          ? "PRICE_SOURCE_DIVERGENCE"
          : "VOLUME_SOURCE_DIVERGENCE",
      severity: "suspicious",
      field: "source_comparison",
      message: `${metric} sources differ beyond the allowed threshold.`,
      actual:
        differenceRatio === null
          ? "cannot calculate against a zero primary value"
          : `${(differenceRatio * 100).toFixed(4)}%`,
      expected: `at most ${thresholdRatio * 100}%`,
    });
  }

  const status = resolveStatus(issues);
  return {
    metric,
    status,
    primary,
    secondary,
    differenceRatio,
    differencePercent:
      differenceRatio === null ? null : differenceRatio * 100,
    thresholdRatio,
    issues,
    decisionReady: status === "valid",
  };
}

export function comparePriceSources(
  primary: DataQualityRecordInput,
  secondary: DataQualityRecordInput,
): SourceComparisonResult {
  return compareSources(
    "price",
    primary,
    secondary,
    DATA_QUALITY_THRESHOLDS.priceDifferenceRatio,
  );
}

export function compareVolumeSources(
  primary: DataQualityRecordInput,
  secondary: DataQualityRecordInput,
): SourceComparisonResult {
  return compareSources(
    "volume",
    primary,
    secondary,
    DATA_QUALITY_THRESHOLDS.volumeDifferenceRatio,
  );
}

export function validateDecisionReady(
  results: readonly (DataValidationResult<unknown> | SourceComparisonResult)[],
): boolean {
  return (
    results.length > 0 &&
    results.every(
      (result) => result.status === "valid" && result.decisionReady,
    )
  );
}
