/**
 * Portfolio API Switch Guard Validator — V14
 *
 * Fixture-only, pure function test. Does NOT:
 *   - connect to Supabase
 *   - read Supabase environment keys
 *   - make any HTTP request
 *   - create a Supabase client
 *   - read or write real portfolio data
 *   - switch /api/portfolio
 *
 * Tests the mode resolver + metadata builder against 5 defined scenarios and
 * verifies the V14 switch guard contract for each.
 *
 * Exit 0 → PASS
 * Exit 1 → FAIL
 */

// export {} isolates this file as a TypeScript module, preventing global const
// collisions with other script files that also use the CJS require() pattern.
export {};

const { resolvePortfolioMode, V3_5_MODE_POLICY } = require(
  "../use-cases/portfolio/portfolio-mode",
) as typeof import("../use-cases/portfolio/portfolio-mode");

const { buildSwitchGuardMetadata } = require(
  "../use-cases/portfolio/portfolio-switch-guard",
) as typeof import("../use-cases/portfolio/portfolio-switch-guard");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScenarioStatus = "PASS" | "FAIL";

interface ScenarioResult {
  scenario: string;
  env_value: string | undefined;
  status: ScenarioStatus;
  issues: string[];
  metadata: Record<string, unknown>;
}

interface SwitchGuardSummary {
  status: ScenarioStatus;
  total_scenarios: number;
  passed: number;
  failed: number;
  scenarios: ScenarioResult[];
  request_performed: false;
  supabase_connected: false;
  production_write_performed: false;
  supabase_client_created: false;
  env_secret_read_performed: false;
}

// ---------------------------------------------------------------------------
// Invariant checks (apply to every mode)
// ---------------------------------------------------------------------------

