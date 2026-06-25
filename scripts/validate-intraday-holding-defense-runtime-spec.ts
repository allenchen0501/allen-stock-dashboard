/**
 * Intraday Holding Defense Runtime Spec Validator — V30
 *
 * Spec-only, local file-system + constant-import check. Does NOT start a Next.js
 * server, make any HTTP request, connect to Supabase, read env keys, write data,
 * or create a runtime. It only reads files, imports static contract constants,
 * and inspects their contents.
 *
 * Safety scanning for forbidden runtime tokens (including concrete data-source
 * names) is applied ONLY to the contract code file (comment-stripped).
 * Documentation may legitimately mention concrete source names as governance
 * notes, so docs are NOT scanned for those source names.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/intraday-defense/intraday-holding-defense-runtime-contract") as typeof import("../use-cases/intraday-defense/intraday-holding-defense-runtime-contract");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface IntradayDefenseSpecSummary {
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

const DOC_REL = "docs/intraday-holding-defense-runtime-spec.md";
const CONTRACT_REL = "use-cases/intraday-defense/intraday-holding-defense-runtime-contract.ts";
const PIPELINE_DOC_REL = "docs/runtime-data-pipeline-spec.md";
const UI_DOC_REL = "docs/holding-defense-tracker-ui-integration.md";
const HDT_DOC_REL = "docs/holding-defense-tracker-api-contract.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Intraday Holding Defense Runtime Spec (new)", rel: DOC_REL },
    { label: "Intraday Holding Defense Runtime contract (new)", rel: CONTRACT_REL },
    { label: "Runtime Data Pipeline Spec", rel: PIPELINE_DOC_REL },
    { label: "Holding Defense Tracker UI Integration doc", rel: UI_DOC_REL },
    { label: "Holding Defense Tracker API Contract doc", rel: HDT_DOC_REL },
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
  "Intraday Holding Defense Runtime Spec",
  "V30 不接真資料",
  "V30 不建立 runtime",
  "V30 不寫資料",
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "INVALID_LEVEL_APPROACHING",
  "INVALID_LEVEL_BREACHED",
  "PROFIT_GIVEBACK_WARNING",
  "RISK_REDUCTION_WATCH",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "PRICE_NOT_VERIFIED",
  "STALE_DATA",
  "SOURCE_CONFLICT",
  "FALLBACK_ONLY",
  "DATA_INSUFFICIENT",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "priceVerified = false 時不得輸出精準價位",
  "cooldown",
  "dedup",
  "dry-run",
  "no-write",
  "kill switch",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V31 Runtime Pilot",
  "V32 Intraday Holding Defense Runtime",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "IntradayHoldingDefenseState",
  "IntradayHoldingDefenseAlertLevel",
  "IntradayHoldingDefenseRuntimeMode",
  "IntradayHoldingDefenseTriggerType",
  "IntradayHoldingDefenseCooldownPolicy",
  "IntradayHoldingDefenseDedupRecord",
  "IntradayHoldingDefenseTriggerRule",
  "IntradayHoldingDefenseAlertItem",
  "IntradayHoldingDefenseRuntimeReadinessChecklist",
  "IntradayHoldingDefenseRuntimeSpecBundle",
  "INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION",
  "INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES",
  "INTRADAY_HOLDING_DEFENSE_ALLOWED_ALERT_LEVELS",
  "INTRADAY_HOLDING_DEFENSE_TRIGGER_TYPES",
  "INTRADAY_HOLDING_DEFENSE_SAFETY_LABELS",
  "INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS",
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "INVALID_LEVEL_APPROACHING",
  "INVALID_LEVEL_BREACHED",
  "PROFIT_GIVEBACK_WARNING",
  "RISK_REDUCTION_WATCH",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "PRICE_NOT_VERIFIED",
  "STALE_DATA",
  "SOURCE_CONFLICT",
  "FALLBACK_ONLY",
  "DATA_INSUFFICIENT",
  "cooldownEnabled",
  "dedupEnabled",
  "duplicateSuppressed",
  "cooldownRemainingSeconds",
  "nextAllowedAlertAt",
  "blocksDangerWhenFallbackOnly",
  "blocksDangerWhenStale",
  "blocksDangerWhenSourceConflict",
  "priceVerified",
  "takeProfitZone",
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
    INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION,
    INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES,
    INTRADAY_HOLDING_DEFENSE_ALLOWED_ALERT_LEVELS,
    INTRADAY_HOLDING_DEFENSE_TRIGGER_TYPES,
    INTRADAY_HOLDING_DEFENSE_SAFETY_LABELS,
    INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS,
  } = contractModule;

  if (INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION === "V30") {
    details.push('PASS  INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION === "V30".');
  } else {
    issues.push(
      `FAIL  INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION === ${JSON.stringify(INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION)}, expected "V30".`,
    );
  }

  if (INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES.length >= 14) {
    details.push(
      `PASS  INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES length = ${INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES.length} (>= 14).`,
    );
  } else {
    issues.push(
      `FAIL  INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES length = ${INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES.length}, expected >= 14.`,
    );
  }

  const requiredLevels = ["INFO", "WATCH", "WARNING", "DANGER", "DATA_INSUFFICIENT"];
  for (const lv of requiredLevels) {
    if (INTRADAY_HOLDING_DEFENSE_ALLOWED_ALERT_LEVELS.includes(lv as never)) {
      details.push(`PASS  INTRADAY_HOLDING_DEFENSE_ALLOWED_ALERT_LEVELS includes "${lv}".`);
    } else {
      issues.push(`FAIL  INTRADAY_HOLDING_DEFENSE_ALLOWED_ALERT_LEVELS missing "${lv}".`);
    }
  }

  const requiredTriggers = [
    "DEFENSE_ZONE_APPROACH",
    "DEFENSE_ZONE_BREACH",
    "INVALID_LEVEL_APPROACH",
    "INVALID_LEVEL_BREACH",
    "PROFIT_GIVEBACK",
    "FAST_DROP",
    "TREND_BREAK",
    "DATA_QUALITY_DOWNGRADE",
    "RECOVERY_CONDITION",
  ];
  for (const t of requiredTriggers) {
    if (INTRADAY_HOLDING_DEFENSE_TRIGGER_TYPES.includes(t as never)) {
      details.push(`PASS  INTRADAY_HOLDING_DEFENSE_TRIGGER_TYPES includes "${t}".`);
    } else {
      issues.push(`FAIL  INTRADAY_HOLDING_DEFENSE_TRIGGER_TYPES missing "${t}".`);
    }
  }

  const requiredLabels = [
    "不自動下單",
    "不產生買賣指令",
    "不替代投資判斷",
    "Intraday Holding Defense Runtime 不是自動交易系統",
    "V30 不接真資料",
    "V30 不建立 runtime",
    "V30 不寫資料",
    "防守區是防守觀察，不是自動出場",
    "invalidLevel 不是自動停損價",
    "takeProfitZone 不是賣出價",
    "風險降低觀察不是賣出指令",
    "FAST_DROP_WARNING 不是賣出指令",
    "fallback-only data 不得觸發 DANGER",
    "stale data 不得觸發 DANGER",
    "source conflict 不得觸發 DANGER",
    "資料不足就顯示資料不足",
  ];
  for (const label of requiredLabels) {
    if (INTRADAY_HOLDING_DEFENSE_SAFETY_LABELS.includes(label as never)) {
      details.push(`PASS  INTRADAY_HOLDING_DEFENSE_SAFETY_LABELS includes "${label}".`);
    } else {
      issues.push(`FAIL  INTRADAY_HOLDING_DEFENSE_SAFETY_LABELS missing "${label}".`);
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
    "自動停損",
  ];
  for (const term of requiredDisallowed) {
    if (INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS.includes(term as never)) {
      details.push(`PASS  INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS includes "${term}".`);
    } else {
      issues.push(`FAIL  INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS missing "${term}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "constant_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:intraday-holding-defense-runtime-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-intraday-holding-defense-runtime-spec.ts"',
];

const README_TERMS: string[] = [
  "V30",
  "Intraday Holding Defense Runtime Spec",
  "docs/intraday-holding-defense-runtime-spec.md",
  "use-cases/intraday-defense/intraday-holding-defense-runtime-contract.ts",
  "npm run test:intraday-holding-defense-runtime-spec",
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "INVALID_LEVEL_BREACHED",
  "PROFIT_GIVEBACK_WARNING",
  "RISK_REDUCTION_WATCH",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "cooldown",
  "dedup",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "V30 不接真資料",
  "V30 不建立 runtime",
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

  // Dangerous phrases must only appear inside a negation/safety context.
  const negationRequired = ["自動出場", "自動停損", "賣出價"];
  for (const term of negationRequired) {
    if (hasNonNegatedOccurrence(docBody, term)) {
      issues.push(`FAIL  "${term}" appears in a non-negated context in ${DOC_REL}.`);
    } else {
      details.push(`PASS  "${term}" only appears in negated/safety context.`);
    }
  }

  const { INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS } = contractModule;
  for (const term of INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS) {
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
  { token: "twse", label: "TWSE source name" },
  { token: "tpex", label: "TPEx source name" },
  { token: "yahoo", label: "Yahoo source name" },
  { token: "finmind", label: "FinMind source name" },
  { token: "tradingview", label: "TradingView source name" },
  { token: "yfinance", label: "yfinance source name" },
  { token: "factset", label: "FactSet source name" },
  { token: "broker", label: "broker source name" },
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

  // 7b. No new SQL migration for intraday defense.
  const forbiddenMigrations = [
    "supabase/intraday_holding_defense.sql",
    "supabase/v30_intraday_defense.sql",
    "supabase/intraday_defense.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V30.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7c. No new API route / UI component for intraday defense.
  // Note: app/api/portfolio/intraday-defense/route.ts was sanctioned in V31
  // (Intraday Defense Fixture API) and is validated by
  // scripts/validate-intraday-defense-fixture-api.ts, so it is no longer
  // forbidden here. It returns a fixture-only mock_or_contract payload (no
  // Supabase / no external fetch / no runtime / no buy-sell command).
  const forbiddenArtifacts = [
    "app/api/intraday-defense/route.ts",
    "components/intraday-holding-defense.tsx",
    "components/intraday-defense.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V30.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7d. No intraday-defense runtime / quote-polling / scheduler / crawler.
  const forbiddenRuntime = [
    "use-cases/intraday-defense/build-intraday-holding-defense-runtime.ts",
    "services/intraday-defense/quote-poller.ts",
    "services/intraday-defense/scheduler.ts",
    "services/intraday-defense/crawler.ts",
    "services/intraday-defense/broker-connector.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V30 (spec-only).`);
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
    "components/holding-defense-tracker.tsx",
    "components/war-room-dashboard.tsx",
    "use-cases/runtime-data/runtime-data-pipeline-contract.ts",
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

const summary: IntradayDefenseSpecSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, PIPELINE_DOC_REL, UI_DOC_REL, HDT_DOC_REL, README_REL, PKG_REL],
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
