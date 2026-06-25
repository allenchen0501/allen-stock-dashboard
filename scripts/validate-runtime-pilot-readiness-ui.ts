/**
 * Runtime Pilot Readiness UI Validator — V34
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

interface RuntimePilotUiSummary {
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

const DOC_REL = "docs/runtime-pilot-readiness-ui.md";
const COMPONENT_REL = "components/runtime-pilot-readiness.tsx";
const PAGE_REL = "app/holdings/page.tsx";
const CONTRACT_REL = "use-cases/runtime-pilot/runtime-pilot-readiness-contract.ts";
const BUILDER_REL = "use-cases/runtime-pilot/build-runtime-pilot-readiness-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Runtime Pilot Readiness UI doc (new)", rel: DOC_REL },
    { label: "Runtime Pilot Readiness component (new)", rel: COMPONENT_REL },
    { label: "Holdings page", rel: PAGE_REL },
    { label: "Runtime Pilot Readiness contract", rel: CONTRACT_REL },
    { label: "Runtime Pilot Readiness builder", rel: BUILDER_REL },
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
  "Runtime Pilot Readiness UI",
  "readiness preview 不是 runtime 狀態",
  "fixture data 不是即時資料",
  "V34 不接真資料",
  "V34 不建立 runtime",
  "V34 不寫資料",
  "GO_DRY_RUN 不是 production",
  "GO_DRY_RUN 不代表可寫資料",
  "GO_DRY_RUN 不代表產生買賣指令",
  "production write 一律 BLOCKED",
  "V35 Runtime Pilot Dry-Run",
  "V36 Runtime Pilot Monitoring",
];

// ---------------------------------------------------------------------------
// Gate 3: Component checks
// ---------------------------------------------------------------------------

const COMPONENT_TERMS: string[] = [
  "RuntimePilotReadiness",
  "buildRuntimePilotReadinessContract",
  "2026-06-23T00:00:00.000Z",
  "Runtime Pilot Readiness",
  "readiness preview 不是 runtime 狀態",
  "fixture data 不是即時資料",
  "V34 不接真資料",
  "V34 不建立 runtime",
  "V34 不寫資料",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "GO_DRY_RUN",
  "NO_GO",
  "production write 一律 BLOCKED",
  "dryRunModeRequired",
  "noWriteModeRequired",
  "productionWriteAllowed",
  "buySellCommandGenerationBlocked",
  "notTradeAdviceAlwaysTrue",
  "SOURCE_AUTHORIZATION",
  "STALE_GUARD",
  "NO_DANGER_GUARD",
  "DRY_RUN_MODE",
  "NO_WRITE_GUARD",
  "AUDIT_LOG_SHAPE",
  "ROLLBACK_PLAN",
  "KILL_SWITCH",
  "BUY_SELL_COMMAND_BLOCK",
  "PRODUCTION_WRITE_BLOCKED",
  "auditId",
  "rollbackId",
  "killSwitchId",
  "GO_DRY_RUN 不是 production",
  "GO_DRY_RUN 不代表可寫資料",
  "GO_DRY_RUN 不代表產生買賣指令",
];

const COMPONENT_FIELD_TERMS: string[] = [
  "gateId",
  "gateLabel",
  "severity",
  "status",
  "featureArea",
  "passed",
  "blockingReason",
  "warningReason",
  "requiredEvidence",
  "missingEvidence",
  "nextRequiredAction",
  "ownerHint",
];

// ---------------------------------------------------------------------------
// Gate 4: Component safety (forbidden tokens, comment-stripped lowercase)
// ---------------------------------------------------------------------------

const COMPONENT_FORBIDDEN: string[] = [
  "fetch(",
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

  // Must import the pure builder, must NOT import any API route.
  if (lower.includes("buildruntimepilotreadinesscontract")) {
    details.push("PASS  Component imports buildRuntimePilotReadinessContract (pure builder).");
  } else {
    issues.push("FAIL  Component must import buildRuntimePilotReadinessContract.");
  }
  if (lower.includes("app/api")) {
    issues.push("FAIL  Component must not import an API route (app/api).");
  } else {
    details.push("PASS  Component does not import an API route.");
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

  if (body.includes("RuntimePilotReadiness")) {
    details.push("PASS  RuntimePilotReadiness referenced in holdings page.");
  } else {
    issues.push("FAIL  RuntimePilotReadiness not referenced in holdings page.");
  }
  if (body.includes("components/runtime-pilot-readiness")) {
    details.push("PASS  holdings page imports components/runtime-pilot-readiness.");
  } else {
    issues.push("FAIL  holdings page does not import components/runtime-pilot-readiness.");
  }
  if (body.includes("<RuntimePilotReadiness")) {
    details.push("PASS  <RuntimePilotReadiness /> rendered in holdings page.");
  } else {
    issues.push("FAIL  <RuntimePilotReadiness /> not rendered in holdings page.");
  }

  const lower = stripComments(body).toLowerCase();
  for (const token of ["http://", "https://", "@supabase", "createclient", "process.env", "axios", "app/api"]) {
    if (lower.includes(token)) {
      issues.push(`FAIL  Forbidden "${token}" present in ${PAGE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${PAGE_REL}.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "page_integration", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:runtime-pilot-readiness-ui": "node --require ./scripts/register-typescript.cjs ./scripts/validate-runtime-pilot-readiness-ui.ts"',
];

const README_TERMS: string[] = [
  "V34",
  "Runtime Pilot Readiness UI",
  "docs/runtime-pilot-readiness-ui.md",
  "components/runtime-pilot-readiness.tsx",
  "app/holdings/page.tsx",
  "npm run test:runtime-pilot-readiness-ui",
  "RuntimePilotReadiness",
  "GO_DRY_RUN",
  "NO_GO",
  "SOURCE_AUTHORIZATION",
  "KILL_SWITCH",
  "AUDIT_LOG_SHAPE",
  "ROLLBACK_PLAN",
  "production write 一律 BLOCKED",
  "readiness preview 不是 runtime 狀態",
  "fixture data 不是即時資料",
  "V34 不接真資料",
  "V34 不建立 runtime",
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

  // No new API route for runtime pilot.
  const forbiddenRoutes = [
    "app/api/runtime-pilot/route.ts",
    "app/api/portfolio/runtime-pilot/route.ts",
    "app/api/portfolio/runtime-readiness/route.ts",
  ];
  for (const rel of forbiddenRoutes) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  API route ${rel} must not exist in V34.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // No new SQL migration / runtime pilot runner.
  const forbiddenArtifacts = [
    "supabase/runtime_pilot_ui.sql",
    "services/runtime-pilot/quote-poller.ts",
    "services/runtime-pilot/scheduler.ts",
    "use-cases/runtime-pilot/runtime-pilot-runner.ts",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V34.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // Protected layers must still be present (V33 contract / builder, API routes,
  // War Room, prior UI components not deleted).
  const protectedFiles = [
    "use-cases/runtime-pilot/runtime-pilot-readiness-contract.ts",
    "use-cases/runtime-pilot/build-runtime-pilot-readiness-contract.ts",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "components/intraday-defense-tracker.tsx",
    "components/holding-defense-tracker.tsx",
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

const summary: RuntimePilotUiSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, COMPONENT_REL, PAGE_REL, CONTRACT_REL, BUILDER_REL, README_REL, PKG_REL],
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
