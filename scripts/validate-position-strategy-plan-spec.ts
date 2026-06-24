/**
 * Position Strategy Plan Spec Validator — V24
 *
 * Spec-only, local file-system + constant-import check. Does NOT start a Next.js
 * server, make any HTTP request, connect to Supabase, read env keys, write data,
 * or create a runtime. It only reads files, imports static contract constants,
 * and inspects their contents.
 *
 * Safety scanning for forbidden runtime tokens is applied ONLY to the contract
 * code file (comment-stripped). Documentation may legitimately mention TWSE /
 * TPEx / Yahoo / FinMind / TradingView / yfinance-like as a future data-source
 * priority list, so docs are NOT scanned for those source names.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/position-strategy/position-strategy-plan-contract") as typeof import("../use-cases/position-strategy/position-strategy-plan-contract");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface PositionStrategySpecSummary {
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

// Negation characters that mark a safe (negated) usage context.
const NEGATION_CHARS = ["不", "未", "非", "無", "別"];

/**
 * Returns true if `term` appears at least once in `body` WITHOUT a negation
 * character in the preceding window. Used to ensure price-words and command
 * terms only ever appear in a negated/safety context (e.g. 「不是買進價」).
 */
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/position-strategy-plan-spec.md";
const CONTRACT_REL = "use-cases/position-strategy/position-strategy-plan-contract.ts";
const TECH_DOC_REL = "docs/technical-risk-reward-strategy-spec.md";
const READ_MODEL_DOC_REL = "docs/war-room-read-model-contract.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Position Strategy Plan Spec (new)", rel: DOC_REL },
    { label: "Position Strategy Plan Contract (new)", rel: CONTRACT_REL },
    { label: "Technical + Risk Reward Strategy Spec", rel: TECH_DOC_REL },
    { label: "War Room Read Model Contract doc", rel: READ_MODEL_DOC_REL },
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
  "Position Strategy Plan",
  "進場觀察區",
  "轉強確認條件",
  "策略失效觀察價",
  "防守區",
  "獲利保護區",
  "風險降低觀察",
  "出場觀察區",
  "不追價區",
  "ENTRY_OBSERVATION",
  "HOLDING_DEFENSE",
  "PROFIT_PROTECTION",
  "RISK_REDUCTION",
  "NO_TOUCH",
  "DATA_INSUFFICIENT",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "進場觀察區不是買進價",
  "策略失效觀察價不是自動停損價",
  "觀察目標區不是目標價",
  "出場觀察區不是賣出價",
  "takeProfitZone 不是賣出價",
  "風險降低觀察不是賣出指令",
  "No Touch 是風控提醒，不是賣出指令",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "War Room 仍是 read model",
  "V24 只定義 Holding Defense Plan",
  "真正的 Holding Defense Tracker API 留到 V27",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks (text presence)
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "PositionStrategyPlanType",
  "PositionStrategyDataQualityStatus",
  "PositionStrategySourceMode",
  "PriceVerificationStatus",
  "PositionStrategyRiskRewardGrade",
  "HoldingState",
  "HoldingActionState",
  "PriceZone",
  "PositionStrategyPlan",
  "PositionStrategyPlanBundle",
  "POSITION_STRATEGY_CONTRACT_VERSION",
  "POSITION_STRATEGY_SAFETY_LABELS",
  "POSITION_STRATEGY_ALLOWED_PLAN_TYPES",
  "POSITION_STRATEGY_DISALLOWED_TERMS",
  "ENTRY_OBSERVATION",
  "HOLDING_DEFENSE",
  "PROFIT_PROTECTION",
  "RISK_REDUCTION",
  "NO_TOUCH",
  "DATA_INSUFFICIENT",
  "priceVerified",
  "entryObservationZone",
  "confirmationCondition",
  "defenseZone",
  "invalidLevel",
  "profitProtectionZone",
  "takeProfitZone",
  "riskReduceZone",
  "exitObservationZone",
  "targetObservationZone",
  "holdingImpact",
  "notEntrySignal",
  "notExitSignal",
  "notTradeAdvice",
  "highConfidenceConclusionAllowed",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Constant value checks (import + validate)
// ---------------------------------------------------------------------------

