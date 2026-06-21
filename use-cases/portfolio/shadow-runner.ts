import {
  DATABASE_FIXTURE_EXPECTATIONS,
  getDatabasePortfolioFixture,
  type DatabaseFixtureScenario,
} from "./fixtures/database-fixture";
import {
  HARDCODED_FIXTURE_VERSION,
  HARDCODED_PORTFOLIO_FIXTURE,
} from "./fixtures/hardcoded-fixture";
import { comparePortfolioShadow } from "./shadow-comparison";
import type {
  ShadowRunnerResult,
  ShadowRunnerStatus,
  ShadowValidationSuiteResult,
} from "./shadow-result";

export const SHADOW_RUNNER_FIXED_TIME = "2026-06-21T00:00:00.000Z";

export const SHADOW_FIXTURE_SCENARIOS = [
  "exact_match",
  "name_mismatch",
  "market_mismatch",
  "duplicate",
  "inactive_leakage",
  "missing_symbol",
  "extra_symbol",
] as const satisfies readonly DatabaseFixtureScenario[];

function toRunnerStatus(status: "pass" | "warning" | "fail"): ShadowRunnerStatus {
  if (status === "pass") return "PASS";
  if (status === "warning") return "WARNING";
  return "FAIL";
}

export function runPortfolioShadowScenario(
  scenario: DatabaseFixtureScenario,
): ShadowRunnerResult {
  const comparison = comparePortfolioShadow({
    context: {
      comparison_id: `v3-4.8:${scenario}`,
      compared_at: SHADOW_RUNNER_FIXED_TIME,
      hardcoded_version: HARDCODED_FIXTURE_VERSION,
      database_snapshot_id: `fixture:${scenario}`,
    },
    hardcoded: HARDCODED_PORTFOLIO_FIXTURE,
    database: getDatabasePortfolioFixture(scenario),
  });
  const status = toRunnerStatus(comparison.status);
  const expectedStatus = DATABASE_FIXTURE_EXPECTATIONS[scenario];
  const expectationMet = status === expectedStatus;

  return {
    status,
    issues: comparison.differences.map((difference) => ({
      code: difference.code,
      severity: difference.severity === "fail" ? "FAIL" : "WARNING",
      symbol: difference.symbol,
      message: difference.message,
    })),
    summary: {
      scenario,
      comparison_id: comparison.context.comparison_id,
      expected_status: expectedStatus,
      expectation_met: expectationMet,
      identity_parity: comparison.identity_parity,
      response_source: "hardcoded",
      metrics: { ...comparison.metrics },
    },
    decision_allowed: status === "PASS" && expectationMet,
  };
}

export function runPortfolioShadowValidationSuite(): ShadowValidationSuiteResult {
  const results = SHADOW_FIXTURE_SCENARIOS.map(runPortfolioShadowScenario);
  const matchedExpectations = results.filter(
    (result) => result.summary.expectation_met,
  ).length;

  return {
    suite_passed: matchedExpectations === results.length,
    total_scenarios: results.length,
    matched_expectations: matchedExpectations,
    results,
  };
}
