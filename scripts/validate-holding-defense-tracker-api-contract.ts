/**
 * Holding Defense Tracker API Contract Validator — V27
 *
 * Contract / fixture-only check. Imports the pure builder and inspects the
 * payload shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, or write data.
 *
 * Safety scanning for forbidden runtime tokens is applied ONLY to code runtime
 * files (contract / builder / route), comment-stripped. Documentation may
 * legitimately mention TWSE / TPEx / Yahoo / FinMind / TradingView /
 * yfinance-like as a future data-source priority list, so docs are NOT scanned
 * for those source names.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/holding-defense/build-holding-defense-tracker-contract") as typeof import("../use-cases/holding-defense/build-holding-defense-tracker-contract");
const { buildHoldingDefenseTrackerContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface HoldingDefenseSummary {
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

function checkAbsent(
  name: string,
  body: string | null,
  fileLabel: string,
  forbidden: string[],
): CheckResult {
  if (body == null) {
    return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
  }
  const details: string[] = [];
  const issues: string[] = [];
  for (const term of forbidden) {
    if (body.includes(term)) {
      issues.push(`FAIL  Forbidden "${term}" present in ${fileLabel}.`);
    } else {
      details.push(`PASS  No "${term}" in ${fileLabel}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name, status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/holding-defense-tracker-api-contract.md";
const CONTRACT_REL = "use-cases/holding-defense/holding-defense-tracker-contract.ts";
const BUILDER_REL = "use-cases/holding-defense/build-holding-defense-tracker-contract.ts";
const ROUTE_REL = "app/api/portfolio/holding-defense/route.ts";
const PLAN_CONTRACT_REL = "use-cases/position-strategy/position-strategy-plan-contract.ts";
const POS_FIXTURE_REL = "use-cases/position-strategy/position-strategy-fixture-adapters.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Holding Defense Tracker API Contract doc (new)", rel: DOC_REL },
    { label: "Holding Defense Tracker contract (new)", rel: CONTRACT_REL },
    { label: "Holding Defense Tracker builder (new)", rel: BUILDER_REL },
    { label: "Holding Defense Tracker API route (new)", rel: ROUTE_REL },
    { label: "Position Strategy Plan contract", rel: PLAN_CONTRACT_REL },
    { label: "Position Strategy fixture adapter", rel: POS_FIXTURE_REL },
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
  "Holding Defense Tracker API Contract",
  "/api/portfolio/holding-defense",
  "NORMAL_OBSERVATION",
  "DEFENSE_ZONE_NEAR",
  "DEFENSE_ZONE_BROKEN",
  "PROFIT_PROTECTION_ACTIVE",
  "RISK_REDUCTION_ACTIVE",
  "DATA_INSUFFICIENT",
  "PRICE_NOT_VERIFIED",
  "SOURCE_CONFLICT",
  "STALE_DATA",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 時降級為 WARNING / DATA_INSUFFICIENT",
  "Holding Defense Tracker 不是自動交易系統",
  "防守區是防守觀察，不是自動出場",
  "策略失效觀察價不是自動停損價",
  "takeProfitZone 不是賣出價",
  "出場觀察區不是賣出價",
  "風險降低觀察不是賣出指令",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V27 不修改 War Room",
  "V27 不新增 UI",
  "V27 不接 runtime",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "HoldingDefenseTrackerState",
  "HoldingDefenseAlertLevel",
  "HoldingDefenseSourceMode",
  "HoldingDefenseTrackerItem",
  "HoldingDefenseTrackerSummary",
  "HoldingDefenseTrackerResponse",
  "HOLDING_DEFENSE_TRACKER_CONTRACT_VERSION",
  "HOLDING_DEFENSE_TRACKER_API_PATH",
  "HOLDING_DEFENSE_TRACKER_ALLOWED_STATES",
  "HOLDING_DEFENSE_TRACKER_SAFETY_LABELS",
  "HOLDING_DEFENSE_TRACKER_DISALLOWED_TERMS",
  "NORMAL_OBSERVATION",
  "DEFENSE_ZONE_NEAR",
  "DEFENSE_ZONE_BROKEN",
  "PROFIT_PROTECTION_ACTIVE",
  "RISK_REDUCTION_ACTIVE",
  "DATA_INSUFFICIENT",
  "PRICE_NOT_VERIFIED",
  "SOURCE_CONFLICT",
  "STALE_DATA",
  "holdingImpact",
  "takeProfitZone",
  "priceVerified",
  "priceVerificationStatus",
  "defenseZone",
  "invalidLevel",
  "profitProtectionZone",
  "riskReduceZone",
  "exitObservationZone",
  "notExitSignal",
  "notTradeAdvice",
  "highConfidenceConclusionAllowed",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Builder checks
// ---------------------------------------------------------------------------

const BUILDER_TERMS: string[] = [
  "buildHoldingDefenseTrackerContract",
  "buildPositionStrategyFixtureBundle",
  "mock_or_contract",
  "fixture",
  "V27",
  "2026-06-23T00:00:00.000Z",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
];

const BUILDER_FORBIDDEN: string[] = ["Date.now", "new Date"];

// ---------------------------------------------------------------------------
// Gate 5: Route checks
// ---------------------------------------------------------------------------

const ROUTE_TERMS: string[] = [
  "GET",
  "NextResponse.json",
  "buildHoldingDefenseTrackerContract",
];

const ROUTE_FORBIDDEN: string[] = [
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "fetch",
  "axios",
  "Date.now",
  "new Date",
];

function checkRouteForbidden(): CheckResult {
  const body = readFile(resolve(ROUTE_REL));
  if (body == null) {
    return { name: "route_forbidden", status: "FAIL", details: [`FAIL  Cannot read ${ROUTE_REL}.`] };
  }
  const lower = stripComments(body).toLowerCase();
  const details: string[] = [];
  const issues: string[] = [];
  // case-insensitive scan for forbidden HTTP verbs / runtime tokens
  for (const token of ROUTE_FORBIDDEN) {
    if (lower.includes(token.toLowerCase())) {
      issues.push(`FAIL  Forbidden "${token}" present in ${ROUTE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${ROUTE_REL}.`);
    }
  }
  // supabase / env
  for (const token of ["@supabase", "createclient", "process.env"]) {
    if (lower.includes(token)) {
      issues.push(`FAIL  Forbidden "${token}" present in ${ROUTE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${ROUTE_REL}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "route_forbidden", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Payload checks (import builder, call pure function)
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const payload = buildHoldingDefenseTrackerContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", payload.contractVersion, "V27");
  expectEq("apiContractVersion", payload.apiContractVersion, "V27");
  expectEq("responseSource", payload.responseSource, "mock_or_contract");
  expectEq("sourceMode", payload.sourceMode, "fixture");
  expectEq("trackerFixtureVersion", payload.trackerFixtureVersion, "V27");
  expectEq("generatedAt", payload.generatedAt, FIXED_TS);
  expectEq("requestPerformed", payload.requestPerformed, false);
  expectEq("supabaseConnected", payload.supabaseConnected, false);
  expectEq("productionWritePerformed", payload.productionWritePerformed, false);

  if (payload.items.length >= 5) {
    details.push(`PASS  items.length = ${payload.items.length} (>= 5).`);
  } else {
    issues.push(`FAIL  items.length = ${payload.items.length}, expected >= 5.`);
  }

  expectEq("summary.totalHoldings", payload.summary.totalHoldings, payload.items.length);
  expectEq(
    "summary.highConfidenceConclusionAllowed",
    payload.summary.highConfidenceConclusionAllowed,
    false,
  );

  // Per-item invariants.
  const everyFalse = (key: keyof (typeof payload.items)[number], v: unknown): boolean =>
    payload.items.every((i) => i[key] === v);

  if (everyFalse("requestPerformed", false)) {
    details.push("PASS  every item requestPerformed === false.");
  } else {
    issues.push("FAIL  some item requestPerformed !== false.");
  }
  if (everyFalse("supabaseConnected", false)) {
    details.push("PASS  every item supabaseConnected === false.");
  } else {
    issues.push("FAIL  some item supabaseConnected !== false.");
  }
  if (everyFalse("productionWritePerformed", false)) {
    details.push("PASS  every item productionWritePerformed === false.");
  } else {
    issues.push("FAIL  some item productionWritePerformed !== false.");
  }
  if (everyFalse("notExitSignal", true)) {
    details.push("PASS  every item notExitSignal === true.");
  } else {
    issues.push("FAIL  some item notExitSignal !== true.");
  }
  if (everyFalse("notTradeAdvice", true)) {
    details.push("PASS  every item notTradeAdvice === true.");
  } else {
    issues.push("FAIL  some item notTradeAdvice !== true.");
  }
  if (everyFalse("highConfidenceConclusionAllowed", false)) {
    details.push("PASS  every item highConfidenceConclusionAllowed === false.");
  } else {
    issues.push("FAIL  some item highConfidenceConclusionAllowed !== false.");
  }

  // No DANGER alert in fixture payload.
  if (payload.items.some((i) => i.alertLevel === "DANGER")) {
    issues.push("FAIL  fixture items must not contain a DANGER alertLevel.");
  } else {
    details.push("PASS  No DANGER alertLevel in fixture items.");
  }

  // Required state coverage.
  const hasState = (s: string): boolean => payload.items.some((i) => i.trackerState === s);
  const stateRequirements: Array<{ label: string; ok: boolean }> = [
    { label: "NORMAL_OBSERVATION", ok: hasState("NORMAL_OBSERVATION") },
    {
      label: "DEFENSE_ZONE_NEAR or DEFENSE_ZONE_BROKEN",
      ok: hasState("DEFENSE_ZONE_NEAR") || hasState("DEFENSE_ZONE_BROKEN"),
    },
    { label: "PROFIT_PROTECTION_ACTIVE", ok: hasState("PROFIT_PROTECTION_ACTIVE") },
    { label: "RISK_REDUCTION_ACTIVE", ok: hasState("RISK_REDUCTION_ACTIVE") },
    {
      label: "DATA_INSUFFICIENT or PRICE_NOT_VERIFIED",
      ok: hasState("DATA_INSUFFICIENT") || hasState("PRICE_NOT_VERIFIED"),
    },
  ];
  for (const { label, ok } of stateRequirements) {
    if (ok) {
      details.push(`PASS  payload contains a ${label} item.`);
    } else {
      issues.push(`FAIL  payload missing a ${label} item.`);
    }
  }

  // priceVerified === false items must null out precise zones + high-confidence.
  const unverified = payload.items.filter((i) => i.priceVerified === false);
  const unverifiedOk = unverified.every(
    (i) =>
      i.defenseZone === null &&
      i.invalidLevel === null &&
      i.takeProfitZone === null &&
      i.riskReduceZone === null &&
      i.exitObservationZone === null &&
      (i.currentPrice === null || i.dataQualityStatus !== "PASS") &&
      i.highConfidenceConclusionAllowed === false,
  );
  if (unverifiedOk) {
    details.push("PASS  every priceVerified === false item nulls precise zones + high confidence.");
  } else {
    issues.push("FAIL  some priceVerified === false item retains precise zones / high confidence.");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: Negation-context checks (doc prose)
// ---------------------------------------------------------------------------

const NEGATION_CHARS = ["不", "未", "非", "無", "別"];

function hasNonNegatedOccurrence(body: string, term: string, window = 4): boolean {
  let from = 0;
  for (;;) {
    const idx = body.indexOf(term, from);
    if (idx === -1) return false;
    const start = Math.max(0, idx - window);
    const prefix = body.slice(start, idx);
    const negated = NEGATION_CHARS.some((c) => prefix.includes(c));
    if (!negated) return true;
    from = idx + term.length;
  }
}

function checkNegationContext(docBody: string | null): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  if (docBody == null) {
    return {
      name: "negation_context",
      status: "FAIL",
      details: ["FAIL  Cannot read spec doc for negation-context check."],
    };
  }

  // These dangerous phrases must only appear inside a negation/safety context.
  const negationRequired = ["自動出場", "自動停損", "賣出價"];
  for (const term of negationRequired) {
    if (hasNonNegatedOccurrence(docBody, term)) {
      issues.push(`FAIL  "${term}" appears in a non-negated context in ${DOC_REL}.`);
    } else {
      details.push(`PASS  "${term}" only appears in negated/safety context.`);
    }
  }

  // Imperative command / guarantee terms (negation tolerated, e.g. 「不自動下單」).
  const disallowed = ["強力買進", "必買", "必賣", "立即進場", "立即出場", "自動下單", "保證獲利"];
  for (const term of disallowed) {
    if (hasNonNegatedOccurrence(docBody, term)) {
      issues.push(`FAIL  Disallowed command "${term}" appears non-negated in ${DOC_REL}.`);
    } else {
      details.push(`PASS  No non-negated "${term}" in spec doc.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "negation_context", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 8: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:holding-defense-tracker-api-contract": "node --require ./scripts/register-typescript.cjs ./scripts/validate-holding-defense-tracker-api-contract.ts"',
];

const README_TERMS: string[] = [
  "V27",
  "Holding Defense Tracker API Contract",
  "docs/holding-defense-tracker-api-contract.md",
  "use-cases/holding-defense/holding-defense-tracker-contract.ts",
  "use-cases/holding-defense/build-holding-defense-tracker-contract.ts",
  "app/api/portfolio/holding-defense/route.ts",
  "npm run test:holding-defense-tracker-api-contract",
  "/api/portfolio/holding-defense",
  "NORMAL_OBSERVATION",
  "DEFENSE_ZONE_NEAR",
  "PROFIT_PROTECTION_ACTIVE",
  "RISK_REDUCTION_ACTIVE",
  "DATA_INSUFFICIENT",
  "priceVerified",
  "takeProfitZone",
  "holdingImpact",
  "本階段未接資料源",
  "未建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 9: Safety checks
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

  // 9a. Code runtime files: no external request / supabase / env / DB writes /
  //     source tokens. Date.now / new Date are additionally forbidden in the
  //     contract / builder / route (no clock reads).
  for (const rel of [CONTRACT_REL, BUILDER_REL, ROUTE_REL]) {
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
      "buildportfoliovaluationsummarycontract",
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

  // 9b. No new SQL migration for holding-defense.
  // Note: components/holding-defense-tracker.tsx was sanctioned in V29 (Holding
  // Defense Tracker UI Integration) and is validated by
  // scripts/validate-holding-defense-tracker-ui-integration.ts, so it is no
  // longer forbidden here. It reads only the internal /api/portfolio/holding-defense
  // endpoint (no Supabase / no external fetch / no runtime).
  const forbiddenArtifacts = [
    "supabase/holding_defense.sql",
    "supabase/holding_defense_tracker.sql",
    "components/holding-defense.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V27.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 9c. No holding-defense runtime / scheduler / quote-polling.
  const forbiddenRuntime = [
    "services/holding-defense/quote-poller.ts",
    "services/holding-defense/scheduler.ts",
    "use-cases/holding-defense/holding-defense-runtime.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V27 (contract-only).`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 9d. Protected layers must still be present (War Room not modified/deleted).
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "components/war-room-dashboard.tsx",
    "use-cases/war-room/build-war-room-read-model-contract.ts",
    "use-cases/position-strategy/position-strategy-fixture-adapters.ts",
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
const builderBody = readFile(resolve(BUILDER_REL));
const routeBody = readFile(resolve(ROUTE_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const contractCheck = checkTerms("contract_checks", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const builderTermCheck = checkTerms("builder_checks", builderBody, BUILDER_REL, BUILDER_TERMS);
// Scan comment-stripped code so doc-comments mentioning "no Date.now / no new
// Date" do not trip the no-clock guard.
const builderForbiddenCheck = checkAbsent(
  "builder_no_clock",
  builderBody == null ? null : stripComments(builderBody),
  BUILDER_REL,
  BUILDER_FORBIDDEN,
);
const routeTermCheck = checkTerms("route_checks", routeBody, ROUTE_REL, ROUTE_TERMS);
const routeForbiddenCheck = checkRouteForbidden();
const payloadCheck = checkPayload();
const negationCheck = checkNegationContext(docBody);
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  builderTermCheck,
  builderForbiddenCheck,
  routeTermCheck,
  routeForbiddenCheck,
  payloadCheck,
  negationCheck,
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

const summary: HoldingDefenseSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, ROUTE_REL, PLAN_CONTRACT_REL, POS_FIXTURE_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    builder_checks: builderTermCheck.status,
    builder_no_clock: builderForbiddenCheck.status,
    route_checks: routeTermCheck.status,
    route_forbidden: routeForbiddenCheck.status,
    payload_checks: payloadCheck.status,
    negation_context: negationCheck.status,
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
