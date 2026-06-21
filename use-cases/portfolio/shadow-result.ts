import type {
  ShadowComparisonMetrics,
  ShadowDifferenceCode,
} from "./types";
import type { DatabaseFixtureScenario } from "./fixtures/database-fixture";

export type ShadowRunnerStatus = "PASS" | "WARNING" | "FAIL";

export interface ShadowRunnerIssue {
  code: ShadowDifferenceCode;
  severity: "WARNING" | "FAIL";
  symbol: string;
  message: string;
}

export interface ShadowRunnerSummary {
  scenario: DatabaseFixtureScenario;
  comparison_id: string;
  expected_status: ShadowRunnerStatus;
  expectation_met: boolean;
  identity_parity: boolean;
  response_source: "hardcoded";
  metrics: ShadowComparisonMetrics;
}

export interface ShadowRunnerResult {
  status: ShadowRunnerStatus;
  issues: ShadowRunnerIssue[];
  summary: ShadowRunnerSummary;
  /** Eligible for rollout review only; never means a trading decision. */
  decision_allowed: boolean;
}

export interface ShadowValidationSuiteResult {
  suite_passed: boolean;
  total_scenarios: number;
  matched_expectations: number;
  results: ShadowRunnerResult[];
}
