/**
 * War Room UI Integration Validator — V21
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

interface WarRoomUiSummary {
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
  // Remove block comments, line comments, and JSX comments {/* ... */}.
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
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

const DOC_REL = "docs/war-room-ui-integration.md";
const COMPONENT_REL = "components/war-room-dashboard.tsx";
const PAGE_REL = "app/page.tsx";
const ROUTE_REL = "app/api/war-room/route.ts";
const API_DOC_REL = "docs/war-room-api-contract.md";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "War Room UI Integration doc (new)", rel: DOC_REL },
    { label: "War Room dashboard component (new)", rel: COMPONENT_REL },
    { label: "Dashboard page", rel: PAGE_REL },
    { label: "War Room API route", rel: ROUTE_REL },
    { label: "War Room API Contract doc", rel: API_DOC_REL },
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
  "War Room UI Integration",
  "/api/war-room",
  "PREMARKET",
  "INTRADAY",
  "POSTMARKET",
  "REALTIME_ALERT",
  "marketStatusLight",
  "realtimeAlerts",
  "portfolioRiskRadar",
  "researchTopPicks",
  "technicalRiskRewardCandidates",
  "avoidList",
  "nextObservationPoints",
  "sourceSummary",
  "dataQualitySummary",
  "mock_or_contract",
  "spec_only",
  "資料不足就顯示資料不足",
  "不自動下單",
  "不產生買賣指令",
  "Research Rating 不等於 actionSignal",
  "TOP5 Technical Candidates 不等於買進清單",
];

// ---------------------------------------------------------------------------
// Gate 3: Component checks
// ---------------------------------------------------------------------------

const COMPONENT_TERMS: string[] = [
  '"use client"',
  "/api/war-room",
  "PREMARKET",
  "INTRADAY",
  "POSTMARKET",
  "REALTIME_ALERT",
  "marketStatusLight",
  "realtimeAlerts",
  "portfolioRiskRadar",
  "researchTopPicks",
  "technicalRiskRewardCandidates",
  "avoidList",
  "nextObservationPoints",
  "sourceSummary",
  "dataQualitySummary",
  "highConfidenceConclusionAllowed",
  "mock_or_contract",
  "spec_only",
  "不自動下單",
  "不產生買賣指令",
  "資料不足",
];

// ---------------------------------------------------------------------------
// Gate 4: Page integration checks
// ---------------------------------------------------------------------------

function checkPageIntegration(): CheckResult {
  const source = readFile(resolve(PAGE_REL));
  if (source == null) {
    return {
      name: "page_integration",
      status: "FAIL",
      details: [`FAIL  Cannot read ${PAGE_REL}.`],
    };
  }
  const details: string[] = [];
  const issues: string[] = [];

  if (source.includes("WarRoomDashboard")) {
    details.push("PASS  WarRoomDashboard imported/used in app/page.tsx.");
  } else {
    issues.push("FAIL  WarRoomDashboard not found in app/page.tsx.");
  }
  if (source.includes("<WarRoomDashboard />")) {
    details.push("PASS  <WarRoomDashboard /> rendered in app/page.tsx.");
  } else {
    issues.push("FAIL  <WarRoomDashboard /> not rendered in app/page.tsx.");
  }
  // Must not remove the existing portfolio valuation radar summary.
  if (source.includes("PortfolioValuationRadarSummary")) {
    details.push("PASS  PortfolioValuationRadarSummary preserved in app/page.tsx.");
  } else {
    issues.push("FAIL  PortfolioValuationRadarSummary removed from app/page.tsx.");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "page_integration", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Safety checks
// ---------------------------------------------------------------------------

// External / forbidden indicators. The component may ONLY fetch the internal
// /api/war-room endpoint, so absolute URLs and external data-source names are
// forbidden. Scanned against comment-stripped, lower-cased source.
const FORBIDDEN_SOURCE_TOKENS: Array<{ token: string; label: string }> = [
  { token: "https://", label: "absolute https URL" },
  { token: "http://", label: "absolute http URL" },
  { token: "twse", label: "TWSE source" },
  { token: "yahoo", label: "Yahoo source" },
  { token: "finmind", label: "FinMind source" },
  { token: "factset", label: "FactSet source" },
  { token: "tradingview", label: "TradingView source" },
  { token: "broker", label: "broker source" },
  { token: "process.env", label: "env secret read" },
  { token: "axios", label: "axios usage" },
  { token: "@supabase", label: "@supabase import" },
  { token: "createclient", label: "Supabase createClient" },
  { token: "buildwarroomreadmodelcontract", label: "runtime builder import" },
  { token: "build-valuation-summary-contract", label: "valuation engine builder import" },
];

const CHART_LIB_TOKENS = ["recharts", "chart.js", "chartjs", "victory", "nivo", "echarts", "d3"];
const RENDERER_LIB_TOKENS = ["puppeteer", "playwright", "sharp", "html2canvas", "weasyprint", "canvas"];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 5a. Component + page must contain no forbidden external/runtime tokens.
  for (const rel of [COMPONENT_REL, PAGE_REL]) {
    const source = readFile(resolve(rel));
    if (source == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      continue;
    }
    const lower = stripComments(source).toLowerCase();
    for (const { token, label } of FORBIDDEN_SOURCE_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden "${label}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${label}" in ${rel} code.`);
      }
    }
    // The only fetch in the component must target the internal API route.
    if (rel === COMPONENT_REL && lower.includes("fetch(")) {
      if (lower.includes("/api/war-room")) {
        details.push(`PASS  ${rel} fetch targets internal /api/war-room.`);
      } else {
        issues.push(`FAIL  ${rel} fetch does not target /api/war-room.`);
      }
    }
  }

  // 5b. No chart library / image renderer added to package.json.
  const pkg = readFile(resolve("package.json"));
  if (pkg == null) {
    issues.push("FAIL  Cannot read package.json.");
  } else {
    const lowerPkg = pkg.toLowerCase();
    for (const token of CHART_LIB_TOKENS) {
      if (lowerPkg.includes(`"${token}`)) {
        issues.push(`FAIL  Chart library "${token}" must not be added.`);
      }
    }
    for (const token of RENDERER_LIB_TOKENS) {
      if (lowerPkg.includes(`"${token}`)) {
        issues.push(`FAIL  Renderer library "${token}" must not be added.`);
      }
    }
    details.push("PASS  No chart library / image renderer dependency added.");
  }

  // 5c. No new API route / SQL migration for war-room UI.
  const forbiddenArtifacts = [
    "app/api/war-room-ui/route.ts",
    "app/api/war-room-dashboard/route.ts",
    "supabase/war_room_ui.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V21.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5d. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
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

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const componentCheck = checkTerms(
  "component_checks",
  componentBody,
  COMPONENT_REL,
  COMPONENT_TERMS,
);
const pageCheck = checkPageIntegration();
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  componentCheck,
  pageCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: WarRoomUiSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, COMPONENT_REL, PAGE_REL, ROUTE_REL, API_DOC_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    component_checks: componentCheck.status,
    page_integration: pageCheck.status,
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
