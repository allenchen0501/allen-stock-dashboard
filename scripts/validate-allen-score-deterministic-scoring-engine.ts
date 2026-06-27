/**
 * Allen Score Deterministic Scoring Engine Validator — V62
 *
 * Static + pure-function check. Imports the pure scoring engine + the verification
 * bundle builder, exercises the functions (including invalid-range rejection), and
 * proves grade consistency. It does NOT start a Next.js server, make any HTTP
 * request, connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive. The pure engine file is scanned for
 * the full forbidden list. The contract / builder are scanned for the connection /
 * write list only (the safety FLAG `autoOrderRequested` legitimately contains the
 * substring "autoorder").
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const engineModule = require("../use-cases/war-room/allen-score-scoring-engine") as typeof import("../use-cases/war-room/allen-score-scoring-engine");
const engineBuilderModule = require("../use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract") as typeof import("../use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract");

const { scoreCandidate, gradeCandidate, assignCandidatePool, buildCandidateScoringBreakdown } = engineModule;
const { buildAllenScoreDeterministicScoringEngineContract } = engineBuilderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface EngineSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  breakdown_count: number;
  consistency: Record<string, boolean>;
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

const DOC_REL = "docs/allen-score-deterministic-scoring-engine.md";
const ENGINE_REL = "use-cases/war-room/allen-score-scoring-engine.ts";
const ENGINE_CONTRACT_REL = "use-cases/war-room/allen-score-deterministic-scoring-engine-contract.ts";
const ENGINE_BUILDER_REL = "use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract.ts";
const MODEL_BUILDER_REL = "use-cases/war-room/build-allen-score-scoring-model-contract.ts";
const SUMMARY_REL = "components/war-room/allen-score-summary.tsx";
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
    { label: "Scoring engine doc (new)", rel: DOC_REL },
    { label: "Scoring engine pure functions (new)", rel: ENGINE_REL },
    { label: "Scoring engine contract (new)", rel: ENGINE_CONTRACT_REL },
    { label: "Scoring engine builder (new)", rel: ENGINE_BUILDER_REL },
    { label: "Scoring model builder (modified)", rel: MODEL_BUILDER_REL },
    { label: "Allen Score summary (modified)", rel: SUMMARY_REL },
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
  "V62",
  "Allen Score Deterministic Scoring Engine",
  "scoreCandidate",
  "gradeCandidate",
  "assignCandidatePool",
  "totalScore equals sub-score sum",
  "grade must match score",
  "pool must match grade",
  "A >= 80",
  "B 70–79",
  "C 60–69",
  "AVOID < 60",
  "system candidate is not position",
  "no fake PnL",
  "pnlComputable false",
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
// Gate 3: Engine contract terms
// ---------------------------------------------------------------------------

const ENGINE_TERMS: string[] = [
  "export function scoreCandidate",
  "export function gradeCandidate",
  "export function assignCandidatePool",
  "export function buildCandidateScoringBreakdown",
  "A_GRADE_MAIN_UPTREND",
  "B_GRADE_WATCHLIST",
  "C_GRADE_WAITING",
  "RISK_BLOCKLIST",
];

const CONTRACT_TERMS: string[] = [
  "AllenScoreDeterministicScoringEngineBundle",
  "AllenScoreScoringConsistency",
  "everyCandidateTotalEqualsSum",
  "everyCandidateGradeMatchesScore",
  "everyCandidatePoolMatchesGrade",
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
  for (const rel of [ENGINE_REL, ENGINE_CONTRACT_REL, ENGINE_BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    if (stripComments(body).includes("PRODUCTION_READY")) issues.push(`FAIL  Forbidden "PRODUCTION_READY" present in ${rel}.`);
    else details.push(`PASS  No "PRODUCTION_READY" in ${rel}.`);
  }
  return { name: "no_production_ready", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: Engine exports + invalid range rejection
// ---------------------------------------------------------------------------

function checkEngineFunctions(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const [label, fn] of [
    ["scoreCandidate", scoreCandidate],
    ["gradeCandidate", gradeCandidate],
    ["assignCandidatePool", assignCandidatePool],
    ["buildCandidateScoringBreakdown", buildCandidateScoringBreakdown],
  ] as const) {
    if (typeof fn === "function") details.push(`PASS  engine exports ${label}().`);
    else issues.push(`FAIL  engine must export ${label}() as a function.`);
  }

  // Valid total = sum.
  const valid = { technicalScore: 27, fundamentalScore: 22, chipScore: 22, etfFlowScore: 9, marketSentimentScore: 8 };
  try {
    const t = scoreCandidate(valid);
    if (t === 88) details.push("PASS  scoreCandidate(valid) === 88 (= sub-score sum).");
    else issues.push(`FAIL  scoreCandidate(valid) === ${t}, expected 88.`);
  } catch (e) {
    issues.push(`FAIL  scoreCandidate(valid) threw unexpectedly: ${String(e)}.`);
  }

  // Invalid ranges must be rejected (throw).
  const invalids: Array<[string, Record<string, number>]> = [
    ["technicalScore > 30", { technicalScore: 31, fundamentalScore: 0, chipScore: 0, etfFlowScore: 0, marketSentimentScore: 0 }],
    ["fundamentalScore > 25", { technicalScore: 0, fundamentalScore: 26, chipScore: 0, etfFlowScore: 0, marketSentimentScore: 0 }],
    ["chipScore > 25", { technicalScore: 0, fundamentalScore: 0, chipScore: 26, etfFlowScore: 0, marketSentimentScore: 0 }],
    ["etfFlowScore > 10", { technicalScore: 0, fundamentalScore: 0, chipScore: 0, etfFlowScore: 11, marketSentimentScore: 0 }],
    ["marketSentimentScore > 10", { technicalScore: 0, fundamentalScore: 0, chipScore: 0, etfFlowScore: 0, marketSentimentScore: 11 }],
    ["negative sub-score", { technicalScore: -1, fundamentalScore: 0, chipScore: 0, etfFlowScore: 0, marketSentimentScore: 0 }],
  ];
  for (const [label, bad] of invalids) {
    let threw = false;
    try {
      scoreCandidate(bad as never);
    } catch {
      threw = true;
    }
    if (threw) details.push(`PASS  scoreCandidate rejects invalid range (${label}).`);
    else issues.push(`FAIL  scoreCandidate must reject invalid range (${label}).`);
  }

  // gradeCandidate thresholds.
  const gradeCases: Array<[number, string]> = [
    [100, "A"], [80, "A"], [79, "B"], [70, "B"], [69, "C"], [60, "C"], [59, "AVOID"], [0, "AVOID"],
  ];
  for (const [score, grade] of gradeCases) {
    if (gradeCandidate(score) === grade) details.push(`PASS  gradeCandidate(${score}) === ${grade}.`);
    else issues.push(`FAIL  gradeCandidate(${score}) === ${gradeCandidate(score)}, expected ${grade}.`);
  }

  // assignCandidatePool mapping.
  const poolCases: Array<[string, string]> = [
    ["A", "A_GRADE_MAIN_UPTREND"], ["B", "B_GRADE_WATCHLIST"], ["C", "C_GRADE_WAITING"], ["AVOID", "RISK_BLOCKLIST"],
  ];
  for (const [grade, pool] of poolCases) {
    if (assignCandidatePool(grade as never) === pool) details.push(`PASS  assignCandidatePool(${grade}) === ${pool}.`);
    else issues.push(`FAIL  assignCandidatePool(${grade}) === ${assignCandidatePool(grade as never)}, expected ${pool}.`);
  }

  return { name: "engine_functions", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Consistency (total == sum, grade matches score, pool matches grade)
// ---------------------------------------------------------------------------

function checkConsistency(): {
  result: CheckResult;
  decision: string;
  breakdownCount: number;
  consistency: Record<string, boolean>;
} {
  const details: string[] = [];
  const issues: string[] = [];

  const bundle = buildAllenScoreDeterministicScoringEngineContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", bundle.contractVersion, "V62");
  expectEq("engineName", bundle.engineName, "Allen Score Deterministic Scoring Engine");
  expectEq("generatedAt", bundle.generatedAt, FIXED_TS);
  expectEq("decision", bundle.decision, "READY_FOR_UI_REVIEW");
  if ((bundle.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');
  else details.push('PASS  decision is not "PRODUCTION_READY".');

  // Consistency flags must all be true.
  const c = bundle.consistency as unknown as Record<string, boolean>;
  for (const key of Object.keys(c)) {
    if (c[key] === true) details.push(`PASS  consistency.${key} === true.`);
    else issues.push(`FAIL  consistency.${key} === ${c[key]}, expected true.`);
  }

  // Independent recompute over breakdowns.
  let totalsOk = true;
  let gradesOk = true;
  let poolsOk = true;
  for (const b of bundle.breakdowns) {
    const sum = b.technicalScore + b.fundamentalScore + b.chipScore + b.etfFlowScore + b.marketSentimentScore;
    if (b.computedTotal !== sum || !b.totalMatches || b.reportedTotal !== sum) totalsOk = false;
    if (gradeCandidate(b.computedTotal) !== b.engineGrade) gradesOk = false;
    if (assignCandidatePool(b.engineGrade) !== b.assignedPool) poolsOk = false;
    if (b.isPosition !== false || b.pnlComputable !== false) {
      issues.push(`FAIL  breakdown ${b.symbol} must have isPosition=false and pnlComputable=false.`);
    }
  }
  if (totalsOk) details.push("PASS  all candidate totals equal sub-score sums.");
  else issues.push("FAIL  some candidate total != sub-score sum.");
  if (gradesOk) details.push("PASS  all grades match score thresholds.");
  else issues.push("FAIL  some grade does not match score.");
  if (poolsOk) details.push("PASS  all pools match grades.");
  else issues.push("FAIL  some pool does not match grade.");

  if (bundle.breakdowns.length > 0) details.push(`PASS  breakdown count = ${bundle.breakdowns.length} (> 0).`);
  else issues.push("FAIL  expected at least one candidate breakdown.");

  return {
    result: { name: "consistency_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: bundle.decision,
    breakdownCount: bundle.breakdowns.length,
    consistency: c,
  };
}

// ---------------------------------------------------------------------------
// Gate 6: Safety flags on bundle
// ---------------------------------------------------------------------------

function checkSafetyFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const bundle = buildAllenScoreDeterministicScoringEngineContract({ generatedAt: FIXED_TS });
  const rec = bundle as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "supabaseConnected", "envReadPerformed", "databaseWritePerformed",
    "portfolioApiSwitched", "buySellCommandGenerated", "autoOrderRequested", "productionTradingReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }
  return { name: "safety_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const summary = readFile(resolve(SUMMARY_REL));
  const pools = readFile(resolve(POOLS_REL));
  const cand = readFile(resolve(CAND_REL));
  const uiAll = [summary, pools, cand].filter((x): x is string => x != null).join("\n");

  const required: Array<[string, string]> = [
    ["Allen Score 100", uiAll],
    ["A 級主升段池", pools ?? ""],
    ["B 級觀察池", pools ?? ""],
    ["C 級等待池", pools ?? ""],
    ["禁碰池", pools ?? ""],
    ["系統候選股不等於持股", uiAll],
    ["可逢低布局不等於已買進", uiAll],
    ["fixture/mock score 不可作為正式操作依據", uiAll],
  ];
  for (const [term, body] of required) {
    if (body.includes(term)) details.push(`PASS  UI contains "${term}".`);
    else issues.push(`FAIL  UI must contain "${term}".`);
  }

  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 8: Safety (forbidden token scan + protected files)
// ---------------------------------------------------------------------------

const FULL_FORBIDDEN = [
  "@supabase",
  "createclient",
  "process.env",
  "fetch(",
  "axios",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "autoorder",
  "placeorder",
];

// contract / builder: the safety FLAG `autoOrderRequested` legitimately contains
// "autoorder", so autoorder / placeorder are not scanned here.
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

  // Pure engine file: full forbidden list.
  const engineBody = readFile(resolve(ENGINE_REL));
  if (engineBody == null) {
    issues.push(`FAIL  Cannot read ${ENGINE_REL}.`);
  } else {
    const lower = stripComments(engineBody).toLowerCase();
    for (const token of FULL_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${ENGINE_REL}.`);
      else details.push(`PASS  No "${token}" in ${ENGINE_REL}.`);
    }
  }

  // Contract + builder: connection / write list only.
  for (const rel of [ENGINE_CONTRACT_REL, ENGINE_BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const lower = stripComments(body).toLowerCase();
    for (const token of SPEC_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
  }

  // No new API route / SQL migration added in V62.
  const forbiddenArtifacts = [
    "app/api/portfolio/allen-score/route.ts",
    "app/api/allen-score-engine/route.ts",
    "supabase/allen_score_engine.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V62.`);
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
    "use-cases/war-room/allen-score-scoring-model-contract.ts",
    "use-cases/war-room/build-allen-score-scoring-model-contract.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must exist.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 9: package.json + README
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:allen-score-deterministic-scoring-engine": "node --require ./scripts/register-typescript.cjs ./scripts/validate-allen-score-deterministic-scoring-engine.ts"',
];

const README_TERMS: string[] = [
  "V62",
  "Allen Score Deterministic Scoring Engine",
  "docs/allen-score-deterministic-scoring-engine.md",
  "use-cases/war-room/allen-score-scoring-engine.ts",
  "npm run test:allen-score-deterministic-scoring-engine",
  "scoreCandidate",
  "gradeCandidate",
  "assignCandidatePool",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const engineBody = readFile(resolve(ENGINE_REL));
const contractBody = readFile(resolve(ENGINE_CONTRACT_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const engineTermsCheck = checkTerms("engine_terms", engineBody, ENGINE_REL, ENGINE_TERMS);
const contractTermsCheck = checkTerms("contract_terms", contractBody, ENGINE_CONTRACT_REL, CONTRACT_TERMS);
const noProdReadyCheck = checkNoProductionReady();
const engineFnCheck = checkEngineFunctions();
const { result: consistencyCheck, decision, breakdownCount, consistency } = checkConsistency();
const safetyFlagsCheck = checkSafetyFlags();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  engineTermsCheck,
  contractTermsCheck,
  noProdReadyCheck,
  engineFnCheck,
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

const summary: EngineSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, ENGINE_REL, ENGINE_CONTRACT_REL, ENGINE_BUILDER_REL, MODEL_BUILDER_REL, SUMMARY_REL, POOLS_REL, CAND_REL, LAYOUT_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    engine_terms: engineTermsCheck.status,
    contract_terms: contractTermsCheck.status,
    no_production_ready: noProdReadyCheck.status,
    engine_functions: engineFnCheck.status,
    consistency_checks: consistencyCheck.status,
    safety_flags: safetyFlagsCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  breakdown_count: breakdownCount,
  consistency,
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
