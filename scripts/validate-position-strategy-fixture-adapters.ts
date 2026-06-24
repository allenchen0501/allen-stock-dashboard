/**
 * Position Strategy Fixture Adapters Validator — V26
 *
 * Fixture-only check. Imports the pure Position Strategy fixture builder and the
 * War Room read model builder, inspects payload shapes, and reads files. It does
 * NOT start a Next.js server, make any HTTP request, connect to Supabase, read
 * env keys, write data, or create a runtime.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const positionFixtureModule = require("../use-cases/position-strategy/position-strategy-fixture-adapters") as typeof import("../use-cases/position-strategy/position-strategy-fixture-adapters");
const warRoomBuilderModule = require("../use-cases/war-room/build-war-room-read-model-contract") as typeof import("../use-cases/war-room/build-war-room-read-model-contract");

const { buildPositionStrategyFixtureBundle } = positionFixtureModule;
const { buildWarRoomReadModelContract } = warRoomBuilderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface PositionFixtureSummary {
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

const DOC_REL = "docs/position-strategy-fixture-adapters.md";
const ADAPTER_REL = "use-cases/position-strategy/position-strategy-fixture-adapters.ts";
const PLAN_CONTRACT_REL = "use-cases/position-strategy/position-strategy-plan-contract.ts";
const POOL_CONTRACT_REL = "use-cases/opportunity-pool/dynamic-opportunity-pool-contract.ts";
const WARROOM_CONTRACT_REL = "use-cases/war-room/war-room-intelligence-contract.ts";
const WARROOM_ADAPTER_REL = "use-cases/war-room/war-room-engine-fixture-adapters.ts";
const WARROOM_BUILDER_REL = "use-cases/war-room/build-war-room-read-model-contract.ts";
const COMPONENT_REL = "components/war-room-dashboard.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Position Strategy Fixture Adapters doc (new)", rel: DOC_REL },
    { label: "Position Strategy fixture adapter (new)", rel: ADAPTER_REL },
    { label: "Position Strategy Plan contract", rel: PLAN_CONTRACT_REL },
    { label: "Dynamic Opportunity Pool contract", rel: POOL_CONTRACT_REL },
    { label: "War Room Intelligence contract", rel: WARROOM_CONTRACT_REL },
    { label: "War Room engine fixture adapter", rel: WARROOM_ADAPTER_REL },
    { label: "War Room read model builder", rel: WARROOM_BUILDER_REL },
    { label: "War Room dashboard component", rel: COMPONENT_REL },
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
  "Position Strategy Fixture Adapters",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "ENTRY_OBSERVATION",
  "HOLDING_DEFENSE",
  "PROFIT_PROTECTION",
  "RISK_REDUCTION",
  "NO_TOUCH",
  "DATA_INSUFFICIENT",
  "holdingImpact",
  "takeProfitZone",
  "priceVerified",
  "PRICE_NOT_VERIFIED",
  "SOURCE_CONFLICT",
  "FALLBACK_ONLY",
  "NOT_COVERED",
  "MAIN_UPTREND_POOL",
  "BREAKOUT_PREP_POOL",
  "HOLDING_PRIORITY_POOL",
  "NO_TOUCH_POOL",
  "進場觀察區不是買進價",
  "策略失效觀察價不是自動停損價",
  "takeProfitZone 不是賣出價",
  "No Touch 是風控提醒，不是賣出指令",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "資料不足就顯示資料不足",
];

// ---------------------------------------------------------------------------
// Gate 3: Adapter checks
// ---------------------------------------------------------------------------

const ADAPTER_TERMS: string[] = [
  "buildPositionStrategyFixtureBundle",
  "BuildPositionStrategyFixtureBundleInput",
  "PositionStrategyPlanBundle",
  "ENTRY_OBSERVATION",
  "HOLDING_DEFENSE",
  "PROFIT_PROTECTION",
  "RISK_REDUCTION",
  "NO_TOUCH",
  "DATA_INSUFFICIENT",
  "holdingImpact",
  "takeProfitZone",
  "priceVerified",
  "priceVerificationStatus",
  "notEntrySignal",
  "notExitSignal",
  "notTradeAdvice",
  "highConfidenceConclusionAllowed",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
  "Fixture sample only",
  "非即時資料",
  "不是投資建議",
];

// ---------------------------------------------------------------------------
// Gate 4: War Room contract / builder checks
// ---------------------------------------------------------------------------

// The seven plan arrays must be wired through all three War Room code files.
const WARROOM_PLAN_ARRAY_TERMS: string[] = [
  "positionStrategyPlans",
  "entryObservationPlans",
  "holdingDefensePlans",
  "profitProtectionPlans",
  "riskReductionPlans",
  "positionNoTouchPlans",
  "positionDataInsufficientPlans",
];

// The fixture version literal lives in the contract type + the builder output;
// the engine fixture adapter only merges the plan arrays, so it is not required
// to carry the version string.
const WARROOM_VERSION_TERMS: string[] = ["positionStrategyFixtureVersion", "V26"];

function checkWarRoomIntegration(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const scan = (rel: string, terms: string[]): void => {
    const body = readFile(resolve(rel));
    if (body == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      return;
    }
    for (const term of terms) {
      if (body.includes(term)) {
        details.push(`PASS  "${term}" present in ${rel}.`);
      } else {
        issues.push(`FAIL  "${term}" not found in ${rel}.`);
      }
    }
  };

  // Plan arrays must appear in all three files.
  scan(WARROOM_CONTRACT_REL, WARROOM_PLAN_ARRAY_TERMS);
  scan(WARROOM_ADAPTER_REL, WARROOM_PLAN_ARRAY_TERMS);
  scan(WARROOM_BUILDER_REL, WARROOM_PLAN_ARRAY_TERMS);

  // Version literal must appear in the contract type and the builder output.
  scan(WARROOM_CONTRACT_REL, WARROOM_VERSION_TERMS);
  scan(WARROOM_BUILDER_REL, WARROOM_VERSION_TERMS);

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "warroom_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

const UI_TERMS: string[] = [
  "Position Strategy Plans",
  "entryObservationPlans",
  "holdingDefensePlans",
  "profitProtectionPlans",
  "riskReductionPlans",
  "positionNoTouchPlans",
  "positionDataInsufficientPlans",
  "holdingImpact",
  "takeProfitZone",
  "進場觀察區，不是買進價",
  "策略失效觀察價，不是自動停損價",
  "takeProfitZone 不是賣出價",
  "No Touch 是風控提醒，不是賣出指令",
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
];

// ---------------------------------------------------------------------------
// Gate 6: Payload checks (call pure functions)
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // --- Position Strategy fixture bundle ---
  const bundle = buildPositionStrategyFixtureBundle({ generatedAt: FIXED_TS, mode: "PREMARKET" });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("bundle.contractVersion", bundle.contractVersion, "V24");
  expectEq("bundle.sourceMode", bundle.sourceMode, "fixture");

  const lenChecks: Array<{ label: string; len: number; min: number }> = [
    { label: "bundle.plans", len: bundle.plans.length, min: 6 },
    { label: "bundle.entryObservationPlans", len: bundle.entryObservationPlans.length, min: 1 },
    { label: "bundle.holdingDefensePlans", len: bundle.holdingDefensePlans.length, min: 1 },
    { label: "bundle.profitProtectionPlans", len: bundle.profitProtectionPlans.length, min: 1 },
    { label: "bundle.riskReductionPlans", len: bundle.riskReductionPlans.length, min: 1 },
    { label: "bundle.noTouchPlans", len: bundle.noTouchPlans.length, min: 1 },
    { label: "bundle.dataInsufficientPlans", len: bundle.dataInsufficientPlans.length, min: 1 },
  ];
  for (const { label, len, min } of lenChecks) {
    if (len >= min) {
      details.push(`PASS  ${label}.length = ${len} (>= ${min}).`);
    } else {
      issues.push(`FAIL  ${label}.length = ${len}, expected >= ${min}.`);
    }
  }

  // Per-plan read-only invariants + safety flags.
  if (bundle.plans.every((p) => p.requestPerformed === false)) {
    details.push("PASS  every plan requestPerformed === false.");
  } else {
    issues.push("FAIL  some plan requestPerformed !== false.");
  }
  if (bundle.plans.every((p) => p.supabaseConnected === false)) {
    details.push("PASS  every plan supabaseConnected === false.");
  } else {
    issues.push("FAIL  some plan supabaseConnected !== false.");
  }
  if (bundle.plans.every((p) => p.productionWritePerformed === false)) {
    details.push("PASS  every plan productionWritePerformed === false.");
  } else {
    issues.push("FAIL  some plan productionWritePerformed !== false.");
  }
  if (bundle.plans.every((p) => p.notTradeAdvice === true)) {
    details.push("PASS  every plan notTradeAdvice === true.");
  } else {
    issues.push("FAIL  some plan notTradeAdvice !== true.");
  }
  if (bundle.plans.every((p) => p.highConfidenceConclusionAllowed === false)) {
    details.push("PASS  every plan highConfidenceConclusionAllowed === false.");
  } else {
    issues.push("FAIL  some plan highConfidenceConclusionAllowed !== false.");
  }

  // Plan-type-specific assertions.
  if (bundle.entryObservationPlans.every((p) => p.notEntrySignal === true)) {
    details.push("PASS  every ENTRY_OBSERVATION has notEntrySignal === true.");
  } else {
    issues.push("FAIL  some ENTRY_OBSERVATION missing notEntrySignal === true.");
  }
  if (
    bundle.holdingDefensePlans.every((p) => p.notExitSignal === true && p.holdingImpact != null)
  ) {
    details.push("PASS  every HOLDING_DEFENSE has notExitSignal === true and holdingImpact.");
  } else {
    issues.push("FAIL  some HOLDING_DEFENSE missing notExitSignal/holdingImpact.");
  }
  if (bundle.profitProtectionPlans.every((p) => p.takeProfitZone !== null)) {
    details.push("PASS  every PROFIT_PROTECTION has takeProfitZone !== null.");
  } else {
    issues.push("FAIL  some PROFIT_PROTECTION missing takeProfitZone.");
  }
  if (bundle.noTouchPlans.every((p) => p.noTouchReason != null && p.notExitSignal === true)) {
    details.push("PASS  every NO_TOUCH has noTouchReason and notExitSignal === true.");
  } else {
    issues.push("FAIL  some NO_TOUCH missing noTouchReason/notExitSignal.");
  }
  const diAllNull = bundle.dataInsufficientPlans.every(
    (p) =>
      p.priceVerified === false &&
      p.entryObservationZone === null &&
      p.noChaseZone === null &&
      p.defenseZone === null &&
      p.invalidLevel === null &&
      p.profitProtectionZone === null &&
      p.takeProfitZone === null &&
      p.riskReduceZone === null &&
      p.exitObservationZone === null &&
      p.targetObservationZone === null,
  );
  if (diAllNull) {
    details.push("PASS  every DATA_INSUFFICIENT has priceVerified false and all price zones null.");
  } else {
    issues.push("FAIL  some DATA_INSUFFICIENT has priceVerified true or non-null price zones.");
  }

  // --- War Room read model integration ---
  const warRoom = buildWarRoomReadModelContract({ mode: "PREMARKET", generatedAt: FIXED_TS });

  expectEq("warRoom.positionStrategyFixtureVersion", warRoom.positionStrategyFixtureVersion, "V26");
  expectEq("warRoom.responseSource", warRoom.responseSource, "mock_or_contract");
  expectEq("warRoom.sourceMode", warRoom.sourceMode, "fixture");
  expectEq("warRoom.requestPerformed", warRoom.requestPerformed, false);
  expectEq("warRoom.supabaseConnected", warRoom.supabaseConnected, false);
  expectEq("warRoom.productionWritePerformed", warRoom.productionWritePerformed, false);

  const warRoomLen: Array<{ label: string; len: number; min: number }> = [
    { label: "warRoom.positionStrategyPlans", len: warRoom.positionStrategyPlans.length, min: 6 },
    { label: "warRoom.entryObservationPlans", len: warRoom.entryObservationPlans.length, min: 1 },
    { label: "warRoom.holdingDefensePlans", len: warRoom.holdingDefensePlans.length, min: 1 },
    { label: "warRoom.profitProtectionPlans", len: warRoom.profitProtectionPlans.length, min: 1 },
    { label: "warRoom.riskReductionPlans", len: warRoom.riskReductionPlans.length, min: 1 },
    { label: "warRoom.positionNoTouchPlans", len: warRoom.positionNoTouchPlans.length, min: 1 },
    {
      label: "warRoom.positionDataInsufficientPlans",
      len: warRoom.positionDataInsufficientPlans.length,
      min: 1,
    },
  ];
  for (const { label, len, min } of warRoomLen) {
    if (len >= min) {
      details.push(`PASS  ${label}.length = ${len} (>= ${min}).`);
    } else {
      issues.push(`FAIL  ${label}.length = ${len}, expected >= ${min}.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

const RUNTIME_SOURCE_TOKENS = [
  "yahoo",
  "finmind",
  "factset",
  "tradingview",
  "broker",
  "yfinance",
  "twse",
  "tpex",
];

const DB_WRITE_TOKENS = ["insert(", "upsert(", "update(", "delete("];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 7a. Adapter: strict scan — no fetch / axios / supabase / env / Date.now /
  //     new Date / DB writes / external source tokens.
  const adapter = readFile(resolve(ADAPTER_REL));
  if (adapter == null) {
    issues.push(`FAIL  Cannot read ${ADAPTER_REL}.`);
  } else {
    const lower = stripComments(adapter).toLowerCase();
    const adapterForbidden = [
      "fetch(",
      "axios",
      "@supabase",
      "createclient",
      "process.env",
      "date.now",
      "new date(",
      "buildportfoliovaluationsummarycontract",
      ...DB_WRITE_TOKENS,
      ...RUNTIME_SOURCE_TOKENS,
    ];
    for (const token of adapterForbidden) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${ADAPTER_REL}.`);
      } else {
        details.push(`PASS  No "${token}" in ${ADAPTER_REL} code.`);
      }
    }
  }

  // 7b. War Room code files: no external request / supabase / env / DB writes /
  //     source tokens. (new Date is allowed in the builder as a generatedAt
  //     fallback, so it is NOT scanned here.)
  for (const rel of [WARROOM_ADAPTER_REL, WARROOM_BUILDER_REL]) {
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
      ...DB_WRITE_TOKENS,
      ...RUNTIME_SOURCE_TOKENS,
    ];
    for (const token of forbidden) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${token}" in ${rel} code.`);
      }
    }
  }

  // 7c. Component: only the internal /api/war-room fetch is allowed; no external
  //     URLs / supabase / env / source tokens.
  const component = readFile(resolve(COMPONENT_REL));
  if (component == null) {
    issues.push(`FAIL  Cannot read ${COMPONENT_REL}.`);
  } else {
    const lower = stripComments(component).toLowerCase();
    const componentForbidden = [
      "https://",
      "http://",
      "axios",
      "@supabase",
      "createclient",
      "process.env",
      "buildwarroomreadmodelcontract",
      ...RUNTIME_SOURCE_TOKENS,
    ];
    for (const token of componentForbidden) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${COMPONENT_REL}.`);
      } else {
        details.push(`PASS  No "${token}" in ${COMPONENT_REL} code.`);
      }
    }
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

  // 7d. No new API route / UI component file / SQL migration / tracker API.
  const forbiddenArtifacts = [
    "app/api/position-strategy/route.ts",
    "app/api/holding-defense-tracker/route.ts",
    "app/api/position-strategy-fixture/route.ts",
    "components/position-strategy-plan.tsx",
    "components/position-strategy-fixture.tsx",
    "supabase/position_strategy_fixture.sql",
    "use-cases/position-strategy/holding-defense-tracker.ts",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V26.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7e. Protected layers must still be present.
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "use-cases/position-strategy/position-strategy-plan-contract.ts",
    "use-cases/opportunity-pool/dynamic-opportunity-pool-contract.ts",
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
const componentBody = readFile(resolve(COMPONENT_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const adapterCheck = checkTerms("adapter_checks", adapterBody, ADAPTER_REL, ADAPTER_TERMS);
const warroomCheck = checkWarRoomIntegration();
const uiCheck = checkTerms("ui_checks", componentBody, COMPONENT_REL, UI_TERMS);
const payloadCheck = checkPayload();
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  adapterCheck,
  warroomCheck,
  uiCheck,
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

const summary: PositionFixtureSummary = {
  status: overallStatus,
  checked_files: [
    DOC_REL,
    ADAPTER_REL,
    PLAN_CONTRACT_REL,
    POOL_CONTRACT_REL,
    WARROOM_CONTRACT_REL,
    WARROOM_ADAPTER_REL,
    WARROOM_BUILDER_REL,
    COMPONENT_REL,
  ],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    adapter_checks: adapterCheck.status,
    warroom_checks: warroomCheck.status,
    ui_checks: uiCheck.status,
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
