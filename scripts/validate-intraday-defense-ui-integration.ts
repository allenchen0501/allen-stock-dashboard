/**
 * Intraday Defense UI Integration Validator — V32
 *
 * Fixture-only, local file-system check. Does NOT start a Next.js server, make
 * any HTTP request, connect to Supabase, read env keys, or write data. It only
 * reads files and inspects their contents.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface IntradayDefenseUiSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: false;
  ui_created: true;
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/intraday-defense-ui-integration.md";
const COMPONENT_REL = "components/intraday-defense-tracker.tsx";
const PAGE_REL = "app/holdings/page.tsx";
const ROUTE_REL = "app/api/portfolio/intraday-defense/route.ts";
const BUILDER_REL = "use-cases/intraday-defense/build-intraday-defense-fixture-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Intraday Defense UI Integration doc (new)", rel: DOC_REL },
    { label: "Intraday Defense Tracker component (new)", rel: COMPONENT_REL },
    { label: "Holdings page", rel: PAGE_REL },
    { label: "Intraday Defense Fixture API route", rel: ROUTE_REL },
    { label: "Intraday Defense fixture builder", rel: BUILDER_REL },
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
  "Intraday Defense UI Integration",
  "/api/portfolio/intraday-defense",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "cooldown",
  "dedup",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "DATA_INSUFFICIENT 不得觸發 DANGER",
  "V33 Runtime Pilot Readiness Checklist",
  "V34 Runtime Pilot",
];

// ---------------------------------------------------------------------------
// Gate 3: Component checks
// ---------------------------------------------------------------------------

const COMPONENT_TERMS: string[] = [
  "'use client'",
  "IntradayDefenseTracker",
  "/api/portfolio/intraday-defense",
  "IntradayDefenseFixtureResponse",
  "IntradayHoldingDefenseAlertItem",
  "useEffect",
  "useState",
  "fetch(",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
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
  "cooldownRemainingSeconds",
  "nextAllowedAlertAt",
  "priceVerified",
  "priceVerificationStatus",
  "freshnessStatus",
  "sourceConflictStatus",
  "dataQualityStatus",
  "sourcePriority",
  "takeProfitZone",
  "defenseZone",
  "invalidLevel",
  "riskReduceZone",
  "exitObservationZone",
  "notExitSignal",
  "notTradeAdvice",
  "highConfidenceConclusionAllowed",
  "防守區是防守觀察，不是自動出場",
  "invalidLevel 不是自動停損價",
  "takeProfitZone 不是賣出價",
  "風險降低觀察不是賣出指令",
  "FAST_DROP_WARNING 不是賣出指令",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "DATA_INSUFFICIENT 不得觸發 DANGER",
];

// Per-card field coverage (presence in component source).
const COMPONENT_FIELD_TERMS: string[] = [
  "alertId",
  "stockId",
  "stockName",
  "runtimeMode",
  "intradayState",
  "alertLevel",
  "triggerType",
  "trackerState",
  "holdingState",
  "holdingActionState",
  "currentPrice",
  "intradayHigh",
  "intradayLow",
  "previousClose",
  "volumeRatio",
  "drawdownFromPeakPercent",
  "profitProtectionZone",
  "holdingImpact",
  "trendBreakWarning",
  "shortAttackRisk",
  "riskReduceObservation",
  "waitForReclaimCondition",
  "recoveryCondition",
  "nextObservation",
  "dedupKey",
  "warnings",
  "missingDataFields",
  "requiredVerification",
];

// ---------------------------------------------------------------------------
// Gate 4: Component safety (forbidden tokens, comment-stripped lowercase)
// ---------------------------------------------------------------------------

const COMPONENT_FORBIDDEN: string[] = [
  "axios",
  "@supabase",
  "createclient",
  "process.env",
  "date.now",
  "new date(",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "yahoo",
  "finmind",
  "tradingview",
  "yfinance",
  "twse",
  "tpex",
  "broker",
  "https://",
  "http://",
];

function checkComponentSafety(): CheckResult {
  const body = readFile(resolve(COMPONENT_REL));
  if (body == null) {
    return {
      name: "component_safety",
      status: "FAIL",
      details: [`FAIL  Cannot read ${COMPONENT_REL}.`],
    };
  }
  const lower = stripComments(body).toLowerCase();
  const details: string[] = [];
  const issues: string[] = [];

  for (const token of COMPONENT_FORBIDDEN) {
    if (lower.includes(token)) {
      issues.push(`FAIL  Forbidden "${token}" present in ${COMPONENT_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${COMPONENT_REL}.`);
    }
  }

  if (lower.includes("fetch(")) {
    if (lower.includes("/api/portfolio/intraday-defense")) {
      details.push("PASS  Component fetch targets internal /api/portfolio/intraday-defense.");
    } else {
      issues.push("FAIL  Component fetch does not target /api/portfolio/intraday-defense.");
    }
  } else {
    issues.push("FAIL  Component does not contain a fetch( call.");
  }

  // The response TYPE may be type-imported from the builder module, but the
  // runtime builder FUNCTION and the route module must never be imported.
  for (const token of ["buildintradaydefensefixturecontract", "portfolio/intraday-defense/route"]) {
    if (lower.includes(token)) {
      issues.push(`FAIL  Component must not import "${token}".`);
    } else {
      details.push(`PASS  Component does not import "${token}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "component_safety", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Holdings page integration
// ---------------------------------------------------------------------------

function checkPageIntegration(): CheckResult {
  const body = readFile(resolve(PAGE_REL));
  if (body == null) {
    return { name: "page_integration", status: "FAIL", details: [`FAIL  Cannot read ${PAGE_REL}.`] };
  }
  const details: string[] = [];
  const issues: string[] = [];

  if (body.includes("IntradayDefenseTracker")) {
    details.push("PASS  IntradayDefenseTracker referenced in holdings page.");
  } else {
    issues.push("FAIL  IntradayDefenseTracker not referenced in holdings page.");
  }
  if (body.includes("components/intraday-defense-tracker")) {
    details.push("PASS  holdings page imports components/intraday-defense-tracker.");
  } else {
    issues.push("FAIL  holdings page does not import components/intraday-defense-tracker.");
  }
  if (body.includes("<IntradayDefenseTracker")) {
    details.push("PASS  <IntradayDefenseTracker /> rendered in holdings page.");
  } else {
    issues.push("FAIL  <IntradayDefenseTracker /> not rendered in holdings page.");
  }

  const lower = stripComments(body).toLowerCase();
  for (const token of ["http://", "https://", "@supabase", "createclient", "process.env", "axios"]) {
    if (lower.includes(token)) {
      issues.push(`FAIL  Forbidden "${token}" present in ${PAGE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${PAGE_REL}.`);
    }
  }
  for (const token of [
    "buildintradaydefensefixturecontract",
    "portfolio/intraday-defense/route",
  ]) {
    if (lower.includes(token)) {
      issues.push(`FAIL  holdings page must not import "${token}".`);
    } else {
      details.push(`PASS  holdings page does not import "${token}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "page_integration", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:intraday-defense-ui-integration": "node --require ./scripts/register-typescript.cjs ./scripts/validate-intraday-defense-ui-integration.ts"',
];

const README_TERMS: string[] = [
  "V32",
  "Intraday Defense UI Integration",
  "docs/intraday-defense-ui-integration.md",
  "components/intraday-defense-tracker.tsx",
  "app/holdings/page.tsx",
  "npm run test:intraday-defense-ui-integration",
  "/api/portfolio/intraday-defense",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "cooldown",
  "dedup",
  "priceVerified",
  "sourceConflictStatus",
  "本階段未接資料源",
  "未建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 API route",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // No new API route / SQL migration for the UI integration.
  const forbiddenArtifacts = [
    "app/api/intraday-defense/route.ts",
    "app/api/portfolio/intraday-defense-ui/route.ts",
    "supabase/intraday_defense_ui.sql",
    "components/intraday-defense.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V32.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // No intraday-defense runtime / quote-polling / scheduler / crawler.
  const forbiddenRuntime = [
    "services/intraday-defense/quote-poller.ts",
    "services/intraday-defense/scheduler.ts",
    "services/intraday-defense/crawler.ts",
    "use-cases/intraday-defense/build-intraday-holding-defense-runtime.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V32.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // Protected layers must still be present (V31 route / builder / V30 contract /
  // Holding Defense UI / War Room not deleted).
  const protectedFiles = [
    "app/api/portfolio/intraday-defense/route.ts",
    "use-cases/intraday-defense/build-intraday-defense-fixture-contract.ts",
    "use-cases/intraday-defense/intraday-holding-defense-runtime-contract.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "components/holding-defense-tracker.tsx",
    "components/war-room-dashboard.tsx",
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} still present.`);
    } else {
      issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
    }
  }

  // V31 route must remain unmodified-in-spirit: still calls the builder.
  const routeBody = readFile(resolve(ROUTE_REL));
  if (routeBody == null) {
    issues.push(`FAIL  Cannot read ${ROUTE_REL}.`);
  } else if (routeBody.includes("buildIntradayDefenseFixtureContract")) {
    details.push("PASS  V31 route still calls buildIntradayDefenseFixtureContract.");
  } else {
    issues.push("FAIL  V31 route may have been altered (builder call missing).");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "safety", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const componentBody = readFile(resolve(COMPONENT_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const componentCheck = checkTerms("component_checks", componentBody, COMPONENT_REL, COMPONENT_TERMS);
const componentFieldCheck = checkTerms(
  "component_field_checks",
  componentBody,
  COMPONENT_REL,
  COMPONENT_FIELD_TERMS,
);
const componentSafetyCheck = checkComponentSafety();
const pageCheck = checkPageIntegration();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  componentCheck,
  componentFieldCheck,
  componentSafetyCheck,
  pageCheck,
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

const summary: IntradayDefenseUiSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, COMPONENT_REL, PAGE_REL, ROUTE_REL, BUILDER_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    component_checks: componentCheck.status,
    component_field_checks: componentFieldCheck.status,
    component_safety: componentSafetyCheck.status,
    page_integration: pageCheck.status,
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
  api_route_created: false,
  ui_created: true,
  runtime_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
