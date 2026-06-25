/**
 * Runtime Data Pipeline Spec Validator — V28
 *
 * Spec-only, local file-system + constant-import check. Does NOT start a Next.js
 * server, make any HTTP request, connect to Supabase, read env keys, write data,
 * or create a runtime. It only reads files, imports static contract constants,
 * and inspects their contents.
 *
 * Safety scanning for forbidden runtime tokens (including concrete data-source
 * names) is applied ONLY to the contract code file (comment-stripped).
 * Documentation may legitimately mention TWSE / TPEx / Yahoo / FinMind /
 * TradingView / yfinance-like as governance notes, so docs are NOT scanned for
 * those source names.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/runtime-data/runtime-data-pipeline-contract") as typeof import("../use-cases/runtime-data/runtime-data-pipeline-contract");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface RuntimePipelineSpecSummary {
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/runtime-data-pipeline-spec.md";
const CONTRACT_REL = "use-cases/runtime-data/runtime-data-pipeline-contract.ts";
const POOL_DOC_REL = "docs/dynamic-opportunity-price-verification-spec.md";
const HDT_DOC_REL = "docs/holding-defense-tracker-api-contract.md";
const POSITION_DOC_REL = "docs/position-strategy-plan-spec.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Runtime Data Pipeline Spec (new)", rel: DOC_REL },
    { label: "Runtime Data Pipeline contract (new)", rel: CONTRACT_REL },
    { label: "Dynamic Opportunity Pool & Price Verification Spec", rel: POOL_DOC_REL },
    { label: "Holding Defense Tracker API Contract doc", rel: HDT_DOC_REL },
    { label: "Position Strategy Plan Spec", rel: POSITION_DOC_REL },
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
  "Runtime Data Pipeline Spec",
  "V28 不接真資料",
  "V28 不建立 runtime",
  "V28 不寫資料",
  "SOURCE_DISCOVERY",
  "SOURCE_AUTHORIZATION_CHECK",
  "RAW_INGESTION",
  "NORMALIZATION",
  "PRICE_VERIFICATION",
  "FRESHNESS_CHECK",
  "SOURCE_CONFLICT_CHECK",
  "DATA_QUALITY_GATE",
  "READ_MODEL_PROJECTION",
  "CONSUMER_DELIVERY",
  "PRODUCTION_WRITE_BLOCKED",
  "OFFICIAL_OR_LICENSED",
  "BROKER_OR_AUTHORIZED",
  "VALIDATED_SECONDARY",
  "FALLBACK_CACHE",
  "MANUAL_VERIFIED",
  "NOT_AVAILABLE",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 時降級為 WARNING / DATA_INSUFFICIENT",
  "資料不足就顯示資料不足",
  "Runtime Data Pipeline 不是自動交易系統",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V29 Runtime Pilot",
  "V30 Intraday Holding Defense Runtime",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "RuntimeSourcePriority",
  "RuntimePipelineStage",
  "RuntimePriceVerificationStatus",
  "RuntimeFreshnessStatus",
  "RuntimeSourceConflictStatus",
  "RuntimeDataQualityStatus",
  "RuntimeSourceConfidence",
  "RuntimeConsumerType",
  "RuntimePilotReadinessStatus",
  "RuntimeSourcePolicy",
  "RuntimePriceVerificationSnapshot",
  "RuntimePipelineGuardResult",
  "RuntimeConsumerDeliveryRule",
  "RuntimePilotReadinessChecklist",
  "RuntimeDataPipelineContractBundle",
  "RUNTIME_DATA_PIPELINE_CONTRACT_VERSION",
  "RUNTIME_DATA_PIPELINE_ALLOWED_STAGES",
  "RUNTIME_DATA_PIPELINE_SOURCE_PRIORITY",
  "RUNTIME_DATA_PIPELINE_DATA_QUALITY_STATUSES",
  "RUNTIME_DATA_PIPELINE_SAFETY_LABELS",
  "RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS",
  "OFFICIAL_OR_LICENSED",
  "BROKER_OR_AUTHORIZED",
  "VALIDATED_SECONDARY",
  "FALLBACK_CACHE",
  "MANUAL_VERIFIED",
  "NOT_AVAILABLE",
  "SOURCE_DISCOVERY",
  "SOURCE_AUTHORIZATION_CHECK",
  "RAW_INGESTION",
  "NORMALIZATION",
  "PRICE_VERIFICATION",
  "FRESHNESS_CHECK",
  "SOURCE_CONFLICT_CHECK",
  "DATA_QUALITY_GATE",
  "READ_MODEL_PROJECTION",
  "CONSUMER_DELIVERY",
  "PRODUCTION_WRITE_BLOCKED",
  "priceVerified",
  "isPrecisePriceAllowed",
  "dangerAlertAllowed",
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
    RUNTIME_DATA_PIPELINE_CONTRACT_VERSION,
    RUNTIME_DATA_PIPELINE_ALLOWED_STAGES,
    RUNTIME_DATA_PIPELINE_SOURCE_PRIORITY,
    RUNTIME_DATA_PIPELINE_DATA_QUALITY_STATUSES,
    RUNTIME_DATA_PIPELINE_SAFETY_LABELS,
    RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS,
  } = contractModule;

  if (RUNTIME_DATA_PIPELINE_CONTRACT_VERSION === "V28") {
    details.push('PASS  RUNTIME_DATA_PIPELINE_CONTRACT_VERSION === "V28".');
  } else {
    issues.push(
      `FAIL  RUNTIME_DATA_PIPELINE_CONTRACT_VERSION === ${JSON.stringify(RUNTIME_DATA_PIPELINE_CONTRACT_VERSION)}, expected "V28".`,
    );
  }

  if (RUNTIME_DATA_PIPELINE_ALLOWED_STAGES.length >= 11) {
    details.push(
      `PASS  RUNTIME_DATA_PIPELINE_ALLOWED_STAGES length = ${RUNTIME_DATA_PIPELINE_ALLOWED_STAGES.length} (>= 11).`,
    );
  } else {
    issues.push(
      `FAIL  RUNTIME_DATA_PIPELINE_ALLOWED_STAGES length = ${RUNTIME_DATA_PIPELINE_ALLOWED_STAGES.length}, expected >= 11.`,
    );
  }

  const expectedPriority = [
    "OFFICIAL_OR_LICENSED",
    "BROKER_OR_AUTHORIZED",
    "VALIDATED_SECONDARY",
    "FALLBACK_CACHE",
    "MANUAL_VERIFIED",
    "NOT_AVAILABLE",
  ];
  const actualPriority = Array.from(RUNTIME_DATA_PIPELINE_SOURCE_PRIORITY);
  const orderMatches =
    actualPriority.length === expectedPriority.length &&
    expectedPriority.every((p, i) => actualPriority[i] === p);
  if (orderMatches) {
    details.push("PASS  RUNTIME_DATA_PIPELINE_SOURCE_PRIORITY order is exactly correct.");
  } else {
    issues.push(
      `FAIL  RUNTIME_DATA_PIPELINE_SOURCE_PRIORITY order is ${JSON.stringify(actualPriority)}, expected ${JSON.stringify(expectedPriority)}.`,
    );
  }

  const requiredStatuses = [
    "PASS",
    "WARNING",
    "FAIL",
    "DATA_INSUFFICIENT",
    "PRICE_NOT_VERIFIED",
    "SOURCE_CONFLICT",
    "STALE_DATA",
    "FALLBACK_ONLY",
    "NOT_COVERED",
  ];
  for (const s of requiredStatuses) {
    if (RUNTIME_DATA_PIPELINE_DATA_QUALITY_STATUSES.includes(s as never)) {
      details.push(`PASS  RUNTIME_DATA_PIPELINE_DATA_QUALITY_STATUSES includes "${s}".`);
    } else {
      issues.push(`FAIL  RUNTIME_DATA_PIPELINE_DATA_QUALITY_STATUSES missing "${s}".`);
    }
  }

  const requiredLabels = [
    "不自動下單",
    "不產生買賣指令",
    "不替代投資判斷",
    "Runtime Data Pipeline 不是自動交易系統",
    "V28 不接真資料",
    "V28 不建立 runtime",
    "V28 不寫資料",
    "priceVerified = false 時不得輸出精準價位",
    "fallback-only data 不得觸發 DANGER",
    "stale data 不得觸發 DANGER",
    "source conflict 時降級為 WARNING / DATA_INSUFFICIENT",
    "資料不足就顯示資料不足",
  ];
  for (const label of requiredLabels) {
    if (RUNTIME_DATA_PIPELINE_SAFETY_LABELS.includes(label as never)) {
      details.push(`PASS  RUNTIME_DATA_PIPELINE_SAFETY_LABELS includes "${label}".`);
    } else {
      issues.push(`FAIL  RUNTIME_DATA_PIPELINE_SAFETY_LABELS missing "${label}".`);
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
    "自動交易",
  ];
  for (const term of requiredDisallowed) {
    if (RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS.includes(term as never)) {
      details.push(`PASS  RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS includes "${term}".`);
    } else {
      issues.push(`FAIL  RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS missing "${term}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "constant_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:runtime-data-pipeline-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-runtime-data-pipeline-spec.ts"',
];

const README_TERMS: string[] = [
  "V28",
  "Runtime Data Pipeline Spec",
  "docs/runtime-data-pipeline-spec.md",
  "use-cases/runtime-data/runtime-data-pipeline-contract.ts",
  "npm run test:runtime-data-pipeline-spec",
  "SOURCE_DISCOVERY",
  "PRICE_VERIFICATION",
  "FRESHNESS_CHECK",
  "SOURCE_CONFLICT_CHECK",
  "DATA_QUALITY_GATE",
  "PRODUCTION_WRITE_BLOCKED",
  "OFFICIAL_OR_LICENSED",
  "BROKER_OR_AUTHORIZED",
  "VALIDATED_SECONDARY",
  "FALLBACK_CACHE",
  "priceVerified",
  "stale guard",
  "source conflict downgrade",
  "fallback-only data 不得觸發 DANGER",
  "V28 不接真資料",
  "V28 不建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 API route",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 6: Negation-context checks (doc prose)
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

  const { RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS } = contractModule;
  for (const term of RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS) {
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

const CONTRACT_FORBIDDEN_TOKENS: Array<{ token: string; label: string }> = [
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
  // Concrete data-source names must not appear in the contract code.
  { token: "twse", label: "TWSE source name" },
  { token: "tpex", label: "TPEx source name" },
  { token: "yahoo", label: "Yahoo source name" },
  { token: "finmind", label: "FinMind source name" },
  { token: "tradingview", label: "TradingView source name" },
  { token: "yfinance", label: "yfinance source name" },
  { token: "factset", label: "FactSet source name" },
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 7a. Contract code file: strict scan (comment-stripped).
  const contract = readFile(resolve(CONTRACT_REL));
  if (contract == null) {
    issues.push(`FAIL  Cannot read ${CONTRACT_REL}.`);
  } else {
    const lower = stripComments(contract).toLowerCase();
    for (const { token, label } of CONTRACT_FORBIDDEN_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden "${label}" found in ${CONTRACT_REL}.`);
      } else {
        details.push(`PASS  No "${label}" in ${CONTRACT_REL} code.`);
      }
    }
  }

  // 7b. No new SQL migration for runtime-data pipeline.
  const forbiddenMigrations = [
    "supabase/runtime_data_pipeline.sql",
    "supabase/v28_runtime_data.sql",
    "supabase/runtime_pipeline.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V28.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7c. No new API route / UI component for runtime-data pipeline.
  const forbiddenArtifacts = [
    "app/api/runtime-data/route.ts",
    "app/api/runtime-pipeline/route.ts",
    "components/runtime-data-pipeline.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V28.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7d. No runtime adapter / scanner / quote-polling / scheduler / crawler.
  const forbiddenRuntime = [
    "use-cases/runtime-data/build-runtime-data-pipeline.ts",
    "services/runtime-data/quote-poller.ts",
    "services/runtime-data/scheduler.ts",
    "services/runtime-data/crawler.ts",
    "services/runtime-data/broker-connector.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V28 (spec-only).`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7e. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "components/war-room-dashboard.tsx",
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

const summary: RuntimePipelineSpecSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, POOL_DOC_REL, HDT_DOC_REL, POSITION_DOC_REL, README_REL, PKG_REL],
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
