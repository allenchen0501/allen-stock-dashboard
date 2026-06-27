/**
 * Structured Candidate Trade Plan Validator — V63
 *
 * Static + pure-function check. Imports the structured trade plan builder + the V62
 * scoring engine and proves every structured plan is internally consistent and stays
 * in fixture/mock safe mode. It does NOT start a Next.js server, make any HTTP
 * request, connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * builder code files (NOT the doc, which legitimately discusses "not
 * PRODUCTION_READY"). The safety FLAG `autoOrderRequested` legitimately contains
 * "autoorder", so autoorder / placeorder are not scanned in those files.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-structured-candidate-trade-plan-contract") as typeof import("../use-cases/war-room/build-structured-candidate-trade-plan-contract");
const engineModule = require("../use-cases/war-room/allen-score-scoring-engine") as typeof import("../use-cases/war-room/allen-score-scoring-engine");
const modelModule = require("../use-cases/war-room/build-allen-score-scoring-model-contract") as typeof import("../use-cases/war-room/build-allen-score-scoring-model-contract");
const contractModule = require("../use-cases/war-room/structured-candidate-trade-plan-contract") as typeof import("../use-cases/war-room/structured-candidate-trade-plan-contract");

const { buildStructuredCandidateTradePlanContract } = builderModule;
const { scoreCandidate, gradeCandidate, assignCandidatePool } = engineModule;
const { buildAllenScoreScoringModelContract } = modelModule;
const { TRADE_PLAN_FORBIDDEN_COMMAND_PHRASES, TRADE_PLAN_RATIO_TOLERANCE } = contractModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface PlanSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  trade_plan_count: number;
  valid_plan_count: number;
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
  real_data_connected: false;
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

function checkTerms(name: string, body: string | null, fileLabel: string, terms: string[]): CheckResult {
  if (body == null) return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
  const details: string[] = [];
  const issues: string[] = [];
  for (const term of terms) {
    if (body.includes(term)) details.push(`PASS  "${term}" present in ${fileLabel}.`);
    else issues.push(`FAIL  "${term}" not found in ${fileLabel}.`);
  }
  return { name, status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/structured-candidate-trade-plan.md";
const CONTRACT_REL = "use-cases/war-room/structured-candidate-trade-plan-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-structured-candidate-trade-plan-contract.ts";
const MODEL_BUILDER_REL = "use-cases/war-room/build-allen-score-scoring-model-contract.ts";
const POOLS_REL = "components/war-room/daily-candidate-pools.tsx";
const CAND_REL = "components/war-room/system-candidates-table.tsx";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Trade plan doc (new)", rel: DOC_REL },
    { label: "Trade plan contract (new)", rel: CONTRACT_REL },
    { label: "Trade plan builder (new)", rel: BUILDER_REL },
    { label: "Scoring model builder (modified)", rel: MODEL_BUILDER_REL },
    { label: "Daily candidate pools (modified)", rel: POOLS_REL },
    { label: "System candidates table (modified)", rel: CAND_REL },
    { label: "War room operational layout (modified)", rel: LAYOUT_REL },
    { label: "README", rel: README_REL },
    { label: "package.json", rel: PKG_REL },
  ];
  const details: string[] = [];
  const issues: string[] = [];
  for (const { label, rel } of required) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} present (${label}).`);
    else issues.push(`FAIL  Missing: ${rel} (${label})`);
  }
  return { name: "required_files", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 2: Required document phrases
// ---------------------------------------------------------------------------

const REQUIRED_DOC_PHRASES: string[] = [
  "V63",
  "Structured Buy Zone",
  "Structured Risk/Reward",
  "Candidate Trade Plan",
  "fixture-only",
  "deterministic contract",
  "buyZone.lower <= buyZone.upper",
  "stopLossUpper < buyZone.lower",
  "targetLower > buyZone.upper",
  "rewardRiskRatio",
  "observation only",
  "not buy/sell command",
  "system candidate is not position",
  "no fake PnL",
  "pnlComputable false",
  "no shares",
  "no cost basis",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no auto order",
  "not PRODUCTION_READY",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract type terms
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "StructuredBuyZone",
  "StructuredRiskReward",
  "StructuredEntryStrategy",
  "CandidateTradePlan",
  "CandidateTradePlanValidation",
  'currency: "TWD"',
  'sourceType: "fixture_mock"',
  "operationalUseAllowed: false",
  "isPosition: false",
  "pnlComputable: false",
  "fixtureOnly: true",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Consistency checks (build + recompute)
// ---------------------------------------------------------------------------

function checkConsistency(): { result: CheckResult; decision: string; planCount: number; validCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const bundle = buildStructuredCandidateTradePlanContract({ generatedAt: FIXED_TS });
  const model = buildAllenScoreScoringModelContract({ generatedAt: FIXED_TS });
  const candidateBySymbol = new Map(model.dailyPools.flatMap((p) => p.candidates).map((c) => [c.symbol, c] as const));

  if (bundle.contractVersion === "V63") details.push('PASS  contractVersion === "V63".');
  else issues.push(`FAIL  contractVersion === ${JSON.stringify(bundle.contractVersion)}.`);
  if (bundle.decision === "READY_FOR_UI_REVIEW") details.push("PASS  decision === READY_FOR_UI_REVIEW.");
  else issues.push(`FAIL  decision === ${JSON.stringify(bundle.decision)}, expected READY_FOR_UI_REVIEW.`);
  if ((bundle.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  if (bundle.tradePlans.length > 0) details.push(`PASS  trade plan count = ${bundle.tradePlans.length} (> 0).`);
  else issues.push("FAIL  expected at least one trade plan.");

  const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
  const isImperative = (text: string): boolean => {
    const lower = text.toLowerCase();
    return TRADE_PLAN_FORBIDDEN_COMMAND_PHRASES.some((p) => text.includes(p) || lower.includes(p.toLowerCase()));
  };

  let validCount = 0;
  for (const plan of bundle.tradePlans) {
    const tag = plan.symbol;
    const bz = plan.buyZone;
    const rr = plan.riskReward;
    const es = plan.entryStrategy;
    const fail = (msg: string): void => { issues.push(`FAIL  [${tag}] ${msg}`); };

    if (bz.lower <= bz.upper) details.push(`PASS  [${tag}] buyZone.lower <= buyZone.upper.`); else fail("buyZone.lower <= buyZone.upper violated.");
    if (rr.stopLossUpper < bz.lower) details.push(`PASS  [${tag}] stopLossUpper < buyZone.lower.`); else fail("stopLossUpper < buyZone.lower violated.");
    if (rr.targetLower > bz.upper) details.push(`PASS  [${tag}] targetLower > buyZone.upper.`); else fail("targetLower > buyZone.upper violated.");
    if (rr.downsideRiskPercent > 0) details.push(`PASS  [${tag}] downsideRiskPercent > 0.`); else fail("downsideRiskPercent must be > 0.");
    if (rr.upsideRewardPercent > 0) details.push(`PASS  [${tag}] upsideRewardPercent > 0.`); else fail("upsideRewardPercent must be > 0.");
    if (rr.rewardRiskRatio > 0) details.push(`PASS  [${tag}] rewardRiskRatio > 0.`); else fail("rewardRiskRatio must be > 0.");

    const derived = rr.downsideRiskPercent > 0 ? rr.upsideRewardPercent / rr.downsideRiskPercent : Number.NaN;
    if (Number.isFinite(derived) && Math.abs(derived - rr.rewardRiskRatio) <= TRADE_PLAN_RATIO_TOLERANCE) {
      details.push(`PASS  [${tag}] rewardRiskRatio derivable from upside/downside (±${TRADE_PLAN_RATIO_TOLERANCE}).`);
    } else fail(`rewardRiskRatio ${rr.rewardRiskRatio} not derivable from ${rr.upsideRewardPercent}/${rr.downsideRiskPercent}.`);

    if (bz.sourceType === "fixture_mock" && rr.sourceType === "fixture_mock") details.push(`PASS  [${tag}] sourceType fixture_mock.`); else fail("sourceType must be fixture_mock.");
    if (bz.operationalUseAllowed === false && rr.operationalUseAllowed === false) details.push(`PASS  [${tag}] operationalUseAllowed false.`); else fail("operationalUseAllowed must be false.");
    if (plan.isPosition === false) details.push(`PASS  [${tag}] isPosition false.`); else fail("isPosition must be false.");
    if (plan.pnlComputable === false) details.push(`PASS  [${tag}] pnlComputable false.`); else fail("pnlComputable must be false.");
    if (!hasOwn(plan, "shares")) details.push(`PASS  [${tag}] no shares.`); else fail("must not have shares.");
    if (!hasOwn(plan, "costBasis") && !hasOwn(plan, "averageCost")) details.push(`PASS  [${tag}] no cost basis.`); else fail("must not have cost basis.");
    if (es.buySellCommandGenerated === false) details.push(`PASS  [${tag}] buySellCommandGenerated false.`); else fail("buySellCommandGenerated must be false.");
    if (es.autoOrderRequested === false) details.push(`PASS  [${tag}] autoOrderRequested false.`); else fail("autoOrderRequested must be false.");
    if (!isImperative(es.triggerConditionText)) details.push(`PASS  [${tag}] triggerConditionText is not an imperative buy.`); else fail("triggerConditionText must not be an imperative buy command.");
    if (!isImperative(es.observationOnlyText) && es.observationOnlyText.includes("不是正式操作依據")) details.push(`PASS  [${tag}] observationOnlyText is observation only.`); else fail("observationOnlyText must be observation-only (not operational).");

    // Corresponds to a V62 candidate + score/grade/pool consistency.
    const cand = candidateBySymbol.get(plan.symbol);
    if (!cand) {
      fail("trade plan does not correspond to a V62 candidate.");
    } else {
      const total = scoreCandidate({
        technicalScore: cand.technicalScore,
        fundamentalScore: cand.fundamentalScore,
        chipScore: cand.chipScore,
        etfFlowScore: cand.etfFlowScore,
        marketSentimentScore: cand.marketSentimentScore,
      });
      const grade = gradeCandidate(total);
      if (plan.allenScore === total && plan.grade === grade && plan.pool === assignCandidatePool(grade)) {
        details.push(`PASS  [${tag}] score/grade/pool consistent with V62 engine.`);
      } else fail("score/grade/pool inconsistent with V62 engine.");
    }

    // Builder's own validation record must agree.
    const v = bundle.validations.find((x) => x.symbol === plan.symbol);
    if (v && v.valid) { validCount += 1; details.push(`PASS  [${tag}] builder validation.valid === true.`); }
    else issues.push(`FAIL  [${tag}] builder validation must be valid.`);
  }

  if (bundle.allValid) details.push("PASS  bundle.allValid === true.");
  else issues.push("FAIL  bundle.allValid must be true.");

  return {
    result: { name: "consistency_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: bundle.decision,
    planCount: bundle.tradePlans.length,
    validCount,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: Safety flags
// ---------------------------------------------------------------------------

function checkSafetyFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const bundle = buildStructuredCandidateTradePlanContract({ generatedAt: FIXED_TS });
  const rec = bundle as unknown as Record<string, unknown>;
  const falseFlags = [
    "operationalUseAllowed", "realDataConnected", "supabaseConnected", "envReadPerformed", "databaseWritePerformed",
    "portfolioApiSwitched", "buySellCommandGenerated", "autoOrderRequested", "productionTradingReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }
  if (rec.fixtureOnly === true) details.push("PASS  fixtureOnly === true.");
  else issues.push(`FAIL  fixtureOnly === ${JSON.stringify(rec.fixtureOnly)}, expected true.`);
  return { name: "safety_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  const cand = readFile(resolve(CAND_REL));
  const uiAll = [pools, cand].filter((x): x is string => x != null).join("\n");

  const required = [
    "候選承接區",
    "失效/防守區",
    "目標觀察區",
    "fixture/mock 區間不可作為正式操作依據",
    "觀察策略，不是買賣指令",
    "系統候選股不等於持股",
    "可逢低布局不等於已買進",
    "無股數/成本，不計算損益",
  ];
  for (const term of required) {
    if (uiAll.includes(term)) details.push(`PASS  UI contains "${term}".`);
    else issues.push(`FAIL  UI must contain "${term}".`);
  }

  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: Safety (forbidden token scan + protected files)
// ---------------------------------------------------------------------------

// new code files: the safety FLAG `autoOrderRequested` legitimately contains
// "autoorder" and the forbidden-command constant contains "place order" (with a
// space), so autoorder / placeorder are not scanned here.
const SPEC_FORBIDDEN = [
  "@supabase",
  "createclient",
  "process.env",
  "fetch(",
  "axios",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "date.now",
  "new date(",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const stripped = stripComments(body);
    const lower = stripped.toLowerCase();
    for (const token of SPEC_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
    if (stripped.includes("PRODUCTION_READY")) issues.push(`FAIL  Forbidden "PRODUCTION_READY" present in ${rel}.`);
    else details.push(`PASS  No "PRODUCTION_READY" in ${rel}.`);
  }

  const forbiddenArtifacts = [
    "app/api/portfolio/trade-plan/route.ts",
    "app/api/trade-plan/route.ts",
    "supabase/trade_plan.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V63.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/war-room-operational-layout.tsx",
    "components/war-room/system-candidates-table.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/allen-score-scoring-engine.ts",
    "use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must exist.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 8: package.json + README
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:structured-candidate-trade-plan": "node --require ./scripts/register-typescript.cjs ./scripts/validate-structured-candidate-trade-plan.ts"',
];

const README_TERMS: string[] = [
  "V63",
  "Structured Candidate Trade Plan",
  "docs/structured-candidate-trade-plan.md",
  "use-cases/war-room/structured-candidate-trade-plan-contract.ts",
  "npm run test:structured-candidate-trade-plan",
  "observation only",
  "not buy/sell command",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const contractBody = readFile(resolve(CONTRACT_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const contractCheck = checkTerms("contract_terms", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const { result: consistencyCheck, decision, planCount, validCount } = checkConsistency();
const safetyFlagsCheck = checkSafetyFlags();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  consistencyCheck,
  safetyFlagsCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: PlanSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, MODEL_BUILDER_REL, POOLS_REL, CAND_REL, LAYOUT_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    consistency_checks: consistencyCheck.status,
    safety_flags: safetyFlagsCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  trade_plan_count: planCount,
  valid_plan_count: validCount,
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
  real_data_connected: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
