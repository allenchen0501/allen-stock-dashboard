import { validateQuoteFreshness } from "../lib/data-quality";
import type {
  ConnectorMarket,
  ConnectorRecordValidation,
  ConnectorRequestOptions,
  ConnectorResponse,
  ConnectorSourceName,
  ConnectorValidationIssue,
  ConnectorValidationOptions,
  ConnectorValidationResult,
  NormalizedQuoteRecord,
} from "./types";

export interface BaseConnector<TRawRecord> {
  readonly sourceName: ConnectorSourceName;
  readonly timeoutMs: number;
  readonly rateLimitPerMinute: number;
  fetchQuotes(
    options: ConnectorRequestOptions,
  ): Promise<ConnectorResponse<TRawRecord>>;
  normalize(records: readonly TRawRecord[]): NormalizedQuoteRecord[];
  validate(
    records: readonly NormalizedQuoteRecord[],
    options?: ConnectorValidationOptions,
  ): ConnectorValidationResult;
}

export function createDisabledConnectorResponse<TRecord>(
  sourceName: ConnectorSourceName,
  options: ConnectorRequestOptions,
): ConnectorResponse<TRecord> {
  return {
    sourceName,
    status: "disabled",
    records: [],
    warnings: [
      "Real transport is disabled in V3-6.5; use local fixtures only.",
    ],
    errors: [
      {
        code: "CONNECTOR_DISABLED",
        message: "Connector transport is not enabled until V7.",
        retryable: false,
        sourceName,
      },
    ],
    requestedAt: options.requestedAt ?? null,
    completedAt: null,
    fromFixture: false,
  };
}

function recordStatus(
  issues: readonly ConnectorValidationIssue[],
): ConnectorRecordValidation["status"] {
  if (
    issues.some(
      (issue) => issue.severity === "invalid" || issue.severity === "suspicious",
    )
  ) {
    return "FAIL";
  }
  if (issues.some((issue) => issue.severity === "stale")) return "WARNING";
  return "PASS";
}

function dataQualityStatus(
  issues: readonly ConnectorValidationIssue[],
): ConnectorRecordValidation["dataQualityStatus"] {
  if (issues.some((issue) => issue.severity === "invalid")) return "invalid";
  if (issues.some((issue) => issue.severity === "suspicious")) {
    return "suspicious";
  }
  if (issues.some((issue) => issue.severity === "stale")) return "stale";
  return "valid";
}

export function validateNormalizedQuotes(
  records: readonly NormalizedQuoteRecord[],
  options: ConnectorValidationOptions = {},
): ConnectorValidationResult {
  if (records.length === 0) {
    return {
      status: "FAIL",
      records: [],
      decisionAllowed: false,
      data_warning: "Connector returned no quote records.",
    };
  }

  const validations = records.map<ConnectorRecordValidation>((record) => {
    const validation = validateQuoteFreshness(
      {
        symbol: record.symbol,
        value: record.price ?? undefined,
        record_date: record.record_date,
        record_time: record.record_time,
        source_name: record.source_name,
        source_type: record.source_type,
        source_confidence: record.source_confidence,
        is_model_inference: record.is_model_inference,
      },
      {
        now: options.now,
        usage: options.usage,
        maxAgeMinutes: options.maxAgeMinutes,
      },
    );
    const issues: ConnectorValidationIssue[] = validation.issues.map(
      (issue) => ({
        code: issue.code,
        severity: issue.severity,
        message: issue.message,
        symbol: record.symbol,
        field: issue.field,
      }),
    );

    if (
      record.price !== null &&
      (!Number.isFinite(record.price) || record.price <= 0)
    ) {
      issues.push({
        code: "INVALID_PRICE",
        severity: "invalid",
        message: "Normalized price must be greater than zero.",
        symbol: record.symbol,
        field: "price",
      });
    }

    if (
      record.volume !== null &&
      (!Number.isFinite(record.volume) || record.volume < 0)
    ) {
      issues.push({
        code: "INVALID_VOLUME",
        severity: "invalid",
        message: "Normalized volume must be zero or greater when present.",
        symbol: record.symbol,
        field: "volume",
      });
    }

    if (
      options.expectedMarkets &&
      !options.expectedMarkets.includes(record.market)
    ) {
      issues.push({
        code: "INVALID_MARKET",
        severity: "invalid",
        message: `Market ${record.market} is not valid for this connector.`,
        symbol: record.symbol,
        field: "market",
      });
    }

    const status = recordStatus(issues);
    return {
      symbol: record.symbol,
      status,
      dataQualityStatus: dataQualityStatus(issues),
      issues,
      data_warning:
        status === "PASS"
          ? null
          : `Quote ${record.symbol || "(missing symbol)"} is ${status}.`,
    };
  });
  const status = validations.some((record) => record.status === "FAIL")
    ? "FAIL"
    : validations.some((record) => record.status === "WARNING")
      ? "WARNING"
      : "PASS";

  return {
    status,
    records: validations,
    decisionAllowed: status === "PASS",
    data_warning:
      status === "PASS"
        ? null
        : `Connector batch is ${status}; it cannot be a primary decision input.`,
  };
}

export function normalizeMarket(
  value: unknown,
  fallback: ConnectorMarket,
): ConnectorMarket {
  if (value === "TWSE" || value === "TPEx" || value === "US" || value === "GLOBAL") {
    return value;
  }
  return fallback;
}
