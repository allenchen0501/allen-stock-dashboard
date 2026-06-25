/**
 * Runtime Pilot Monitoring UI Validator — V37
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

interface MonitoringUiSummary {
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

const DOC_REL = "docs/runtime-pilot-monitoring-ui.md";
const COMPONENT_REL = "components/runtime-pilot-monitoring.tsx";
const PAGE_REL = "app/holdings/page.tsx";
const ROUTE_REL = "app/api/portfolio/runtime-pilot-dry-run/route.ts";
const API_BUILDER_REL = "use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Runtime Pilot Monitoring UI doc (new)", rel: DOC_REL },
    { label: "Runtime Pilot Monitoring component (new)", rel: COMPONENT_REL },
    { label: "Holdings page", rel: PAGE_REL },
    { label: "Runtime Pilot Dry-Run API route", rel: ROUTE_REL },
    { label: "Runtime Pilot Dry-Run API builder", rel: API_BUILDER_REL },
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
  "Runtime Pilot Monitoring UI",
  "/api/portfolio/runtime-pilot-dry-run",
  "monitoring preview 不是 runtime 狀態",
  "fixture data 不是即時資料",
  "V37 不接真資料",
  "V37 不建立 runtime",
  "V37 不寫資料",
  "production write 一律 BLOCKED",
  "Dry-run monitoring 不是 production",
  "Dry-run monitoring 不代表可寫資料",
  "Dry-run monitoring 不代表產生買賣指令",
  "V38 Runtime Pilot Implementation Review",
  "V39 First Authorized Source Dry-Run",
];

// ---------------------------------------------------------------------------
// Gate 3: Component checks
// ---------------------------------------------------------------------------

const COMPONENT_TERMS: string[] = [
  "'use client'",
  "RuntimePilotMonitoring",
  "/api/portfolio/runtime-pilot-dry-run",
  "RuntimePilotDryRunApiResponse",
  "useEffect",
  "useState",
  "fetch(",
  "Runtime Pilot Monitoring",
  "fixture data 不是即時資料",
  "monitoring preview 不是 runtime 狀態",
  "V37 不接真資料",
  "V37 不建立 runtime",
  "V37 不寫資料",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "DRY_RUN_NOT_ALLOWED",
  "DRY_RUN_COMPLETED_WITH_NO_WRITE",
  "dry_run_spec",
  "NO_GO",
  "dryRunAllowed",
  "priceVerified",
  "highConfidenceConclusionAllowed",
  "precisePriceZoneAllowed",
  "buySellCommandGenerated",
  "autoOrderRequested",
  "productionWriteRequested",
  "writeAttempted",
  "databaseWritePerformed",
  "externalOrderPerformed",
  "productionWritePerformed",
  "supabaseConnected",
  "requestPerformed",
  "noDangerGuardApplied",
  "auditEvent",
  "noWriteProof",
  "killSwitch",
  "rollback",
  "production write 一律 BLOCKED",
  "Dry-run monitoring 不是 production",
  "Dry-run monitoring 不代表可寫資料",
  "Dry-run monitoring 不代表產生買賣指令",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
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
    if (lower.includes("/api/portfolio/runtime-pilot-dry-run")) {
      details.push("PASS  Component fetch targets internal /api/portfolio/runtime-pilot-dry-run.");
    } else {
      issues.push("FAIL  Component fetch does not target /api/portfolio/runtime-pilot-dry-run.");
    }
  } else {
    issues.push("FAIL  Component does not contain a fetch( call.");
  }

  // The response TYPE may be type-imported from the API builder module, but the
  // runtime API builder FUNCTION and any API route must never be imported.
  if (lower.includes("buildruntimepilotdryrunapicontract")) {
    issues.push("FAIL  Component must not import buildRuntimePilotDryRunApiContract (runtime builder).");
  } else {
    details.push("PASS  Component does not import the runtime API builder function.");
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

  if (body.includes("RuntimePilotMonitoring")) {
    details.push("PASS  RuntimePilotMonitoring referenced in holdings page.");
  } else {
    issues.push("FAIL  RuntimePilotMonitoring not referenced in holdings page.");
  }
  if (body.includes("components/runtime-pilot-monitoring")) {
    details.push("PASS  holdings page imports components/runtime-pilot-monitoring.");
  } else {
    issues.push("FAIL  holdings page does not import components/runtime-pilot-monitoring.");
  }
  if (body.includes("<RuntimePilotMonitoring")) {
    details.push("PASS  <RuntimePilotMonitoring /> rendered in holdings page.");
  } else {
    issues.push("FAIL  <RuntimePilotMonitoring /> not rendered in holdings page.");
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
  '"test:runtime-pilot-monitoring-ui": "node --require ./scripts/register-typescript.cjs ./scripts/validate-runtime-pilot-monitoring-ui.ts"',
];

const README_TERMS: string[] = [
  "V37",
  "Runtime Pilot Monitoring UI",
  "docs/runtime-pilot-monitoring-ui.md",
  "components/runtime-pilot-monitoring.tsx",
  "app/holdings/page.tsx",
  "npm run test:runtime-pilot-monitoring-ui",
  "/api/portfolio/runtime-pilot-dry-run",
  "DRY_RUN_NOT_ALLOWED",
  "dry_run_spec",
  "NO_GO",
  "auditEvent",
  "noWriteProof",
  "killSwitch",
  "rollback",
  "production write 一律 BLOCKED",
  "monitoring preview 不是 runtime 狀態",
  "fixture data 不是即時資料",
  "V37 不接真資料",
  "V37 不建立 runtime",
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

  // No new API route / SQL migration for the monitoring UI.
  const forbiddenArtifacts = [
    "app/api/runtime-pilot-monitoring/route.ts",
    "app/api/portfolio/runtime-pilot-monitoring/route.ts",
    "supabase/runtime_pilot_monitoring.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V37.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // No runtime pilot monitoring runtime / poller / scheduler.
  const forbiddenRuntime = [
    "services/runtime-pilot/monitoring-poller.ts",
    "services/runtime-pilot/monitoring-scheduler.ts",
    "use-cases/runtime-pilot/runtime-pilot-monitoring-runner.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V37.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // Protected layers must still be present (V36 route / API builder, prior UI,
  // War Room not deleted).
  const protectedFiles = [
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract.ts",
    "use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract.ts",
    "components/runtime-pilot-readiness.tsx",
    "components/intraday-defense-tracker.tsx",
    "app/api/war-room/route.ts",
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

  // V36 route must remain unmodified-in-spirit: still calls the API builder.
  const routeBody = readFile(resolve(ROUTE_REL));
  if (routeBody == null) {
    issues.push(`FAIL  Cannot read ${ROUTE_REL}.`);
  } else if (routeBody.includes("buildRuntimePilotDryRunApiContract")) {
    details.push("PASS  V36 route still calls buildRuntimePilotDryRunApiContract.");
  } else {
    issues.push("FAIL  V36 route may have been altered (API builder call missing).");
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
const componentSafetyCheck = checkComponentSafety();
const pageCheck = checkPageIntegration();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  componentCheck,
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

const summary: MonitoringUiSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, COMPONENT_REL, PAGE_REL, ROUTE_REL, API_BUILDER_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    component_checks: componentCheck.status,
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
