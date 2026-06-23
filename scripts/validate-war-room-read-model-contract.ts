/**
 * War Room Read Model Contract Validator — V19
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - start a Next.js server
 *   - make any HTTP request
 *   - connect to Supabase
 *   - read environment keys
 *   - write data
 *   - create an API route
 *   - create a UI component
 *   - implement runtime
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

interface WarRoomReadModelSummary {
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

const DOC_REL = "docs/war-room-read-model-contract.md";
const ARCH_DOC_REL = "docs/war-room-intelligence-architecture.md";
const CONTRACT_REL = "use-cases/war-room/war-room-intelligence-contract.ts";
const RESEARCH_REL = "use-cases/research/research-center-contract.ts";
const TECHNICAL_REL = "use-cases/technical-strategy/technical-risk-reward-contract.ts";
const INTRADAY_REL = "use-cases/intraday-alert/intraday-alert-contract.ts";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "War Room Read Model Contract doc (new)", rel: DOC_REL },
    { label: "War Room Intelligence Architecture doc", rel: ARCH_DOC_REL },
    { label: "War Room Intelligence contract", rel: CONTRACT_REL },
    { label: "Research Center contract", rel: RESEARCH_REL },
    { label: "Technical Risk Reward contract", rel: TECHNICAL_REL },
    { label: "Intraday Alert contract", rel: INTRADAY_REL },
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

const REQUIRED_PHRASES: string[] = [
  "War Room Read Model Contract",
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
  "Valuation Engine",
  "Institutional Research Center",
  "Technical + Risk Reward",
  "Intraday Risk Crisis Alert",
  "Research Rating 不等於 actionSignal",
  "TOP5 Research 不等於 TOP5 Entry",
  "TOP5 Technical Candidates 不等於買進清單",
  "Valuation Tier 不等於 actionSignal",
  "Intraday Alert 不等於出場",
  "資料不足就顯示資料不足",
  "不自動下單",
  "不產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "WarRoomMode",
  "WarRoomMarketStatus",
  "WarRoomAlertLevel",
  "WarRoomDataQualityStatus",
  "WarRoomSectionId",
  "WarRoomSourceSummary",
  "WarRoomDataQualitySummary",
  "WarRoomPortfolioRiskItem",
  "WarRoomAvoidItem",
  "WarRoomObservationPoint",
  "WarRoomIntelligenceSnapshot",
  "researchTopPickItems",
  "technicalCandidateItems",
  "intradayAlertItems",
  "avoidItems",
  "observationPoints",
  "sourceSummary",
  "dataQualitySummary",
  "highConfidenceConclusionAllowed",
  "notExitSignal",
  "notTradeAdvice",
  "requestPerformed",
  "supabaseConnected",
  "productionWritePerformed",
];

// ---------------------------------------------------------------------------
// Gate 4: Type integration checks
// ---------------------------------------------------------------------------

const INTEGRATION_TYPES: string[] = [
  "ResearchTopPick",
  "TechnicalRiskRewardCandidate",
  "IntradayAlertPayload",
];

function checkTypeIntegration(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const contract = readFile(resolve(CONTRACT_REL));
  if (contract == null) {
    return {
      name: "type_integration",
      status: "FAIL",
      details: [`FAIL  Cannot read ${CONTRACT_REL}.`],
    };
  }

  const code = stripComments(contract);

  // 4a. Must use type-only imports.
  if (code.includes("import type")) {
    details.push(`PASS  ${CONTRACT_REL} uses "import type".`);
  } else {
    issues.push(`FAIL  ${CONTRACT_REL} must use "import type".`);
  }

  // 4b. The three engine types must be referenced.
  for (const t of INTEGRATION_TYPES) {
    if (code.includes(t)) {
      details.push(`PASS  Integration type "${t}" referenced.`);
    } else {
      issues.push(`FAIL  Integration type "${t}" not referenced.`);
    }
  }

  // 4c. Every import statement must be a type-only import (no runtime imports).
  const importLines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("import "));
  for (const line of importLines) {
    if (line.startsWith("import type ")) {
      details.push(`PASS  Type-only import: ${line}`);
    } else {
      issues.push(`FAIL  Non-type import found (must be type-only): ${line}`);
    }
  }

  // 4d. Must NOT import a runtime builder or Supabase, no fetch, no env.
  const forbidden: Array<{ token: string; label: string }> = [
    { token: "buildPortfolioValuationSummaryContract", label: "runtime builder import" },
    { token: "@supabase", label: "@supabase import" },
    { token: "createClient", label: "Supabase createClient" },
    { token: "fetch(", label: "fetch( call" },
    { token: "process.env", label: "env secret read" },
  ];
  for (const { token, label } of forbidden) {
    if (code.includes(token)) {
      issues.push(`FAIL  Forbidden "${label}" found in ${CONTRACT_REL}.`);
    } else {
      details.push(`PASS  No "${label}" in ${CONTRACT_REL} code.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "type_integration", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Safety checks
// ---------------------------------------------------------------------------

const FORBIDDEN_RUNTIME_TOKENS: Array<{ token: string; label: string }> = [
  { token: "fetch(", label: "fetch( call" },
  { token: "axios", label: "axios import/usage" },
  { token: "createClient", label: "Supabase createClient" },
  { token: "@supabase", label: "@supabase import" },
  { token: "process.env", label: "env secret read" },
  { token: "yfinance", label: "yfinance runtime" },
  { token: "finmind", label: "FinMind runtime" },
  { token: "tradingview", label: "TradingView runtime" },
  { token: "factset", label: "FactSet runtime" },
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 5a. Contract code must contain no forbidden runtime tokens, and must keep
  //     the three read-only invariant flags.
  const contract = readFile(resolve(CONTRACT_REL));
  if (contract == null) {
    issues.push(`FAIL  Cannot read ${CONTRACT_REL}.`);
  } else {
    const lower = stripComments(contract).toLowerCase();
    for (const { token, label } of FORBIDDEN_RUNTIME_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden token "${label}" found in ${CONTRACT_REL}.`);
      } else {
        details.push(`PASS  No "${label}" in ${CONTRACT_REL} code.`);
      }
    }
    for (const flag of [
      "requestPerformed: false",
      "supabaseConnected: false",
      "productionWritePerformed: false",
    ]) {
      if (contract.includes(flag)) {
        details.push(`PASS  Contract declares "${flag}".`);
      } else {
        issues.push(`FAIL  Contract missing read-only flag "${flag}".`);
      }
    }
  }

  // 5b. No new SQL migration for war-room read model.
  const forbiddenMigrations = [
    "supabase/war_room_read_model.sql",
    "supabase/v89_war_room_read_model.sql",
    "supabase/war_room_snapshots.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V19.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5c. No new API route / UI component for war-room read model.
  // Note: app/api/war-room/route.ts was sanctioned in V20 (War Room API
  // Contract) and is validated by scripts/validate-war-room-api-contract.ts,
  // so it is no longer forbidden here.
  const forbiddenRuntimeArtifacts = [
    "app/api/war-room-read-model/route.ts",
    "app/war-room/page.tsx",
    "components/war-room-read-model.tsx",
    "components/war-room-snapshot.tsx",
  ];
  for (const rel of forbiddenRuntimeArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime artifact ${rel} must not exist in V19.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5d. No new read-model runtime builder.
  const forbiddenRuntime = [
    "use-cases/war-room/build-war-room-read-model.ts",
    "use-cases/war-room/war-room-read-model-builder.ts",
    "services/war-room/war-room-aggregator.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime builder ${rel} must not exist in V19.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5e. Protected layers must still be present.
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} still present (not modified/deleted).`);
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

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_PHRASES);
const contractCheck = checkTerms(
  "contract_checks",
  contractBody,
  CONTRACT_REL,
  CONTRACT_TERMS,
);
const integrationCheck = checkTypeIntegration();
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  integrationCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: WarRoomReadModelSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, ARCH_DOC_REL, CONTRACT_REL, RESEARCH_REL, TECHNICAL_REL, INTRADAY_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    type_integration: integrationCheck.status,
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
