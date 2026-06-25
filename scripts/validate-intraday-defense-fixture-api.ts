/**
 * Intraday Defense Fixture API Validator — V31
 *
 * Contract / fixture-only check. Imports the pure builder and inspects the
 * payload shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, or write data.
 *
 * Safety scanning for forbidden runtime tokens is applied ONLY to code runtime
 * files (builder / route), comment-stripped. Documentation may legitimately
 * mention concrete source names as governance notes, so docs are NOT scanned.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/intraday-defense/build-intraday-defense-fixture-contract") as typeof import("../use-cases/intraday-defense/build-intraday-defense-fixture-contract");
const { buildIntradayDefenseFixtureContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface IntradayDefenseApiSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: true;
  ui_created: false;
  runtime_created: false;
  sql_migration_created: false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolve(...parts: string[]): string {
  return path.resolve(process.cwd(), ...parts);
}

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function combineStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.some((s) => s === "FAIL")) return "FAIL";
  if (statuses.some((s) => s === "WARNING")) return "WARNING";
  return "PASS";
}

function checkTerms(
  name: string,
  body: string | null,
  fileLabel: string,
  terms: string[],
): CheckResult {
  if (body == null) {
    return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
  }
  const details: string[] = [];
  const issues: string[] = [];
  for (const term of terms) {
    if (body.includes(term)) {
      details.push(`PASS  "${term}" present in ${fileLabel}.`);
    } else {
      issues.push(`FAIL  "${term}" not found in ${fileLabel}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name, status, details: [...details, ...issues] };
}

function checkAbsent(
  name: string,
  body: string | null,
  fileLabel: string,
  forbidden: string[],
): CheckResult {
  if (body == null) {
    return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
  }
  const details: string[] = [];
  const issues: string[] = [];
  for (const term of forbidden) {
    if (body.includes(term)) {
      issues.push(`FAIL  Forbidden "${term}" present in ${fileLabel}.`);
    } else {
      details.push(`PASS  No "${term}" in ${fileLabel}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name, status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/intraday-defense-fixture-api.md";
const CONTRACT_REL = "use-cases/intraday-defense/intraday-holding-defense-runtime-contract.ts";
const BUILDER_REL = "use-cases/intraday-defense/build-intraday-defense-fixture-contract.ts";
const ROUTE_REL = "app/api/portfolio/intraday-defense/route.ts";
const RUNTIME_DOC_REL = "docs/intraday-holding-defense-runtime-spec.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Intraday Defense Fixture API doc (new)", rel: DOC_REL },
    { label: "Intraday Holding Defense Runtime contract", rel: CONTRACT_REL },
    { label: "Intraday Defense fixture builder (new)", rel: BUILDER_REL },
    { label: "Intraday Defense Fixture API route (new)", rel: ROUTE_REL },
    { label: "Intraday Holding Defense Runtime Spec doc", rel: RUNTIME_DOC_REL },
    { label: "README", rel: README_REL },
    { label: "package.json", rel: PKG_REL },
  ];

  const details: string[] = [];
  const issues: string[] = [];

  for (const { label, rel } of required) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} present (${label}).`);
    } else {
      issues.push(`FAIL  Missing: ${rel} (${label})`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "required_files", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 2: Required document phrases
// ---------------------------------------------------------------------------

const REQUIRED_DOC_PHRASES: string[] = [
  "Intraday Defense Fixture API",
  "/api/portfolio/intraday-defense",
  "mock_or_contract",
  "fixture-only",
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "INVALID_LEVEL_BREACHED",
  "PROFIT_GIVEBACK_WARNING",
  "RISK_REDUCTION_WATCH",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "PRICE_NOT_VERIFIED",
  "STALE_DATA",
  "SOURCE_CONFLICT",
  "FALLBACK_ONLY",
  "DATA_INSUFFICIENT",
  "cooldown",
  "dedup",
  "duplicateSuppressed",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "DATA_INSUFFICIENT 不得觸發 DANGER",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V32 Intraday Defense UI Integration",
  "V33 Runtime Pilot",
];

// ---------------------------------------------------------------------------
// Gate 3: Builder checks
// ---------------------------------------------------------------------------

const BUILDER_TERMS: string[] = [
  "buildIntradayDefenseFixtureContract",
  "IntradayDefenseFixtureSummary",
  "IntradayDefenseFixtureResponse",
  "mock_or_contract",
  "fixture",
  "spec_only",
  "V31",
  "2026-06-23T00:00:00.000Z",
  "alerts",
  "summary",
  "triggerRules",
  "cooldownPolicy",
  "runtimeReadinessChecklist",
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "PROFIT_GIVEBACK_WARNING",
  "RISK_REDUCTION_WATCH",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "PRICE_NOT_VERIFIED",
  "STALE_DATA",
  "SOURCE_CONFLICT",
  "FALLBACK_ONLY",
  "DATA_INSUFFICIENT",
  "duplicateSuppressed",
  "cooldownRemainingSeconds",
  "nextAllowedAlertAt",
  "notExitSignal: true",
  "notTradeAdvice: true",
  "highConfidenceConclusionAllowed: false",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
];

const BUILDER_FORBIDDEN: string[] = ["Date.now", "new Date"];

// ---------------------------------------------------------------------------
// Gate 4: Route checks
// ---------------------------------------------------------------------------

const ROUTE_TERMS: string[] = ["GET", "NextResponse.json", "buildIntradayDefenseFixtureContract"];

const ROUTE_FORBIDDEN: string[] = [
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "fetch",
  "axios",
  "Date.now",
  "new Date",
];

function checkRouteForbidden(): CheckResult {
  const body = readFile(resolve(ROUTE_REL));
  if (body == null) {
    return { name: "route_forbidden", status: "FAIL", details: [`FAIL  Cannot read ${ROUTE_REL}.`] };
  }
  const lower = stripComments(body).toLowerCase();
  const details: string[] = [];
  const issues: string[] = [];
  for (const token of ROUTE_FORBIDDEN) {
    if (lower.includes(token.toLowerCase())) {
      issues.push(`FAIL  Forbidden "${token}" present in ${ROUTE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${ROUTE_REL}.`);
    }
  }
  for (const token of ["@supabase", "createclient", "process.env"]) {
    if (lower.includes(token)) {
      issues.push(`FAIL  Forbidden "${token}" present in ${ROUTE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${ROUTE_REL}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "route_forbidden", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Payload checks
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const payload = buildIntradayDefenseFixtureContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", payload.contractVersion, "V31");
  expectEq("apiContractVersion", payload.apiContractVersion, "V31");
  expectEq("responseSource", payload.responseSource, "mock_or_contract");
  expectEq("sourceMode", payload.sourceMode, "fixture");
  expectEq("runtimeMode", payload.runtimeMode, "spec_only");
  expectEq("fixtureVersion", payload.fixtureVersion, "V31");
  expectEq("generatedAt", payload.generatedAt, FIXED_TS);
  expectEq("requestPerformed", payload.requestPerformed, false);
  expectEq("supabaseConnected", payload.supabaseConnected, false);
  expectEq("productionWritePerformed", payload.productionWritePerformed, false);

  if (payload.alerts.length >= 10) {
    details.push(`PASS  alerts.length = ${payload.alerts.length} (>= 10).`);
  } else {
    issues.push(`FAIL  alerts.length = ${payload.alerts.length}, expected >= 10.`);
  }
  expectEq("summary.totalAlerts", payload.summary.totalAlerts, payload.alerts.length);
  expectEq(
    "summary.highConfidenceConclusionAllowed",
    payload.summary.highConfidenceConclusionAllowed,
    false,
  );

  const every = (label: string, ok: boolean): void => {
    if (ok) details.push(`PASS  ${label}.`);
    else issues.push(`FAIL  ${label}.`);
  };

  every("every alert runtimeMode === spec_only", payload.alerts.every((a) => a.runtimeMode === "spec_only"));
  every("every alert requestPerformed === false", payload.alerts.every((a) => a.requestPerformed === false));
  every("every alert supabaseConnected === false", payload.alerts.every((a) => a.supabaseConnected === false));
  every(
    "every alert productionWritePerformed === false",
    payload.alerts.every((a) => a.productionWritePerformed === false),
  );
  every("every alert notExitSignal === true", payload.alerts.every((a) => a.notExitSignal === true));
  every("every alert notTradeAdvice === true", payload.alerts.every((a) => a.notTradeAdvice === true));
  every(
    "every alert highConfidenceConclusionAllowed === false",
    payload.alerts.every((a) => a.highConfidenceConclusionAllowed === false),
  );

  // Required state coverage.
  const hasState = (s: string): boolean => payload.alerts.some((a) => a.intradayState === s);
  const requiredStates = [
    "INTRADAY_NORMAL",
    "DEFENSE_ZONE_APPROACHING",
    "DEFENSE_ZONE_BREACHED",
    "PROFIT_GIVEBACK_WARNING",
    "RISK_REDUCTION_WATCH",
    "FAST_DROP_WARNING",
    "TREND_BREAK_WARNING",
    "PRICE_NOT_VERIFIED",
    "STALE_DATA",
    "SOURCE_CONFLICT",
    "FALLBACK_ONLY",
    "DATA_INSUFFICIENT",
  ];
  for (const s of requiredStates) {
    if (hasState(s)) {
      details.push(`PASS  payload contains a ${s} alert.`);
    } else {
      issues.push(`FAIL  payload missing a ${s} alert.`);
    }
  }

  // No-DANGER guards.
  const unverified = payload.alerts.filter((a) => a.priceVerified === false);
  every(
    "every priceVerified === false alert nulls precise zones + != DANGER + high confidence false",
    unverified.every(
      (a) =>
        a.alertLevel !== "DANGER" &&
        a.defenseZone === null &&
        a.invalidLevel === null &&
        a.takeProfitZone === null &&
        a.riskReduceZone === null &&
        a.exitObservationZone === null &&
        a.highConfidenceConclusionAllowed === false,
    ),
  );
  every(
    "every freshnessStatus === STALE alert has alertLevel !== DANGER",
    payload.alerts.filter((a) => a.freshnessStatus === "STALE").every((a) => a.alertLevel !== "DANGER"),
  );
  every(
    "every sourceConflictStatus === MAJOR_CONFLICT alert has alertLevel !== DANGER",
    payload.alerts
      .filter((a) => a.sourceConflictStatus === "MAJOR_CONFLICT")
      .every((a) => a.alertLevel !== "DANGER"),
  );
  every(
    "every sourcePriority === FALLBACK_CACHE alert has alertLevel !== DANGER",
    payload.alerts
      .filter((a) => a.sourcePriority === "FALLBACK_CACHE")
      .every((a) => a.alertLevel !== "DANGER"),
  );

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:intraday-defense-fixture-api": "node --require ./scripts/register-typescript.cjs ./scripts/validate-intraday-defense-fixture-api.ts"',
];

const README_TERMS: string[] = [
  "V31",
  "Intraday Defense Fixture API",
  "docs/intraday-defense-fixture-api.md",
  "use-cases/intraday-defense/build-intraday-defense-fixture-contract.ts",
  "app/api/portfolio/intraday-defense/route.ts",
  "npm run test:intraday-defense-fixture-api",
  "/api/portfolio/intraday-defense",
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "PROFIT_GIVEBACK_WARNING",
  "RISK_REDUCTION_WATCH",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "PRICE_NOT_VERIFIED",
  "STALE_DATA",
  "SOURCE_CONFLICT",
  "FALLBACK_ONLY",
  "DATA_INSUFFICIENT",
  "cooldown",
  "dedup",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "本階段未接資料源",
  "未建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

const RUNTIME_SOURCE_TOKENS = [
  "twse",
  "tpex",
  "yahoo",
  "finmind",
  "tradingview",
  "yfinance",
  "factset",
  "broker",
];

const DB_WRITE_TOKENS = ["insert(", "upsert(", "update(", "delete("];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 7a. Builder + route code: no external request / supabase / env / clock /
  //     DB writes / source tokens.
  for (const rel of [BUILDER_REL, ROUTE_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      continue;
    }
    const lower = stripComments(body).toLowerCase();
    const forbidden = [
      "fetch(",
      "axios",
      "@supabase",
      "createclient",
      "process.env",
      "date.now",
      "new date(",
      ...DB_WRITE_TOKENS,
      ...RUNTIME_SOURCE_TOKENS,
    ];
    for (const token of forbidden) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${token}" in ${rel} code.`);
      }
    }
  }

  // 7b. No new SQL migration / UI component for intraday defense fixture API.
  const forbiddenArtifacts = [
    "supabase/intraday_defense_fixture.sql",
    "components/intraday-defense.tsx",
    "components/intraday-holding-defense.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V31.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7c. No intraday-defense runtime / quote-polling / scheduler / crawler.
  const forbiddenRuntime = [
    "use-cases/intraday-defense/build-intraday-holding-defense-runtime.ts",
    "services/intraday-defense/quote-poller.ts",
    "services/intraday-defense/scheduler.ts",
    "services/intraday-defense/crawler.ts",
    "services/intraday-defense/broker-connector.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V31.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7d. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "components/holding-defense-tracker.tsx",
    "app/holdings/page.tsx",
    "use-cases/intraday-defense/intraday-holding-defense-runtime-contract.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} still present.`);
    } else {
      issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "safety", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const builderBody = readFile(resolve(BUILDER_REL));
const routeBody = readFile(resolve(ROUTE_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const builderTermCheck = checkTerms("builder_checks", builderBody, BUILDER_REL, BUILDER_TERMS);
const builderForbiddenCheck = checkAbsent(
  "builder_no_clock",
  builderBody == null ? null : stripComments(builderBody),
  BUILDER_REL,
  BUILDER_FORBIDDEN,
);
const routeTermCheck = checkTerms("route_checks", routeBody, ROUTE_REL, ROUTE_TERMS);
const routeForbiddenCheck = checkRouteForbidden();
const payloadCheck = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  builderTermCheck,
  builderForbiddenCheck,
  routeTermCheck,
  routeForbiddenCheck,
  payloadCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: IntradayDefenseApiSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, ROUTE_REL, RUNTIME_DOC_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    builder_checks: builderTermCheck.status,
    builder_no_clock: builderForbiddenCheck.status,
    route_checks: routeTermCheck.status,
    route_forbidden: routeForbiddenCheck.status,
    payload_checks: payloadCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: true,
  ui_created: false,
  runtime_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
