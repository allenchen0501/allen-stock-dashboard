/**
 * Dynamic Opportunity Pool & Price Verification Spec Validator — V25
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

const contractModule = require("../use-cases/opportunity-pool/dynamic-opportunity-pool-contract") as typeof import("../use-cases/opportunity-pool/dynamic-opportunity-pool-contract");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface DynamicOpportunitySpecSummary {
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
 * character in the preceding window. Used to ensure command-list words only ever
 * appear in a negated/safety context (e.g. 「不是買進清單」/「不是賣出指令」).
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

const DOC_REL = "docs/dynamic-opportunity-price-verification-spec.md";
const CONTRACT_REL = "use-cases/opportunity-pool/dynamic-opportunity-pool-contract.ts";
const POSITION_DOC_REL = "docs/position-strategy-plan-spec.md";
const TECH_DOC_REL = "docs/technical-risk-reward-strategy-spec.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Dynamic Opportunity Pool & Price Verification Spec (new)", rel: DOC_REL },
    { label: "Dynamic Opportunity Pool Contract (new)", rel: CONTRACT_REL },
    { label: "Position Strategy Plan Spec", rel: POSITION_DOC_REL },
    { label: "Technical + Risk Reward Strategy Spec", rel: TECH_DOC_REL },
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
  "Dynamic Opportunity Pool & Price Verification Spec",
  "MAIN_UPTREND_POOL",
  "BREAKOUT_PREP_POOL",
  "HOLDING_PRIORITY_POOL",
  "DAILY_WATCH_POOL",
  "LOW_COVERAGE_POOL",
  "NO_TOUCH_POOL",
  "SECTOR_ROTATION_POOL",
  "DATA_INSUFFICIENT_POOL",
  "A_MAIN_UPTREND",
  "B_HOLDING_PRIORITY",
  "C_DAILY_WATCH",
  "D_LOW_COVERAGE",
  "priceVerified",
  "PriceVerificationStatus",
  "OFFICIAL_OR_LICENSED",
  "BROKER_OR_AUTHORIZED",
  "VALIDATED_SECONDARY",
  "FALLBACK_CACHE",
  "MANUAL_VERIFIED",
  "NOT_AVAILABLE",
  "priceVerified = false",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 時降級為 WARNING / DATA_INSUFFICIENT",
  "主升段候選不是買進清單",
  "飆股預備隊不是追價清單",
  "禁碰池是風控提醒，不是賣出指令",
  "主流產業池不是買進清單",
  "高風報比不是買進指令",
  "資料不足就顯示資料不足",
  "War Room 仍是 read model",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks (text presence)
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "DynamicOpportunityPoolType",
  "OpportunityProcessingTier",
  "OpportunityDataQualityStatus",
  "OpportunityPriceVerificationStatus",
  "PriceSourcePriority",
  "PriceFreshnessStatus",
  "SourceConfidenceLevel",
  "SectorRotationStatus",
  "PriceVerificationRecord",
  "DynamicOpportunityPoolItem",
  "SectorRotationPoolItem",
  "DynamicOpportunityPoolBundle",
  "DYNAMIC_OPPORTUNITY_CONTRACT_VERSION",
  "DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES",
  "DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS",
  "DYNAMIC_OPPORTUNITY_PRICE_SOURCE_PRIORITY",
  "DYNAMIC_OPPORTUNITY_SAFETY_LABELS",
  "DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS",
  "MAIN_UPTREND_POOL",
  "BREAKOUT_PREP_POOL",
  "HOLDING_PRIORITY_POOL",
  "DAILY_WATCH_POOL",
  "LOW_COVERAGE_POOL",
  "NO_TOUCH_POOL",
  "SECTOR_ROTATION_POOL",
  "DATA_INSUFFICIENT_POOL",
  "A_MAIN_UPTREND",
  "B_HOLDING_PRIORITY",
  "C_DAILY_WATCH",
  "D_LOW_COVERAGE",
  "OFFICIAL_OR_LICENSED",
  "BROKER_OR_AUTHORIZED",
  "VALIDATED_SECONDARY",
  "FALLBACK_CACHE",
  "MANUAL_VERIFIED",
  "NOT_AVAILABLE",
  "priceVerified",
  "priceVerificationStatus",
  "priceSourcePriority",
  "priceFreshness",
  "sourceConfidence",
  "isPrecisePriceAllowed",
  "entryObservationZoneAllowed",
  "invalidLevelAllowed",
  "targetObservationZoneAllowed",
  "riskRewardCalculationAllowed",
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
    DYNAMIC_OPPORTUNITY_CONTRACT_VERSION,
    DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES,
    DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS,
    DYNAMIC_OPPORTUNITY_PRICE_SOURCE_PRIORITY,
    DYNAMIC_OPPORTUNITY_SAFETY_LABELS,
    DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS,
  } = contractModule;

  if (DYNAMIC_OPPORTUNITY_CONTRACT_VERSION === "V25") {
    details.push('PASS  DYNAMIC_OPPORTUNITY_CONTRACT_VERSION === "V25".');
  } else {
    issues.push(
      `FAIL  DYNAMIC_OPPORTUNITY_CONTRACT_VERSION === ${JSON.stringify(DYNAMIC_OPPORTUNITY_CONTRACT_VERSION)}, expected "V25".`,
    );
  }

  if (DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES.length >= 8) {
    details.push(
      `PASS  DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES length = ${DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES.length} (>= 8).`,
    );
  } else {
    issues.push(
      `FAIL  DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES length = ${DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES.length}, expected >= 8.`,
    );
  }

  if (DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS.length >= 6) {
    details.push(
      `PASS  DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS length = ${DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS.length} (>= 6).`,
    );
  } else {
    issues.push(
      `FAIL  DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS length = ${DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS.length}, expected >= 6.`,
    );
  }

  // Price source priority must be in exact order.
  const expectedPriority = [
    "OFFICIAL_OR_LICENSED",
    "BROKER_OR_AUTHORIZED",
    "VALIDATED_SECONDARY",
    "FALLBACK_CACHE",
    "MANUAL_VERIFIED",
    "NOT_AVAILABLE",
  ];
  const actualPriority = Array.from(DYNAMIC_OPPORTUNITY_PRICE_SOURCE_PRIORITY);
  const orderMatches =
    actualPriority.length === expectedPriority.length &&
    expectedPriority.every((p, i) => actualPriority[i] === p);
  if (orderMatches) {
    details.push("PASS  DYNAMIC_OPPORTUNITY_PRICE_SOURCE_PRIORITY order is exactly correct.");
  } else {
    issues.push(
      `FAIL  DYNAMIC_OPPORTUNITY_PRICE_SOURCE_PRIORITY order is ${JSON.stringify(actualPriority)}, expected ${JSON.stringify(expectedPriority)}.`,
    );
  }

  const requiredLabels = [
    "不自動下單",
    "不產生買賣指令",
    "不替代投資判斷",
    "主升段候選不是買進清單",
    "飆股預備隊不是追價清單",
    "禁碰池是風控提醒，不是賣出指令",
    "主流產業池不是買進清單",
    "高風報比不是買進指令",
    "priceVerified = false 時不得輸出精準價位",
    "fallback-only data 不得觸發 DANGER",
    "stale data 不得觸發 DANGER",
    "資料不足就顯示資料不足",
  ];
  for (const label of requiredLabels) {
    if (DYNAMIC_OPPORTUNITY_SAFETY_LABELS.includes(label as never)) {
      details.push(`PASS  DYNAMIC_OPPORTUNITY_SAFETY_LABELS includes "${label}".`);
    } else {
      issues.push(`FAIL  DYNAMIC_OPPORTUNITY_SAFETY_LABELS missing "${label}".`);
    }
  }

  const requiredDisallowed = [
    "強力買進",
    "必買",
    "必賣",
    "立即進場",
    "立即出場",
    "自動下單",
    "保證獲利",
    "追價清單",
  ];
  for (const term of requiredDisallowed) {
    if (DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS.includes(term as never)) {
      details.push(`PASS  DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS includes "${term}".`);
    } else {
      issues.push(`FAIL  DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS missing "${term}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "constant_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:dynamic-opportunity-price-verification-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-dynamic-opportunity-price-verification-spec.ts"',
];

const README_TERMS: string[] = [
  "V25",
  "Dynamic Opportunity Pool",
  "Price Verification Spec",
  "docs/dynamic-opportunity-price-verification-spec.md",
  "use-cases/opportunity-pool/dynamic-opportunity-pool-contract.ts",
  "npm run test:dynamic-opportunity-price-verification-spec",
  "MAIN_UPTREND_POOL",
  "BREAKOUT_PREP_POOL",
  "HOLDING_PRIORITY_POOL",
  "DAILY_WATCH_POOL",
  "LOW_COVERAGE_POOL",
  "NO_TOUCH_POOL",
  "SECTOR_ROTATION_POOL",
  "A/B/C/D",
  "priceVerified",
  "PriceVerificationStatus",
  "official / licensed / secondary / fallback",
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

  // Command-list words must only ever appear in a negated/safety context.
  const commandWords = ["買進清單", "賣出指令", "買進指令", "追價清單"];
  for (const word of commandWords) {
    if (hasNonNegatedOccurrence(docBody, word)) {
      issues.push(`FAIL  "${word}" appears in a non-negated context in ${DOC_REL}.`);
    } else {
      details.push(`PASS  "${word}" only appears in negated/safety context.`);
    }
  }

  // Imperative command / guarantee terms must not appear as advice (negation
  // tolerated, e.g. 「不自動下單」/「不是保證獲利模型」).
  const { DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS } = contractModule;
  for (const term of DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS) {
    if (hasNonNegatedOccurrence(docBody, term)) {
      issues.push(`FAIL  Disallowed term "${term}" appears non-negated in ${DOC_REL}.`);
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

  // 7b. No new SQL migration for dynamic opportunity pool.
  const forbiddenMigrations = [
    "supabase/dynamic_opportunity.sql",
    "supabase/v25_dynamic_opportunity.sql",
    "supabase/opportunity_pool.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V25.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7c. No new API route / UI component for dynamic opportunity pool.
  const forbiddenArtifacts = [
    "app/api/opportunity-pool/route.ts",
    "app/api/dynamic-opportunity/route.ts",
    "app/api/price-verification/route.ts",
    "app/opportunity-pool/page.tsx",
    "components/opportunity-pool.tsx",
    "components/dynamic-opportunity-pool.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V25.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7d. No opportunity-pool runtime / scanner / price-verification runtime.
  const forbiddenRuntime = [
    "use-cases/opportunity-pool/build-dynamic-opportunity-pool.ts",
    "use-cases/opportunity-pool/opportunity-pool-fixture-adapters.ts",
    "services/opportunity-pool/scanner.ts",
    "services/opportunity-pool/price-verification.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V25 (spec-only).`);
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
    "use-cases/position-strategy/position-strategy-plan-contract.ts",
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

const summary: DynamicOpportunitySpecSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, POSITION_DOC_REL, TECH_DOC_REL, README_REL, PKG_REL],
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
