/**
 * Preview Deployment Readiness Validator — V42
 *
 * Contract / spec-only check. Imports the pure builder + constants and inspects
 * the bundle shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, build a runtime, write data, or trigger a
 * deploy.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/deployment/build-preview-deployment-readiness-contract") as typeof import("../use-cases/deployment/build-preview-deployment-readiness-contract");
const { buildPreviewDeploymentReadinessContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface ReadinessSummary {
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
  ui_created: false;
  runtime_created: false;
  sql_migration_created: false;
  deploy_performed: false;
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

const DOC_REL = "docs/preview-deployment-readiness.md";
const CONTRACT_REL = "use-cases/deployment/preview-deployment-readiness-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-preview-deployment-readiness-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Preview Deployment Readiness doc (new)", rel: DOC_REL },
    { label: "Preview Deployment Readiness contract (new)", rel: CONTRACT_REL },
    { label: "Preview Deployment Readiness builder (new)", rel: BUILDER_REL },
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
  "Preview Deployment Readiness",
  "preview deployment 不是 production trading system",
  "fixture data 不是即時資料",
  "V42 不接真資料",
  "V42 不建立 runtime",
  "V42 不寫資料",
  "/holdings",
  "/api/portfolio/runtime-pilot-dry-run",
  "/api/portfolio/first-authorized-source-dry-run",
  "Runtime Pilot Monitoring",
  "First Authorized Source Dry-Run Monitoring",
  "production write 一律 BLOCKED",
  "V43 Preview Deployment Smoke Test",
  "V44 First Authorized Source Connector Adapter Spec",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "PreviewDeploymentTarget",
  "PreviewDeploymentDecision",
  "PreviewDeploymentReadinessGateId",
  "PreviewDeploymentReadinessGate",
  "PreviewDeploymentRouteCheck",
  "PreviewDeploymentUiCheck",
  "PreviewDeploymentManualCheck",
  "PreviewDeploymentRollbackCheck",
  "PreviewDeploymentReadinessBundle",
  "PREVIEW_DEPLOYMENT_READINESS_CONTRACT_VERSION",
  "PREVIEW_DEPLOYMENT_READINESS_ALLOWED_GATES",
  "PREVIEW_DEPLOYMENT_READINESS_ALLOWED_DECISIONS",
  "PREVIEW_DEPLOYMENT_READINESS_SAFETY_LABELS",
  "PREVIEW_DEPLOYMENT_READINESS_DISALLOWED_TERMS",
  "READY_FOR_PREVIEW_DEPLOY",
  "READY_FOR_REVIEW",
  "NO_GO",
  "productionDataEnabled: false",
  "runtimeEnabled: false",
  "externalMarketDataEnabled: false",
  "supabaseEnabled: false",
  "databaseWriteEnabled: false",
  "buySellCommandEnabled: false",
  "autoOrderEnabled: false",
  "productionWritePerformed: false",
  "requestPerformed: false",
  "supabaseConnected: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Payload checks (call pure function)
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildPreviewDeploymentReadinessContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V42");
  expectEq("deploymentTarget", p.deploymentTarget, "preview");
  expectEq("deploymentProvider", p.deploymentProvider, "vercel_or_nextjs_compatible");
  expectEq("decision", p.decision, "READY_FOR_REVIEW");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);

  if (p.gates.length >= 17) {
    details.push(`PASS  gates.length = ${p.gates.length} (>= 17).`);
  } else {
    issues.push(`FAIL  gates.length = ${p.gates.length}, expected >= 17.`);
  }

  const routePaths = p.routeChecks.map((r) => r.routePath);
  for (const rp of ["/holdings", "/api/portfolio/runtime-pilot-dry-run", "/api/portfolio/first-authorized-source-dry-run"]) {
    if (routePaths.includes(rp)) {
      details.push(`PASS  routeChecks includes "${rp}".`);
    } else {
      issues.push(`FAIL  routeChecks must include "${rp}".`);
    }
  }

  const uiSections = p.uiChecks.map((u) => u.sectionName);
  for (const sec of ["Runtime Pilot Monitoring", "First Authorized Source Dry-Run Monitoring"]) {
    if (uiSections.includes(sec)) {
      details.push(`PASS  uiChecks includes "${sec}".`);
    } else {
      issues.push(`FAIL  uiChecks must include "${sec}".`);
    }
  }

  expectEq("productionDataEnabled", p.productionDataEnabled, false);
  expectEq("runtimeEnabled", p.runtimeEnabled, false);
  expectEq("externalMarketDataEnabled", p.externalMarketDataEnabled, false);
  expectEq("supabaseEnabled", p.supabaseEnabled, false);
  expectEq("databaseWriteEnabled", p.databaseWriteEnabled, false);
  expectEq("buySellCommandEnabled", p.buySellCommandEnabled, false);
  expectEq("autoOrderEnabled", p.autoOrderEnabled, false);
  expectEq("productionWritePerformed", p.productionWritePerformed, false);
  expectEq("requestPerformed", p.requestPerformed, false);
  expectEq("supabaseConnected", p.supabaseConnected, false);

  if (p.safetyLabels.includes("不產生買賣指令")) {
    details.push('PASS  safetyLabels includes "不產生買賣指令".');
  } else {
    issues.push('FAIL  safetyLabels must include "不產生買賣指令".');
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:preview-deployment-readiness": "node --require ./scripts/register-typescript.cjs ./scripts/validate-preview-deployment-readiness.ts"',
];

const README_TERMS: string[] = [
  "V42",
  "Preview Deployment Readiness",
  "docs/preview-deployment-readiness.md",
  "use-cases/deployment/preview-deployment-readiness-contract.ts",
  "use-cases/deployment/build-preview-deployment-readiness-contract.ts",
  "npm run test:preview-deployment-readiness",
  "READY_FOR_REVIEW",
  "preview deployment 不是 production trading system",
  "fixture data 不是即時資料",
  "V42 不接真資料",
  "V42 不建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 API route",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 6: Safety checks
// ---------------------------------------------------------------------------

const DB_WRITE_TOKENS = ["insert(", "upsert(", "update(", "delete("];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 6a. Contract + builder code: no external request / supabase / env / clock /
  //     DB writes.
  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
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
    ];
    for (const token of forbidden) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${token}" in ${rel} code.`);
      }
    }
  }

  // 6b. No new API route / UI component / SQL migration for this readiness round.
  const forbiddenArtifacts = [
    "app/api/preview-deployment-readiness/route.ts",
    "app/api/portfolio/preview-deployment-readiness/route.ts",
    "components/preview-deployment-readiness.tsx",
    "supabase/preview_deployment_readiness.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V42.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 6c. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    "app/holdings/page.tsx",
    "components/runtime-pilot-monitoring.tsx",
    "components/first-authorized-source-dry-run-monitoring.tsx",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "app/api/portfolio/first-authorized-source-dry-run/route.ts",
    "use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract.ts",
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
const contractBody = readFile(resolve(CONTRACT_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const contractCheck = checkTerms("contract_checks", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const payloadCheck = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
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

const summary: ReadinessSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
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
  api_route_created: false,
  ui_created: false,
  runtime_created: false,
  sql_migration_created: false,
  deploy_performed: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
