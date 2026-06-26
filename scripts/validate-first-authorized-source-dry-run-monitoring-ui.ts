/**
 * First Authorized Source Dry-Run Monitoring UI Validator — V41
 *
 * Static file check. Reads the new client component, the holdings page, the V40
 * API route / API builder, the doc, README and package.json; it does NOT start a
 * Next.js server, make any HTTP request, connect to Supabase, read env keys,
 * build a runtime, or write data.
 *
 * The component may TYPE-import FirstAuthorizedSourceDryRunApiResponse from the
 * V40 API builder module, but must never import the builder FUNCTION or any
 * app/api route, and may only fetch the internal
 * /api/portfolio/first-authorized-source-dry-run endpoint.
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

const DOC_REL = "docs/first-authorized-source-dry-run-monitoring-ui.md";
const COMPONENT_REL = "components/first-authorized-source-dry-run-monitoring.tsx";
const PAGE_REL = "app/holdings/page.tsx";
const ROUTE_REL = "app/api/portfolio/first-authorized-source-dry-run/route.ts";
const API_BUILDER_REL = "use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract.ts";
const CONTRACT_BUILDER_REL = "use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Monitoring UI doc (new)", rel: DOC_REL },
    { label: "Monitoring UI component (new)", rel: COMPONENT_REL },
    { label: "Holdings page", rel: PAGE_REL },
    { label: "V40 API route", rel: ROUTE_REL },
    { label: "V40 API builder", rel: API_BUILDER_REL },
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
  "First Authorized Source Dry-Run Monitoring UI",
  "/api/portfolio/first-authorized-source-dry-run",
  "monitoring preview 不是 runtime 狀態",
  "fixture data 不是即時資料",
  "V41 不接真資料",
  "V41 不建立 runtime",
  "V41 不寫資料",
  "production write 一律 BLOCKED",
  "First Authorized Source Dry-Run monitoring 不是 production",
  "First Authorized Source Dry-Run monitoring 不代表可寫資料",
  "First Authorized Source Dry-Run monitoring 不代表產生買賣指令",
  "V42 First Real Authorized Source Review",
  "V43 First Authorized Source Connector Adapter Spec",
];

// ---------------------------------------------------------------------------
// Gate 3: Component required terms
// ---------------------------------------------------------------------------

const COMPONENT_TERMS: string[] = [
  "'use client'",
  "FirstAuthorizedSourceDryRunMonitoring",
  "/api/portfolio/first-authorized-source-dry-run",
  "FirstAuthorizedSourceDryRunApiResponse",
  "useEffect",
  "useState",
  "First Authorized Source Dry-Run Monitoring",
  "fixture data 不是即時資料",
  "monitoring preview 不是 runtime 狀態",
  "V41 不接真資料",
  "V41 不建立 runtime",
  "V41 不寫資料",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "single-source",
  "source-neutral connector shape",
  "manualSignOffCompleted",
  "dryRunAllowed",
  "authorizationStatus",
  "legalStatus",
  "sourceCategory",
  "requestMode",
  "requestPerformed",
  "rawResponseStored",
  "normalizedSnapshotProduced",
  "priceVerified",
  "highConfidenceConclusionAllowed",
  "precisePriceZoneAllowed",
  "projectedAlertLevel",
  "noDangerGuardApplied",
  "buySellCommandGenerated",
  "autoOrderRequested",
  "productionWriteRequested",
  "writeAttempted",
  "databaseWritePerformed",
  "externalOrderPerformed",
  "productionWritePerformed",
  "supabaseConnected",
  "preflight",
  "connectorShape",
  "quoteSnapshot",
  "priceVerification",
  "alertProjection",
  "auditEvent",
  "noWriteProof",
  "killSwitch",
  "rollback",
  "production write 一律 BLOCKED",
  "First Authorized Source Dry-Run monitoring 不是 production",
  "First Authorized Source Dry-Run monitoring 不代表可寫資料",
  "First Authorized Source Dry-Run monitoring 不代表產生買賣指令",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
];

// ---------------------------------------------------------------------------
// Gate 4: Component safety (forbidden tokens, comment-stripped lowercase)
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
  "https://",
  "http://",
  ...RUNTIME_SOURCE_TOKENS,
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
    if (lower.includes("/api/portfolio/first-authorized-source-dry-run")) {
      details.push("PASS  Component fetch targets internal /api/portfolio/first-authorized-source-dry-run.");
    } else {
      issues.push("FAIL  Component fetch does not target /api/portfolio/first-authorized-source-dry-run.");
    }
  } else {
    issues.push("FAIL  Component does not contain a fetch( call.");
  }

  // The response TYPE may be type-imported from the API builder module, but the
  // runtime API builder FUNCTION and any API route must never be imported.
  if (lower.includes("buildfirstauthorizedsourcedryrunapicontract")) {
    issues.push("FAIL  Component must not import buildFirstAuthorizedSourceDryRunApiContract (runtime builder).");
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

  if (body.includes("FirstAuthorizedSourceDryRunMonitoring")) {
    details.push("PASS  FirstAuthorizedSourceDryRunMonitoring referenced in holdings page.");
  } else {
    issues.push("FAIL  FirstAuthorizedSourceDryRunMonitoring not referenced in holdings page.");
  }
  if (body.includes("components/first-authorized-source-dry-run-monitoring")) {
    details.push("PASS  holdings page imports components/first-authorized-source-dry-run-monitoring.");
  } else {
    issues.push("FAIL  holdings page does not import components/first-authorized-source-dry-run-monitoring.");
  }
  if (body.includes("<FirstAuthorizedSourceDryRunMonitoring")) {
    details.push("PASS  <FirstAuthorizedSourceDryRunMonitoring /> rendered in holdings page.");
  } else {
    issues.push("FAIL  <FirstAuthorizedSourceDryRunMonitoring /> not rendered in holdings page.");
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
// Gate 6: API route check (V40 route still present, no new route added)
// ---------------------------------------------------------------------------

function checkApiRoute(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  if (fileExists(resolve(ROUTE_REL))) {
    details.push(`PASS  V40 route ${ROUTE_REL} still present.`);
  } else {
    issues.push(`FAIL  V40 route ${ROUTE_REL} missing.`);
  }

  // No NEW API route may be added in V41.
  const forbiddenNewRoutes = [
    "app/api/portfolio/first-authorized-source-dry-run-monitoring/route.ts",
    "app/api/first-authorized-source-dry-run-monitoring/route.ts",
  ];
  for (const rel of forbiddenNewRoutes) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  New API route ${rel} must not be created in V41.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // V40 route must remain unmodified-in-spirit: still calls the V40 API builder.
  const routeBody = readFile(resolve(ROUTE_REL));
  if (routeBody == null) {
    issues.push(`FAIL  Cannot read ${ROUTE_REL}.`);
  } else if (routeBody.includes("buildFirstAuthorizedSourceDryRunApiContract")) {
    details.push("PASS  V40 route still calls buildFirstAuthorizedSourceDryRunApiContract.");
  } else {
    issues.push("FAIL  V40 route may have been altered (API builder call missing).");
  }

  // V40 API builder must still wrap the V39 pure builder.
  const apiBuilderBody = readFile(resolve(API_BUILDER_REL));
  if (apiBuilderBody == null) {
    issues.push(`FAIL  Cannot read ${API_BUILDER_REL}.`);
  } else if (apiBuilderBody.includes("buildFirstAuthorizedSourceDryRunContract")) {
    details.push("PASS  V40 API builder still wraps the V39 pure builder.");
  } else {
    issues.push("FAIL  V40 API builder may have been altered (V39 builder call missing).");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "api_route_check", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:first-authorized-source-dry-run-monitoring-ui": "node --require ./scripts/register-typescript.cjs ./scripts/validate-first-authorized-source-dry-run-monitoring-ui.ts"',
];

const README_TERMS: string[] = [
  "V41",
  "First Authorized Source Dry-Run Monitoring UI",
  "docs/first-authorized-source-dry-run-monitoring-ui.md",
  "components/first-authorized-source-dry-run-monitoring.tsx",
  "app/holdings/page.tsx",
  "npm run test:first-authorized-source-dry-run-monitoring-ui",
  "/api/portfolio/first-authorized-source-dry-run",
  "single-source",
  "source-neutral connector shape",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "manualSignOffCompleted",
  "preflight",
  "connectorShape",
  "quoteSnapshot",
  "priceVerification",
  "alertProjection",
  "auditEvent",
  "noWriteProof",
  "killSwitch",
  "rollback",
  "production write 一律 BLOCKED",
  "monitoring preview 不是 runtime 狀態",
  "fixture data 不是即時資料",
  "V41 不接真資料",
  "V41 不建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 API route",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 8: Safety checks
// ---------------------------------------------------------------------------

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 8a. No new SQL migration / no duplicate component for the monitoring UI.
  const forbiddenArtifacts = [
    "supabase/first_authorized_source_dry_run_monitoring.sql",
    "components/first-authorized-source-dry-run.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V41.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 8b. No monitoring runtime / poller / scheduler / connector.
  const forbiddenRuntime = [
    "use-cases/runtime-pilot/first-authorized-source-connector.ts",
    "services/runtime-pilot/first-authorized-source-poller.ts",
    "services/runtime-pilot/first-authorized-source-scheduler.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V41.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 8c. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    ROUTE_REL,
    API_BUILDER_REL,
    CONTRACT_BUILDER_REL,
    "use-cases/runtime-pilot/first-authorized-source-dry-run-contract.ts",
    "components/runtime-pilot-monitoring.tsx",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
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
const componentTermCheck = checkTerms("component_checks", componentBody, COMPONENT_REL, COMPONENT_TERMS);
const componentSafetyCheck = checkComponentSafety();
const pageCheck = checkPageIntegration();
const apiRouteCheck = checkApiRoute();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  componentTermCheck,
  componentSafetyCheck,
  pageCheck,
  apiRouteCheck,
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
    component_checks: componentTermCheck.status,
    component_safety: componentSafetyCheck.status,
    page_integration: pageCheck.status,
    api_route_check: apiRouteCheck.status,
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