function checkConstants(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const {
    POSITION_STRATEGY_CONTRACT_VERSION,
    POSITION_STRATEGY_SAFETY_LABELS,
    POSITION_STRATEGY_ALLOWED_PLAN_TYPES,
    POSITION_STRATEGY_DISALLOWED_TERMS,
  } = contractModule;

  if (POSITION_STRATEGY_CONTRACT_VERSION === "V24") {
    details.push('PASS  POSITION_STRATEGY_CONTRACT_VERSION === "V24".');
  } else {
    issues.push(
      `FAIL  POSITION_STRATEGY_CONTRACT_VERSION === ${JSON.stringify(POSITION_STRATEGY_CONTRACT_VERSION)}, expected "V24".`,
    );
  }

  const requiredPlanTypes = [
    "ENTRY_OBSERVATION",
    "HOLDING_DEFENSE",
    "PROFIT_PROTECTION",
    "RISK_REDUCTION",
    "NO_TOUCH",
    "DATA_INSUFFICIENT",
  ];
  for (const t of requiredPlanTypes) {
    if (POSITION_STRATEGY_ALLOWED_PLAN_TYPES.includes(t as never)) {
      details.push(`PASS  POSITION_STRATEGY_ALLOWED_PLAN_TYPES includes "${t}".`);
    } else {
      issues.push(`FAIL  POSITION_STRATEGY_ALLOWED_PLAN_TYPES missing "${t}".`);
    }
  }

  const requiredLabels = [
    "不自動下單",
    "不產生買賣指令",
    "不替代投資判斷",
    "進場觀察區不是買進價",
    "策略失效觀察價不是自動停損價",
    "觀察目標區不是目標價",
    "出場觀察區不是賣出價",
    "takeProfitZone 不是賣出價",
    "風險降低觀察不是賣出指令",
    "資料不足就顯示資料不足",
  ];
  for (const label of requiredLabels) {
    if (POSITION_STRATEGY_SAFETY_LABELS.includes(label as never)) {
      details.push(`PASS  POSITION_STRATEGY_SAFETY_LABELS includes "${label}".`);
    } else {
      issues.push(`FAIL  POSITION_STRATEGY_SAFETY_LABELS missing "${label}".`);
    }
  }

  const requiredDisallowed = ["強力買進", "必買", "必賣", "立即進場", "立即出場", "自動下單"];
  for (const term of requiredDisallowed) {
    if (POSITION_STRATEGY_DISALLOWED_TERMS.includes(term as never)) {
      details.push(`PASS  POSITION_STRATEGY_DISALLOWED_TERMS includes "${term}".`);
    } else {
      issues.push(`FAIL  POSITION_STRATEGY_DISALLOWED_TERMS missing "${term}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "constant_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:position-strategy-plan-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-position-strategy-plan-spec.ts"',
];

const README_TERMS: string[] = [
  "V24",
  "Position Strategy Plan",
  "docs/position-strategy-plan-spec.md",
  "use-cases/position-strategy/position-strategy-plan-contract.ts",
  "npm run test:position-strategy-plan-spec",
  "進場觀察區",
  "策略失效觀察價",
  "獲利保護區",
  "takeProfitZone",
  "holdingImpact",
  "風險降低觀察",
  "V24 只定義 Holding Defense Plan",
  "Holding Defense Tracker API 留到 V27",
  "本階段未接資料源",
  "未建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 API route",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 6: Negation-context + disallowed-term checks (doc prose)
// ---------------------------------------------------------------------------

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

  // Price words must only ever appear in a negated/safety context.
  const priceWords = ["買進價", "賣出價", "目標價", "停損價"];
  for (const word of priceWords) {
    if (hasNonNegatedOccurrence(docBody, word)) {
      issues.push(`FAIL  "${word}" appears in a non-negated context in ${DOC_REL}.`);
    } else {
      details.push(`PASS  "${word}" only appears in negated/safety context.`);
    }
  }

  // Imperative command terms must not appear as advice (negation tolerated for
  // 「不自動下單」 etc.).
  const { POSITION_STRATEGY_DISALLOWED_TERMS } = contractModule;
  for (const term of POSITION_STRATEGY_DISALLOWED_TERMS) {
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
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

const FORBIDDEN_RUNTIME_TOKENS: Array<{ token: string; label: string }> = [
  { token: "fetch(", label: "fetch( call" },
  { token: "axios", label: "axios import/usage" },
  { token: "createclient", label: "Supabase createClient" },
  { token: "@supabase", label: "@supabase import" },
  { token: "process.env", label: "env secret read" },
  { token: "date.now", label: "Date.now usage" },
  { token: "new date(", label: "new Date() usage" },
  { token: "insert(", label: "database insert" },
  { token: "upsert(", label: "database upsert" },
  { token: "update(", label: "database update" },
  { token: "delete(", label: "database delete" },
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 7a. Contract code file must contain no forbidden runtime tokens.
  const contract = readFile(resolve(CONTRACT_REL));
  if (contract == null) {
    issues.push(`FAIL  Cannot read ${CONTRACT_REL}.`);
  } else {
    const lower = stripComments(contract).toLowerCase();
    for (const { token, label } of FORBIDDEN_RUNTIME_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden "${label}" found in ${CONTRACT_REL}.`);
      } else {
        details.push(`PASS  No "${label}" in ${CONTRACT_REL} code.`);
      }
    }
  }

  // 7b. No new SQL migration for position strategy.
  const forbiddenMigrations = [
    "supabase/position_strategy.sql",
    "supabase/v24_position_strategy.sql",
    "supabase/position_strategy_plan.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V24.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7c. No new API route / UI component for position strategy.
  const forbiddenArtifacts = [
    "app/api/position-strategy/route.ts",
    "app/api/holding-defense/route.ts",
    "app/api/holding-defense-tracker/route.ts",
    "app/position-strategy/page.tsx",
    "components/position-strategy-plan.tsx",
    "components/holding-defense.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V24.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7d. No position-strategy runtime / data-source adapter.
  const forbiddenRuntime = [
    "use-cases/position-strategy/build-position-strategy-plan.ts",
    "use-cases/position-strategy/position-strategy-fixture-adapters.ts",
    "services/position-strategy/price-verification.ts",
    "services/position-strategy/holding-defense-tracker.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V24 (spec-only).`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7e. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "use-cases/war-room/build-war-room-read-model-contract.ts",
    "use-cases/war-room/war-room-engine-fixture-adapters.ts",
    "components/war-room-dashboard.tsx",
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
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const contractCheck = checkTerms("contract_checks", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const constantCheck = checkConstants();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const negationCheck = checkNegationContext(docBody);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  constantCheck,
  pkgCheck,
  readmeCheck,
  negationCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: PositionStrategySpecSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, TECH_DOC_REL, READ_MODEL_DOC_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    constant_checks: constantCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    negation_context: negationCheck.status,
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
