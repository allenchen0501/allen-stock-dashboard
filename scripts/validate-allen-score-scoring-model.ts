/**
 * Allen Score Scoring Model Validator — V61
 *
 * Static + contract check. Imports the pure builder + constants and inspects the
 * Allen Score 100 scoring model bundle, and statically checks the UI files / docs.
 * It does NOT start a Next.js server, make any HTTP request, connect to Supabase,
 * read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive. The new UI files are scanned for
 * the full forbidden list including autoorder / placeorder. The contract / builder
 * are scanned for the connection / write list only (the safety FLAG
 * `autoOrderRequested` legitimately contains the substring "autoorder").
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-allen-score-scoring-model-contract") as typeof import("../use-cases/war-room/build-allen-score-scoring-model-contract");
const { buildAllenScoreScoringModelContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface ModelSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  category_count: number;
  pool_count: number;
  candidate_count: number;
  weights_sum: number;
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

const DOC_REL = "docs/allen-score-scoring-model.md";
const CONTRACT_REL = "use-cases/war-room/allen-score-scoring-model-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-allen-score-scoring-model-contract.ts";
const SUMMARY_REL = "components/war-room/allen-score-summary.tsx";
const POOLS_REL = "components/war-room/daily-candidate-pools.tsx";
const CAND_REL = "components/war-room/system-candidates-table.tsx";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

const NEW_UI_FILES = [SUMMARY_REL, POOLS_REL, CAND_REL];
const NEW_SPEC_FILES = [CONTRACT_REL, BUILDER_REL];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Scoring model doc (new)", rel: DOC_REL },
    { label: "Scoring model contract (new)", rel: CONTRACT_REL },
    { label: "Scoring model builder (new)", rel: BUILDER_REL },
    { label: "Allen Score summary component (new)", rel: SUMMARY_REL },
    { label: "Daily candidate pools component (new)", rel: POOLS_REL },
    { label: "System candidates table", rel: CAND_REL },
    { label: "War room operational layout", rel: LAYOUT_REL },
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
  "V61",
  "Allen Score 100",
  "Technical Score 30",
  "Fundamental Score 25",
  "Chip Score 25",
  "ETF Flow Score 10",
  "Market Sentiment Score 10",
  "KD",
  "KDJ",
  "MACD",
  "moving averages",
  "扣三低",
  "營收",
  "EPS",
  "毛利率",
  "法人預估",
  "外資",
  "投信",
  "主力",
  "大戶持股",
  "00981A",
  "00991A",
  "00403A",
  "Put / Call",
  "VIX",
  "散戶小台",
  "外資期貨",
  "A 級主升段池",
  "B 級觀察池",
  "C 級等待池",
  "禁碰池",
  "system candidate is not position",
  "no fake PnL",
  "fixture/mock score is not operational data",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract terms
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "AllenScoreCategoryId",
  "AllenScoreGrade",
  "AllenScorePoolId",
  "AllenScoreSuggestedAction",
  "AllenScoreVerificationStatus",
  "AllenScoreCategory",
  "AllenScorePoolDefinition",
  "AllenScoreCandidate",
  "AllenScoreDailyPool",
  "AllenScoreScoringModelBundle",
  "ALLEN_SCORE_SCORING_MODEL_CONTRACT_VERSION",
  "ALLEN_SCORE_ETF_FLOW_SYMBOLS",
  "ALLEN_SCORE_SAFETY_LABELS",
  "isPosition: false",
  "pnlComputable: false",
  "systemCandidateIsNotPosition: true",
  "watchlistIsNotPosition: true",
  "opportunityPoolIsNotPosition: true",
  "actualPositionRequiresSharesAndCostForPnl: true",
  "noFakePnlAllowed: true",
  "sampleScoreIsFixtureOnly: true",
  "mockDataMustBeLabeled: true",
  "fixtureDataMustBeLabeled: true",
  "realDataConnected: false",
  "supabaseConnected: false",
  "envReadPerformed: false",
  "databaseWritePerformed: false",
  "portfolioApiSwitched: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "productionTradingReady: false",
];

function checkNoProductionReady(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    if (stripComments(body).includes("PRODUCTION_READY")) issues.push(`FAIL  Forbidden "PRODUCTION_READY" present in ${rel}.`);
    else details.push(`PASS  No "PRODUCTION_READY" in ${rel}.`);
  }
  return { name: "no_production_ready", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: Payload checks (import + call the builder)
// ---------------------------------------------------------------------------

function checkPayload(): {
  result: CheckResult;
  decision: string;
  categoryCount: number;
  poolCount: number;
  candidateCount: number;
  weightsSum: number;
} {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildAllenScoreScoringModelContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  // Identity.
  expectEq("contractVersion", p.contractVersion, "V61");
  expectEq("scoringModelName", p.scoringModelName, "Allen Score 100");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("decision", p.decision, "READY_FOR_UI_REVIEW");
  if ((p.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');
  else details.push('PASS  decision is not "PRODUCTION_READY".');

  // Weights.
  expectEq("totalScore", p.totalScore, 100);
  expectEq("technicalWeight", p.technicalWeight, 30);
  expectEq("fundamentalWeight", p.fundamentalWeight, 25);
  expectEq("chipWeight", p.chipWeight, 25);
  expectEq("etfFlowWeight", p.etfFlowWeight, 10);
  expectEq("marketSentimentWeight", p.marketSentimentWeight, 10);
  expectEq("scoreWeightsSum", p.scoreWeightsSum, 100);

  // Weights sum to 100 (computed).
  const weightsSum = p.technicalWeight + p.fundamentalWeight + p.chipWeight + p.etfFlowWeight + p.marketSentimentWeight;
  if (weightsSum === 100) details.push(`PASS  category weights sum to 100 (${weightsSum}).`);
  else issues.push(`FAIL  category weights sum to ${weightsSum}, expected 100.`);
  const catSum = p.categories.reduce((s, c) => s + c.weight, 0);
  if (catSum === 100) details.push(`PASS  categories[].weight sum to 100 (${catSum}).`);
  else issues.push(`FAIL  categories[].weight sum to ${catSum}, expected 100.`);

  // Thresholds.
  expectEq("aGradeThreshold", p.aGradeThreshold, 80);
  expectEq("bGradeMin", p.bGradeMin, 70);
  expectEq("bGradeMax", p.bGradeMax, 79);
  expectEq("cGradeMin", p.cGradeMin, 60);
  expectEq("cGradeMax", p.cGradeMax, 69);
  expectEq("avoidBelow", p.avoidBelow, 60);

  // Categories present (all 5).
  const catIds = new Set(p.categories.map((c) => c.categoryId));
  for (const id of ["TECHNICAL", "FUNDAMENTAL", "CHIP", "ETF_FLOW", "MARKET_SENTIMENT"]) {
    if (catIds.has(id as never)) details.push(`PASS  category ${id} present.`);
    else issues.push(`FAIL  category ${id} missing.`);
  }

  // Pools present (all 4 grades).
  const poolGrades = new Set(p.poolDefinitions.map((d) => d.grade));
  for (const g of ["A_MAIN_UPTREND", "B_OBSERVE", "C_WAIT", "AVOID"]) {
    if (poolGrades.has(g as never)) details.push(`PASS  pool definition for ${g} present.`);
    else issues.push(`FAIL  pool definition for ${g} missing.`);
  }

  // Safety flags.
  const trueFlags = [
    "systemCandidateIsNotPosition", "watchlistIsNotPosition", "opportunityPoolIsNotPosition",
    "actualPositionRequiresSharesAndCostForPnl", "noFakePnlAllowed", "sampleScoreIsFixtureOnly",
    "mockDataMustBeLabeled", "fixtureDataMustBeLabeled",
  ] as const;
  const falseFlags = [
    "realDataConnected", "supabaseConnected", "envReadPerformed", "databaseWritePerformed",
    "portfolioApiSwitched", "buySellCommandGenerated", "autoOrderRequested", "productionTradingReady",
  ] as const;
  const rec = p as unknown as Record<string, unknown>;
  for (const f of trueFlags) expectEq(f, rec[f], true);
  for (const f of falseFlags) expectEq(f, rec[f], false);

  // Every candidate: isPosition false, pnlComputable false, score = sum of sub-scores, grade matches.
  const allCandidates = p.dailyPools.flatMap((pool) => pool.candidates);
  let candOk = true;
  for (const c of allCandidates) {
    if (c.isPosition !== false || c.pnlComputable !== false) {
      candOk = false;
      issues.push(`FAIL  candidate ${c.symbol} must have isPosition=false and pnlComputable=false.`);
    }
    const sub = c.technicalScore + c.fundamentalScore + c.chipScore + c.etfFlowScore + c.marketSentimentScore;
    if (sub !== c.allenScore) {
      candOk = false;
      issues.push(`FAIL  candidate ${c.symbol} sub-scores sum ${sub} !== allenScore ${c.allenScore}.`);
    }
  }
  if (candOk && allCandidates.length > 0) {
    details.push(`PASS  all ${allCandidates.length} candidates: isPosition=false, pnlComputable=false, sub-scores sum to allenScore.`);
  } else if (allCandidates.length === 0) {
    issues.push("FAIL  expected at least one fixture candidate across daily pools.");
  }

  // Grade boundary correctness on pool definitions.
  const aDef = p.poolDefinitions.find((d) => d.grade === "A_MAIN_UPTREND");
  const bDef = p.poolDefinitions.find((d) => d.grade === "B_OBSERVE");
  const cDef = p.poolDefinitions.find((d) => d.grade === "C_WAIT");
  if (aDef && aDef.scoreMin === 80 && aDef.scoreMax === null) details.push("PASS  A pool: scoreMin 80, no max (A >= 80).");
  else issues.push("FAIL  A pool must be scoreMin 80, scoreMax null.");
  if (bDef && bDef.scoreMin === 70 && bDef.scoreMax === 79) details.push("PASS  B pool: 70-79.");
  else issues.push("FAIL  B pool must be 70-79.");
  if (cDef && cDef.scoreMin === 60 && cDef.scoreMax === 69) details.push("PASS  C pool: 60-69.");
  else issues.push("FAIL  C pool must be 60-69.");

  return {
    result: { name: "payload_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: p.decision,
    categoryCount: p.categories.length,
    poolCount: p.poolDefinitions.length,
    candidateCount: allCandidates.length,
    weightsSum,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const summary = readFile(resolve(SUMMARY_REL));
  const pools = readFile(resolve(POOLS_REL));
  const cand = readFile(resolve(CAND_REL));
  const layout = readFile(resolve(LAYOUT_REL));
  const uiAll = [summary, pools, cand, layout].filter((x): x is string => x != null).join("\n");

  // Allen Score 100 in UI.
  if (summary && summary.includes("Allen Score 100")) details.push("PASS  summary UI contains Allen Score 100.");
  else issues.push("FAIL  Allen Score summary must contain literal Allen Score 100.");

  // A/B/C/禁碰池 in pools UI.
  for (const grade of ["A 級主升段池", "B 級觀察池", "C 級等待池", "禁碰池"]) {
    if (pools && pools.includes(grade)) details.push(`PASS  daily pools UI contains ${grade}.`);
    else issues.push(`FAIL  daily candidate pools UI must contain ${grade}.`);
  }

  // fixture/mock warning.
  if (uiAll.includes("fixture/mock score is not operational data")) details.push("PASS  UI shows fixture/mock score is not operational data warning.");
  else issues.push("FAIL  UI must show fixture/mock score is not operational data warning.");

  // system candidate is not position (Chinese).
  if (uiAll.includes("系統候選股不等於持股")) details.push("PASS  UI states 系統候選股不等於持股.");
  else issues.push("FAIL  UI must state 系統候選股不等於持股.");

  // 可逢低布局不等於已買進.
  if (uiAll.includes("可逢低布局不等於已買進")) details.push("PASS  UI states 可逢低布局不等於已買進.");
  else issues.push("FAIL  UI must state 可逢低布局不等於已買進.");

  // Candidates table shows score + 5 sub-scores headers.
  if (cand && cand.includes("Allen Score") && cand.includes("technicalScore") === false) {
    // header presence (allow either label form)
  }
  for (const col of ["allenScore", "technicalScore", "fundamentalScore", "chipScore", "etfFlowScore", "marketSentimentScore"]) {
    if (cand && cand.includes(col)) details.push(`PASS  candidates table renders ${col}.`);
    else issues.push(`FAIL  candidates table must render ${col}.`);
  }

  // Layout composes the new sections.
  if (layout) {
    for (const tag of ["<AllenScoreSummary", "<DailyCandidatePools", "<SystemCandidatesTable"]) {
      if (layout.includes(tag)) details.push(`PASS  layout renders ${tag}.`);
      else issues.push(`FAIL  layout must render ${tag}.`);
    }
  } else issues.push(`FAIL  Cannot read ${LAYOUT_REL}.`);

  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Safety (forbidden token scan + protected files)
// ---------------------------------------------------------------------------

const UI_FORBIDDEN = [
  "@supabase",
  "createclient",
  "process.env",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "fetch(",
  "axios",
  "autoorder",
  "placeorder",
];

// contract / builder: the safety FLAG `autoOrderRequested` legitimately contains
// "autoorder", so autoorder / placeorder are not scanned here.
const SPEC_FORBIDDEN = [
  "@supabase",
  "createclient",
  "process.env",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "fetch(",
  "axios",
  "date.now",
  "new date(",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of NEW_UI_FILES) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const lower = stripComments(body).toLowerCase();
    for (const token of UI_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
  }

  for (const rel of NEW_SPEC_FILES) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const lower = stripComments(body).toLowerCase();
    for (const token of SPEC_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
  }

  // No new API route / SQL migration added in V61.
  const forbiddenArtifacts = [
    "app/api/portfolio/allen-score/route.ts",
    "app/api/allen-score/route.ts",
    "supabase/allen_score.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V61.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  // Protected existing routes / components still present.
  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/war-room-operational-layout.tsx",
    "components/war-room/system-candidates-table.tsx",
    "components/war-room/actual-positions-table.tsx",
    "components/war-room/fixed-watchlist-table.tsx",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must exist.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:allen-score-scoring-model": "node --require ./scripts/register-typescript.cjs ./scripts/validate-allen-score-scoring-model.ts"',
];

const README_TERMS: string[] = [
  "V61",
  "Allen Score 100",
  "docs/allen-score-scoring-model.md",
  "use-cases/war-room/allen-score-scoring-model-contract.ts",
  "use-cases/war-room/build-allen-score-scoring-model-contract.ts",
  "npm run test:allen-score-scoring-model",
  "system candidate is not position",
  "fixture/mock score is not operational data",
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
const contractCheck = checkTerms("contract_checks", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const noProdReadyCheck = checkNoProductionReady();
const { result: payloadCheck, decision, categoryCount, poolCount, candidateCount, weightsSum } = checkPayload();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  noProdReadyCheck,
  payloadCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: ModelSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, SUMMARY_REL, POOLS_REL, CAND_REL, LAYOUT_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    no_production_ready: noProdReadyCheck.status,
    payload_checks: payloadCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  category_count: categoryCount,
  pool_count: poolCount,
  candidate_count: candidateCount,
  weights_sum: weightsSum,
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
