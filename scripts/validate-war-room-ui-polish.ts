/**
 * War Room UI Polish Validator — V23
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

interface WarRoomUiPolishSummary {
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

const DOC_REL = "docs/war-room-ui-polish.md";
const COMPONENT_REL = "components/war-room-dashboard.tsx";
const FIXTURE_DOC_REL = "docs/war-room-engine-fixture-adapters.md";
const UI_CHECKER_REL = "scripts/validate-war-room-ui-integration.ts";
const ROUTE_REL = "app/api/war-room/route.ts";
const PAGE_REL = "app/page.tsx";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "War Room UI Polish doc (new)", rel: DOC_REL },
    { label: "War Room dashboard component (modified)", rel: COMPONENT_REL },
    { label: "War Room Engine Fixture Adapters doc", rel: FIXTURE_DOC_REL },
    { label: "War Room UI Integration checker", rel: UI_CHECKER_REL },
    { label: "War Room API route (must remain unchanged)", rel: ROUTE_REL },
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
  "War Room UI Polish",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
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
  "不自動下單",
  "不產生買賣指令",
  "TOP5 Technical Candidates 不等於買進清單",
  "observationPrice 不是買進價",
  "invalidLevel 不是自動停損價",
  "targetZone 不是目標價",
];

// ---------------------------------------------------------------------------
// Gate 3: Component checks
// ---------------------------------------------------------------------------

const COMPONENT_TERMS: string[] = [
  '"use client"',
  "/api/war-room",
  "Allen Stock War Room",
  "fixtureAdapterVersion",
  "mock_or_contract",
  "sourceMode",
  "highConfidenceConclusionAllowed",
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
  "portfolioRiskItems",
  "researchTopPickItems",
  "technicalCandidateItems",
  "intradayAlertItems",
  "avoidItems",
  "observationPoints",
  "sourceSummary",
  "dataQualitySummary",
  "觀察價，不是買進價",
  "失效觀察價，不是自動停損價",
  "觀察目標區，不是目標價",
  "不是賣出指令",
  "不自動下單",
  "不產生買賣指令",
  "資料不足",
];

// ---------------------------------------------------------------------------
// Gate 4: Safety checks
// ---------------------------------------------------------------------------

// Forbidden tokens scanned against comment-stripped, lower-cased source.
// NOTE: fetch('/api/war-room') is ALLOWED — that is the only internal fetch.
// We block absolute https:// / http:// URLs and all external data sources.
const FORBIDDEN_SOURCE_TOKENS: Array<{ token: string; label: string }> = [
  { token: "https://", label: "absolute https URL" },
  { token: "http://", label: "absolute http URL" },
  { token: "twse", label: "TWSE source" },
  { token: "tpex", label: "TPEx source" },
  { token: "yahoo", label: "Yahoo source" },
  { token: "finmind", label: "FinMind source" },
  { token: "factset", label: "FactSet source" },
  { token: "tradingview", label: "TradingView source" },
  { token: "broker", label: "broker source" },
  { token: "yfinance", label: "yfinance source" },
  { token: "process.env", label: "env secret read" },
  { token: "axios", label: "axios usage" },
  { token: "@supabase", label: "@supabase import" },
  { token: "createclient", label: "Supabase createClient" },
  { token: "buildwarroomreadmodelcontract", label: "runtime builder import" },
  { token: "buildportfoliovaluationsummarycontract", label: "valuation engine builder import" },
];

const CHART_LIB_TOKENS = ["recharts", "chart.js", "chartjs", "victory", "nivo", "echarts", "d3"];
const RENDERER_LIB_TOKENS = ["puppeteer", "playwright", "sharp", "html2canvas", "weasyprint"];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 4a. Component safety scan.
  const componentSource = readFile(resolve(COMPONENT_REL));
  if (componentSource == null) {
    issues.push(`FAIL  Cannot read ${COMPONENT_REL}.`);
  } else {
    const lower = stripComments(componentSource).toLowerCase();

    for (const { token, label } of FORBIDDEN_SOURCE_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden "${label}" found in ${COMPONENT_REL}.`);
      } else {
        details.push(`PASS  No "${label}" in component code.`);
      }
    }

    // The only fetch in the component must target the internal /api/war-room endpoint.
    if (lower.includes("fetch(")) {
      if (lower.includes("/api/war-room")) {
        details.push(`PASS  Component fetch targets internal /api/war-room.`);
      } else {
        issues.push(`FAIL  Component fetch does not target /api/war-room.`);
      }
    } else {
      issues.push(`FAIL  Component does not contain a fetch( call.`);
    }
  }

  // 4b. No new chart library / image renderer in package.json.
  const pkg = readFile(resolve("package.json"));
  if (pkg == null) {
    issues.push("FAIL  Cannot read package.json.");
  } else {
    const lowerPkg = pkg.toLowerCase();
    for (const token of CHART_LIB_TOKENS) {
      if (lowerPkg.includes(`"${token}`)) {
        issues.push(`FAIL  Chart library "${token}" must not be added in V23.`);
      }
    }
    for (const token of RENDERER_LIB_TOKENS) {
      if (lowerPkg.includes(`"${token}`)) {
        issues.push(`FAIL  Renderer library "${token}" must not be added in V23.`);
      }
    }
    details.push("PASS  No chart library / image renderer dependency added.");
  }

  // 4c. No new API route / SQL migration / new UI component.
  const forbiddenArtifacts = [
    "app/api/war-room-polish/route.ts",
    "app/api/war-room-v23/route.ts",
    "components/war-room-polish.tsx",
    "components/war-room-v23.tsx",
    "supabase/war_room_polish.sql",
    "supabase/war_room_v23.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V23.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 4d. Protected layers must still be present (not modified / deleted).
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "use-cases/war-room/build-war-room-read-model-contract.ts",
    "use-cases/war-room/war-room-engine-fixture-adapters.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} still present.`);
    } else {
      issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
    }
  }

  // 4e. app/page.tsx must still render WarRoomDashboard and PortfolioValuationRadarSummary.
  const pageSource = readFile(resolve(PAGE_REL));
  if (pageSource == null) {
    issues.push(`FAIL  Cannot read ${PAGE_REL}.`);
  } else {
    if (pageSource.includes("WarRoomDashboard")) {
      details.push("PASS  WarRoomDashboard still in app/page.tsx.");
    } else {
      issues.push("FAIL  WarRoomDashboard missing from app/page.tsx.");
    }
    if (pageSource.includes("PortfolioValuationRadarSummary")) {
      details.push("PASS  PortfolioValuationRadarSummary preserved in app/page.tsx.");
    } else {
      issues.push("FAIL  PortfolioValuationRadarSummary removed from app/page.tsx.");
    }
  }

  // 4f. V23 must NOT have modified the API route, builder, or fixture adapter.
  const routeSource = readFile(resolve(ROUTE_REL));
  if (routeSource == null) {
    issues.push(`FAIL  Cannot read ${ROUTE_REL}.`);
  } else {
    if (routeSource.includes("buildWarRoomReadModelContract")) {
      details.push("PASS  API route still calls buildWarRoomReadModelContract.");
    } else {
      issues.push("FAIL  API route may have been modified incorrectly.");
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
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [fileCheck, phraseCheck, componentCheck, safetyCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: WarRoomUiPolishSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, COMPONENT_REL, FIXTURE_DOC_REL, UI_CHECKER_REL, ROUTE_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    component_checks: componentCheck.status,
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
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