function checkInvariants(
  meta: Record<string, unknown>,
  issues: string[],
): void {
  if (meta["response_source"] !== "hardcoded") {
    issues.push(
      `FAIL  response_source must be "hardcoded", got "${String(meta["response_source"])}"`,
    );
  }
  if (meta["decision_source"] !== "hardcoded") {
    issues.push(
      `FAIL  decision_source must be "hardcoded", got "${String(meta["decision_source"])}"`,
    );
  }
  if (meta["request_performed"] !== false) {
    issues.push(
      `FAIL  request_performed must be false, got "${String(meta["request_performed"])}"`,
    );
  }
  if (meta["supabase_connected"] !== false) {
    issues.push(
      `FAIL  supabase_connected must be false, got "${String(meta["supabase_connected"])}"`,
    );
  }
  if (meta["production_write_performed"] !== false) {
    issues.push(
      `FAIL  production_write_performed must be false, got "${String(meta["production_write_performed"])}"`,
    );
  }
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

const scenarios: Array<{
  name: string;
  envValue: string | undefined;
  check: (meta: Record<string, unknown>, issues: string[]) => void;
}> = [
  {
    name: "env_unset",
    envValue: undefined,
    check(meta, issues) {
      if (meta["source_mode"] !== "hardcoded") {
        issues.push(
          `FAIL  source_mode must be "hardcoded" for unset env, got "${String(meta["source_mode"])}"`,
        );
      }
      if (meta["fallback_used"] !== true) {
        issues.push(
          `FAIL  fallback_used must be true for unset env (implicit fallback), got "${String(meta["fallback_used"])}"`,
        );
      }
      const warnings = meta["warnings"] as string[] | undefined;
      if (!Array.isArray(warnings) || warnings.length === 0) {
        issues.push(
          "FAIL  warnings must be non-empty for unset env (should contain fallback notice).",
        );
      }
    },
  },
  {
    name: "env_hardcoded",
    envValue: "hardcoded",
    check(meta, issues) {
      if (meta["source_mode"] !== "hardcoded") {
        issues.push(
          `FAIL  source_mode must be "hardcoded", got "${String(meta["source_mode"])}"`,
        );
      }
      if (meta["fallback_used"] !== false) {
        issues.push(
          `FAIL  fallback_used must be false for explicit hardcoded, got "${String(meta["fallback_used"])}"`,
        );
      }
    },
  },
  {
    name: "env_shadow",
    envValue: "shadow",
    check(meta, issues) {
      if (meta["source_mode"] !== "shadow") {
        issues.push(
          `FAIL  source_mode must be "shadow", got "${String(meta["source_mode"])}"`,
        );
      }
      if (meta["fallback_used"] !== false) {
        issues.push(
          `FAIL  fallback_used must be false for shadow mode, got "${String(meta["fallback_used"])}"`,
        );
      }
      if (meta["shadow_enabled"] !== true) {
        issues.push(
          `FAIL  shadow_enabled must be true for shadow mode, got "${String(meta["shadow_enabled"])}"`,
        );
      }
      if (meta["shadow_status"] !== "SKIPPED") {
        issues.push(
          `FAIL  shadow_status must be "SKIPPED" in V14 guard, got "${String(meta["shadow_status"])}"`,
        );
      }
      if (!meta["shadow_reason"]) {
        issues.push(
          "FAIL  shadow_reason must be present explaining why shadow is skipped.",
        );
      }
    },
  },
  {
    name: "env_supabase",
    envValue: "supabase",
    check(meta, issues) {
      if (meta["source_mode"] !== "supabase") {
        issues.push(
          `FAIL  source_mode must be "supabase", got "${String(meta["source_mode"])}"`,
        );
      }
      if (meta["fallback_used"] !== true) {
        issues.push(
          `FAIL  fallback_used must be true for supabase mode (V14 guard), got "${String(meta["fallback_used"])}"`,
        );
      }
      if (!meta["fallback_reason"]) {
        issues.push(
          "FAIL  fallback_reason must be present for supabase guard fallback.",
        );
      }
      // Supabase must never connect — this is enforced structurally (no client
      // is created in the guard); supabase_connected remains false (invariant).
    },
  },
  {
    name: "env_invalid",
    envValue: "not-a-valid-mode",
    check(meta, issues) {
      if (meta["source_mode"] !== "hardcoded") {
        issues.push(
          `FAIL  invalid mode must resolve to source_mode="hardcoded", got "${String(meta["source_mode"])}"`,
        );
      }
      if (meta["fallback_used"] !== true) {
        issues.push(
          `FAIL  fallback_used must be true for invalid mode, got "${String(meta["fallback_used"])}"`,
        );
      }
      const warnings = meta["warnings"] as string[] | undefined;
      if (!Array.isArray(warnings) || warnings.length === 0) {
        issues.push(
          "FAIL  warnings must be non-empty for invalid mode (should contain unknown-mode notice).",
        );
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const results: ScenarioResult[] = scenarios.map(
  ({ name, envValue, check }) => {
    // Use V3_5_MODE_POLICY to match resolvePortfolioModeFromEnvironment() in
    // the route, which passes V3_5_MODE_POLICY (allow_supabase: true). This
    // ensures the supabase scenario reaches the guard branch rather than being
    // blocked by the policy layer before the guard runs.
    const modeResolution = resolvePortfolioMode(envValue, V3_5_MODE_POLICY);
    const guard = buildSwitchGuardMetadata(modeResolution);
    const meta = guard as unknown as Record<string, unknown>;

    const issues: string[] = [];
    checkInvariants(meta, issues);
    check(meta, issues);

    return {
      scenario: name,
      env_value: envValue,
      status: issues.length === 0 ? "PASS" : "FAIL",
      issues,
      metadata: meta,
    };
  },
);

const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;
const overallStatus: ScenarioStatus = failed > 0 ? "FAIL" : "PASS";

const summary: SwitchGuardSummary = {
  status: overallStatus,
  total_scenarios: results.length,
  passed,
  failed,
  scenarios: results,
  request_performed: false,
  supabase_connected: false,
  production_write_performed: false,
  supabase_client_created: false,
  env_secret_read_performed: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
