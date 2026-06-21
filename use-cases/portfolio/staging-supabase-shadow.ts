import type { PortfolioStock } from "@/lib/types/database";
import type { PortfolioRepository } from "@/repositories/portfolio-repository";
import {
  HARDCODED_FIXTURE_VERSION,
  HARDCODED_PORTFOLIO_FIXTURE,
} from "./fixtures/hardcoded-fixture";
import { comparePortfolioShadow } from "./shadow-comparison";
import type {
  StagingParityStatus,
  StagingShadowIssue,
  StagingShadowIssueCode,
  StagingShadowResult,
  StagingShadowStatus,
} from "./staging-shadow-result";

export type StagingPortfolioRepository = Pick<
  PortfolioRepository,
  "getActivePortfolioStocks"
>;

export interface StagingSupabaseShadowOptions {
  comparison_id?: string;
  database_snapshot_id?: string;
  compared_at?: string;
}

const RLS_ERROR_PATTERN =
  /row[- ]level security|\brls\b|permission denied|not authorized|unauthorized|42501/i;

function isServerRuntime(): boolean {
  return typeof window === "undefined";
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const message = "message" in error ? String(error.message) : "";
    const code = "code" in error ? String(error.code) : "";
    return `${code} ${message}`.trim();
  }
  return String(error);
}

function isRlsBlocked(error: unknown): boolean {
  if (RLS_ERROR_PATTERN.test(errorText(error))) return true;
  if (
    error instanceof Error &&
    "cause" in error &&
    error.cause !== undefined
  ) {
    return RLS_ERROR_PATTERN.test(errorText(error.cause));
  }
  return false;
}

function isValidActiveRow(stock: PortfolioStock): boolean {
  return (
    typeof stock.id === "string" &&
    stock.id.trim().length > 0 &&
    typeof stock.symbol === "string" &&
    stock.symbol.trim().length > 0 &&
    typeof stock.name === "string" &&
    stock.name.trim().length > 0 &&
    typeof stock.market === "string" &&
    stock.market.trim().length > 0 &&
    stock.is_active === true &&
    Number.isFinite(Number(stock.cost_price)) &&
    Number(stock.cost_price) >= 0 &&
    Number.isFinite(Number(stock.shares)) &&
    Number(stock.shares) > 0 &&
    (stock.position_type === "long" || stock.position_type === "short")
  );
}

function toStatus(status: "pass" | "warning" | "fail"): StagingShadowStatus {
  if (status === "pass") return "PASS";
  if (status === "warning") return "WARNING";
  return "FAIL";
}

function failedResult(
  code: StagingShadowIssueCode,
  message: string,
): StagingShadowResult {
  return {
    mode: "shadow",
    source: "hardcoded",
    status: "FAIL",
    issues: [{ code, severity: "FAIL", message }],
    parity_status: "NOT_RUN",
    fallback_used: true,
    decision_allowed: false,
    data_warning: `${message} Hardcoded Portfolio fallback remains active.`,
  };
}

/**
 * Reads a repository supplied by a future staging composition root. It never
 * creates a Supabase client and returns metadata only, never Portfolio data.
 */
export class StagingSupabasePortfolioShadow {
  constructor(private readonly repository: StagingPortfolioRepository) {}

  async run(
    options: StagingSupabaseShadowOptions = {},
  ): Promise<StagingShadowResult> {
    if (!isServerRuntime()) {
      return failedResult(
        "VALIDATION_FAILED",
        "Staging Supabase Portfolio Shadow is server-only.",
      );
    }

    let rawRows: unknown;
    try {
      rawRows = await this.repository.getActivePortfolioStocks();
    } catch (error) {
      if (isRlsBlocked(error)) {
        return failedResult(
          "RLS_BLOCKED",
          "Staging Portfolio read was blocked by RLS or database permissions.",
        );
      }
      return failedResult(
        "REPOSITORY_ERROR",
        "Staging Portfolio repository read failed.",
      );
    }

    if (!Array.isArray(rawRows)) {
      return failedResult(
        "MISSING_DATA",
        "Staging Portfolio repository returned no row collection.",
      );
    }
    if (rawRows.length === 0) {
      return failedResult(
        "EMPTY_PORTFOLIO",
        "Staging active Portfolio is empty.",
      );
    }

    const rows = rawRows as PortfolioStock[];
    const invalidRows = rows.filter((row) => !isValidActiveRow(row));
    if (invalidRows.length > 0) {
      return failedResult(
        "VALIDATION_FAILED",
        `Staging Portfolio validation failed for ${invalidRows.length} row(s).`,
      );
    }

    const comparedAt = options.compared_at ?? new Date().toISOString();
    const comparison = comparePortfolioShadow({
      context: {
        comparison_id: options.comparison_id ?? `v3-6:${comparedAt}`,
        compared_at: comparedAt,
        hardcoded_version: HARDCODED_FIXTURE_VERSION,
        database_snapshot_id:
          options.database_snapshot_id ?? "staging:repository-active-rows",
      },
      hardcoded: HARDCODED_PORTFOLIO_FIXTURE,
      database: rows.map((row) => ({
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        market: row.market,
        is_active: row.is_active,
      })),
    });
    const status = toStatus(comparison.status);
    const issues: StagingShadowIssue[] = comparison.differences.map(
      (difference) => ({
        code: difference.code,
        severity: difference.severity === "fail" ? "FAIL" : "WARNING",
        message: difference.message,
        symbol: difference.symbol,
      }),
    );
    const parityStatus: StagingParityStatus = status;

    return {
      mode: "shadow",
      source: "hardcoded",
      status,
      issues,
      parity_status: parityStatus,
      fallback_used: true,
      decision_allowed: status === "PASS",
      data_warning:
        status === "PASS"
          ? null
          : `Staging parity is ${status}; Supabase data is blocked and hardcoded Portfolio remains active.`,
    };
  }
}

export async function runStagingSupabasePortfolioShadow(
  repository: StagingPortfolioRepository,
  options: StagingSupabaseShadowOptions = {},
): Promise<StagingShadowResult> {
  return new StagingSupabasePortfolioShadow(repository).run(options);
}
