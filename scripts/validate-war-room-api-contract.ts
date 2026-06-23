/**
 * War Room API Contract Validator — V20
 *
 * Fixture-only check. Imports the pure builder and inspects the payload shape;
 * it does NOT start a Next.js server, make any HTTP request, connect to
 * Supabase, read env keys, or write data.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-war-room-read-model-contract") as typeof import("../use-cases/war-room/build-war-room-read-model-contract");
const { buildWarRoomReadModelContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface WarRoomApiContractSummary {
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/war-room-api-contract.md";
const BUILDER_REL = "use-cases/war-room/build-war-room-read-model-contract.ts";
const CONTRACT_REL = "use-cases/war-room/war-room-intelligence-contract.ts";
const ROUTE_REL = "app/api/war-room/route.ts";
const READ_MODEL_DOC_REL = "docs/war-room-read-model-contract.md";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "War Room API Contract doc (new)", rel: DOC_REL },
    { label: "War Room read model builder (new)", rel: BUILDER_REL },
    { label: "War Room Intelligence contract", rel: CONTRACT_REL },
    { label: "War Room API route (new)", rel: ROUTE_REL },
    { label: "War Room Read Model Contract doc", rel: READ_MODEL_DOC_REL },
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
  "War Room API Contract",
  "GET /api/war-room",
  "mock_or_contract",
  "apiContractVersion = V20",
  "sourceMode = spec_only",
  "PREMARKET",
  "INTRADAY",
  "POSTMARKET",
  "REALTIME_ALERT",
  "dataQualitySummary",
  "sourceSummary",
  "highConfidenceConclusionAllowed",
  "不自動下單",
  "不產生買賣指令",
  "War Room API 不得成為資料權威",
  "Research Rating 不等於 actionSignal",
  "TOP5 Research 不等於 TOP5 Entry",
  "TOP5 Technical Candidates 不等於買進清單",
  "Valuation Tier 不等於 actionSignal",
  "Intraday Alert 不等於出場",
  "資料不足就顯示資料不足",
];

// ---------------------------------------------------------------------------
// Gate 3: Builder checks
// ---------------------------------------------------------------------------

const BUILDER_TERMS: string[] = [
  "buildWarRoomReadModelContract",
  "BuildWarRoomReadModelContractInput",
  "BuildWarRoomReadModelContractOutput",
  "apiContractVersion",
  "V20",
  "mock_or_contract",
  "spec_only",
  "highConfidenceConclusionAllowed",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
  "Portfolio Valuation Engine",
  "Institutional Research Center",
  "Technical + Risk Reward Strategy Engine",
  "Intraday Risk Crisis Alert Engine",
];

// ---------------------------------------------------------------------------
// Gate 4: Route checks
// ---------------------------------------------------------------------------

const ROUTE_TERMS: string[] = [
  "GET",
  "NextResponse.json",
  "buildWarRoomReadModelContract",
  "searchParams.get('mode')",
  "dynamic = 'force-dynamic'",
];

// ---------------------------------------------------------------------------
// Gate 5: Runtime safety checks (route + builder, comments stripped)
// ---------------------------------------------------------------------------

const FORBIDDEN_RUNTIME_TOKENS: Array<{ token: string; label: string }> = [
  { token: "fetch(", label: "fetch( call" },
  { token: "axios", label: "axios import/usage" },
  { token: "createClient", label: "Supabase createClient" },
  { token: "@supabase", label: "@supabase import" },
  { token: "process.env", label: "env secret read" },
  { token: "yfinance", label: "yfinance runtime" },
  { token: "yahoo", label: "Yahoo runtime" },
  { token: "finmind", label: "FinMind runtime" },
  { token: "tradingview", label: "TradingView runtime" },
  { token: "factset", label: "FactSet runtime" },
  { token: "buildportfoliovaluationsummarycontract", label: "runtime builder import" },
  { token: "insert(", label: "database insert" },
  { token: "upsert(", label: "database upsert" },
  { token: "update(", label: "database update" },
  { token: "delete(", label: "database delete" },
];

function checkRuntimeSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [ROUTE_REL, BUILDER_REL]) {
    const source = readFile(resolve(rel));
    if (source == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      continue;
    }
    const lower = stripComments(source).toLowerCase();
    for (const { token, label } of FORBIDDEN_RUNTIME_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden "${label}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${label}" in ${rel} code.`);
      }
    }
  }

  // No new SQL migration / UI component for war-room API.
  const forbiddenArtifacts = [
    "supabase/war_room_api.sql",
    "components/war-room-api.tsx",
    "components/war-room.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V20.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // Only the war-room API route may be added; no extra API routes for this feature.
  const forbiddenExtraRoutes = [
    "app/api/war-room-read-model/route.ts",
    "app/api/war-room/snapshot/route.ts",
  ];
  for (const rel of forbiddenExtraRoutes) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Extra API route ${rel} must not exist in V20.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "runtime_safety", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Payload shape checks (import builder, call pure function)
// ---------------------------------------------------------------------------

const FIXED_TS = "2026-06-23T00:00:00.000Z";

function checkPayloadShape(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const validModes = ["PREMARKET", "INTRADAY", "POSTMARKET", "REALTIME_ALERT"];
  for (const mode of validModes) {
    const payload = buildWarRoomReadModelContract({ mode, generatedAt: FIXED_TS });
    if (payload.warRoomMode === mode) {
      details.push(`PASS  mode "${mode}" returns warRoomMode "${mode}".`);
    } else {
      issues.push(`FAIL  mode "${mode}" returned "${payload.warRoomMode}".`);
    }
  }

  // Invalid mode → PREMARKET fallback.
  const badPayload = buildWarRoomReadModelContract({
    mode: "BAD_MODE",
    generatedAt: FIXED_TS,
  });
  if (badPayload.warRoomMode === "PREMARKET") {
    details.push(`PASS  invalid mode falls back to PREMARKET.`);
  } else {
    issues.push(`FAIL  invalid mode returned "${badPayload.warRoomMode}".`);
  }

  // Metadata constants.
  const probe = buildWarRoomReadModelContract({ mode: "PREMARKET", generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("apiContractVersion", probe.apiContractVersion, "V20");
  expectEq("responseSource", probe.responseSource, "mock_or_contract");
  expectEq("sourceMode", probe.sourceMode, "spec_only");
  expectEq("requestPerformed", probe.requestPerformed, false);
  expectEq("supabaseConnected", probe.supabaseConnected, false);
  expectEq("productionWritePerformed", probe.productionWritePerformed, false);
  expectEq(
    "dataQualitySummary.highConfidenceConclusionAllowed",
    probe.dataQualitySummary.highConfidenceConclusionAllowed,
    false,
  );

  // Seven sections present.
  const sectionKeys = [
    "marketStatusLight",
    "realtimeAlerts",
    "portfolioRiskRadar",
    "researchTopPicks",
    "technicalRiskRewardCandidates",
    "avoidList",
    "nextObservationPoints",
  ] as const;
  const probeRecord = probe as unknown as Record<string, unknown>;
  for (const key of sectionKeys) {
    const section = probeRecord[key];
    if (section != null && typeof section === "object") {
      details.push(`PASS  section "${key}" present.`);
    } else {
      issues.push(`FAIL  section "${key}" missing.`);
    }
  }

  // sourceSummary.length >= 4.
  if (Array.isArray(probe.sourceSummary) && probe.sourceSummary.length >= 4) {
    details.push(`PASS  sourceSummary.length = ${probe.sourceSummary.length} (>= 4).`);
  } else {
    issues.push(`FAIL  sourceSummary must have >= 4 entries.`);
  }

  // Converged arrays present.
  const arrayKeys = [
    "portfolioRiskItems",
    "researchTopPickItems",
    "technicalCandidateItems",
    "intradayAlertItems",
    "avoidItems",
    "observationPoints",
  ] as const;
  for (const key of arrayKeys) {
    if (Array.isArray(probeRecord[key])) {
      details.push(`PASS  array "${key}" present.`);
    } else {
      issues.push(`FAIL  array "${key}" missing or not an array.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_shape", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const builderBody = readFile(resolve(BUILDER_REL));
const routeBody = readFile(resolve(ROUTE_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const builderCheck = checkTerms("builder_checks", builderBody, BUILDER_REL, BUILDER_TERMS);
const routeCheck = checkTerms("route_checks", routeBody, ROUTE_REL, ROUTE_TERMS);
const runtimeSafetyCheck = checkRuntimeSafety();
const payloadCheck = checkPayloadShape();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  builderCheck,
  routeCheck,
  runtimeSafetyCheck,
  payloadCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: WarRoomApiContractSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, BUILDER_REL, CONTRACT_REL, ROUTE_REL, READ_MODEL_DOC_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    builder_checks: builderCheck.status,
    route_checks: routeCheck.status,
    runtime_safety: runtimeSafetyCheck.status,
    payload_shape: payloadCheck.status,
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
