/**
 * War Room Engine Fixture Adapters Validator — V22
 *
 * Fixture-only check. Imports the pure builder + fixture adapter and inspects
 * the payload shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, or write data.
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

interface FixtureAdaptersSummary {
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

const DOC_REL = "docs/war-room-engine-fixture-adapters.md";
const ADAPTER_REL = "use-cases/war-room/war-room-engine-fixture-adapters.ts";
const BUILDER_REL = "use-cases/war-room/build-war-room-read-model-contract.ts";
const API_CHECKER_REL = "scripts/validate-war-room-api-contract.ts";
const COMPONENT_REL = "components/war-room-dashboard.tsx";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Fixture adapters doc (new)", rel: DOC_REL },
    { label: "Fixture adapters (new)", rel: ADAPTER_REL },
    { label: "War Room read model builder", rel: BUILDER_REL },
    { label: "War Room API contract checker", rel: API_CHECKER_REL },
    { label: "War Room dashboard component", rel: COMPONENT_REL },
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
  "War Room Engine Fixture Adapters",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "Portfolio Valuation Fixture",
  "Research Top Picks Fixture",
  "Technical + Risk Reward Fixture",
  "Intraday Alert Fixture",
  "Avoid List Fixture",
  "Observation Points Fixture",
  "sourceSummary",
  "dataQualitySummary",
  "highConfidenceConclusionAllowed",
  "不自動下單",
  "不產生買賣指令",
  "TOP5 Research 不等於 TOP5 Entry",
  "TOP5 Technical Candidates 不等於買進清單",
  "Intraday Alert 不等於出場",
  "資料不足就顯示資料不足",
];

// ---------------------------------------------------------------------------
// Gate 3: Adapter checks
// ---------------------------------------------------------------------------

const ADAPTER_TERMS: string[] = [
  "buildWarRoomEngineFixtureBundle",
  "WarRoomEngineFixtureBundle",
  "portfolioRiskItems",
  "researchTopPickItems",
  "technicalCandidateItems",
  "intradayAlertItems",
  "avoidItems",
  "observationPoints",
  "sourceSummary",
  "dataQualitySummary",
  "notEntrySignal",
  "notTradeAdvice",
  "notExitSignal",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
  "Fixture only",
  "非即時資料",
];

// ---------------------------------------------------------------------------
// Gate 4: Builder checks
// ---------------------------------------------------------------------------

const BUILDER_TERMS: string[] = [
  "buildWarRoomEngineFixtureBundle",
  "fixtureAdapterVersion",
  "V22",
  "sourceMode",
  "fixture",
  "mock_or_contract",
  "apiContractVersion",
  "V20",
];

// ---------------------------------------------------------------------------
// Gate 5: Payload checks (import builder, call pure function)
// ---------------------------------------------------------------------------

const FIXED_TS = "2026-06-23T00:00:00.000Z";

function checkPayload(): CheckResult {
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

  const badPayload = buildWarRoomReadModelContract({
    mode: "BAD_MODE",
    generatedAt: FIXED_TS,
  });
  if (badPayload.warRoomMode === "PREMARKET") {
    details.push("PASS  invalid mode falls back to PREMARKET.");
  } else {
    issues.push(`FAIL  invalid mode returned "${badPayload.warRoomMode}".`);
  }

  const probe = buildWarRoomReadModelContract({ mode: "PREMARKET", generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(
        `FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`,
      );
    }
  };

  expectEq("apiContractVersion", probe.apiContractVersion, "V20");
  expectEq("fixtureAdapterVersion", probe.fixtureAdapterVersion, "V22");
  expectEq("responseSource", probe.responseSource, "mock_or_contract");
  expectEq("sourceMode", probe.sourceMode, "fixture");
  expectEq("requestPerformed", probe.requestPerformed, false);
  expectEq("supabaseConnected", probe.supabaseConnected, false);
  expectEq("productionWritePerformed", probe.productionWritePerformed, false);
  expectEq(
    "dataQualitySummary.highConfidenceConclusionAllowed",
    probe.dataQualitySummary.highConfidenceConclusionAllowed,
    false,
  );

  // Non-empty fixture arrays.
  const lenChecks: Array<{ label: string; len: number; min: number }> = [
    { label: "portfolioRiskItems", len: probe.portfolioRiskItems.length, min: 3 },
    { label: "researchTopPickItems", len: probe.researchTopPickItems.length, min: 3 },
    { label: "technicalCandidateItems", len: probe.technicalCandidateItems.length, min: 3 },
    { label: "intradayAlertItems", len: probe.intradayAlertItems.length, min: 2 },
    { label: "avoidItems", len: probe.avoidItems.length, min: 2 },
    { label: "observationPoints", len: probe.observationPoints.length, min: 4 },
    { label: "sourceSummary", len: probe.sourceSummary.length, min: 4 },
  ];
  for (const { label, len, min } of lenChecks) {
    if (len >= min) {
      details.push(`PASS  ${label}.length = ${len} (>= ${min}).`);
    } else {
      issues.push(`FAIL  ${label}.length = ${len}, expected >= ${min}.`);
    }
  }

  // No DANGER alert in fixture mode.
  if (probe.intradayAlertItems.some((a) => a.alertLevel === "DANGER")) {
    issues.push("FAIL  fixture intradayAlertItems must not contain a DANGER alert.");
  } else {
    details.push("PASS  No DANGER alert in fixture intradayAlertItems.");
  }

  // Safety flags on items.
  if (probe.researchTopPickItems.every((r) => r.notEntrySignal === true)) {
    details.push("PASS  every researchTopPickItems item has notEntrySignal === true.");
  } else {
    issues.push("FAIL  some researchTopPickItems item missing notEntrySignal === true.");
  }
  if (
    probe.technicalCandidateItems.every(
      (t) => t.notEntrySignal === true && t.notTradeAdvice === true,
    )
  ) {
    details.push(
      "PASS  every technicalCandidateItems item has notEntrySignal & notTradeAdvice === true.",
    );
  } else {
    issues.push("FAIL  some technicalCandidateItems item missing notEntrySignal/notTradeAdvice.");
  }
  if (probe.avoidItems.every((a) => a.notExitSignal === true && a.notTradeAdvice === true)) {
    details.push("PASS  every avoidItems item has notExitSignal & notTradeAdvice === true.");
  } else {
    issues.push("FAIL  some avoidItems item missing notExitSignal/notTradeAdvice.");
  }
  if (probe.observationPoints.every((o) => o.notTradeAdvice === true)) {
    details.push("PASS  every observationPoints item has notTradeAdvice === true.");
  } else {
    issues.push("FAIL  some observationPoints item missing notTradeAdvice === true.");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Safety checks
// ---------------------------------------------------------------------------

const FORBIDDEN_TOKENS: Array<{ token: string; label: string }> = [
  { token: "fetch(", label: "fetch( call" },
  { token: "axios", label: "axios usage" },
  { token: "createclient", label: "Supabase createClient" },
  { token: "@supabase", label: "@supabase import" },
  { token: "process.env", label: "env secret read" },
  { token: "yahoo", label: "Yahoo source" },
  { token: "yfinance", label: "yfinance source" },
  { token: "finmind", label: "FinMind source" },
  { token: "factset", label: "FactSet source" },
  { token: "tradingview", label: "TradingView source" },
  { token: "broker", label: "broker source" },
  { token: "twse", label: "TWSE source" },
  { token: "tpex", label: "TPEx source" },
  { token: "buildportfoliovaluationsummarycontract", label: "runtime builder import" },
  { token: "insert(", label: "database insert" },
  { token: "upsert(", label: "database upsert" },
  { token: "update(", label: "database update" },
  { token: "delete(", label: "database delete" },
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [ADAPTER_REL, BUILDER_REL]) {
    const source = readFile(resolve(rel));
    if (source == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      continue;
    }
    const lower = stripComments(source).toLowerCase();
    for (const { token, label } of FORBIDDEN_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden "${label}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${label}" in ${rel} code.`);
      }
    }
  }

  // No new API route / UI component / SQL migration for fixture adapters.
  const forbiddenArtifacts = [
    "app/api/war-room-fixture/route.ts",
    "components/war-room-fixture.tsx",
    "supabase/war_room_fixture.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V22.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // Protected layers must still be present.
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
const adapterBody = readFile(resolve(ADAPTER_REL));
const builderBody = readFile(resolve(BUILDER_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const adapterCheck = checkTerms("adapter_checks", adapterBody, ADAPTER_REL, ADAPTER_TERMS);
const builderCheck = checkTerms("builder_checks", builderBody, BUILDER_REL, BUILDER_TERMS);
const payloadCheck = checkPayload();
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  adapterCheck,
  builderCheck,
  payloadCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: FixtureAdaptersSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, ADAPTER_REL, BUILDER_REL, API_CHECKER_REL, COMPONENT_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    adapter_checks: adapterCheck.status,
    builder_checks: builderCheck.status,
    payload_checks: payloadCheck.status,
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
