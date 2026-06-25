/**
 * Runtime Pilot Readiness Checklist Validator — V33
 *
 * Spec-only check. Imports the pure builder + static constants and inspects the
 * payload shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, write data, or create a runtime.
 *
 * Safety scanning for forbidden runtime tokens (including concrete data-source
 * names) is applied ONLY to the contract + builder code files (comment-stripped).
 * Documentation may legitimately mention concrete source names as governance
 * notes, so docs are NOT scanned for those source names.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/runtime-pilot/runtime-pilot-readiness-contract") as typeof import("../use-cases/runtime-pilot/runtime-pilot-readiness-contract");
const builderModule = require("../use-cases/runtime-pilot/build-runtime-pilot-readiness-contract") as typeof import("../use-cases/runtime-pilot/build-runtime-pilot-readiness-contract");
const { buildRuntimePilotReadinessContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface RuntimePilotSummary {
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

const DOC_REL = "docs/runtime-pilot-readiness-checklist.md";
const CONTRACT_REL = "use-cases/runtime-pilot/runtime-pilot-readiness-contract.ts";
const BUILDER_REL = "use-cases/runtime-pilot/build-runtime-pilot-readiness-contract.ts";
const PIPELINE_DOC_REL = "docs/runtime-data-pipeline-spec.md";
const INTRADAY_DOC_REL = "docs/intraday-holding-defense-runtime-spec.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Runtime Pilot Readiness Checklist doc (new)", rel: DOC_REL },
    { label: "Runtime Pilot Readiness contract (new)", rel: CONTRACT_REL },
    { label: "Runtime Pilot Readiness builder (new)", rel: BUILDER_REL },
    { label: "Runtime Data Pipeline Spec doc", rel: PIPELINE_DOC_REL },
    { label: "Intraday Holding Defense Runtime Spec doc", rel: INTRADAY_DOC_REL },
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
  "Runtime Pilot Readiness Checklist",
  "V33 不接真資料",
  "V33 不建立 runtime",
  "V33 不寫資料",
  "SOURCE_AUTHORIZATION",
  "SOURCE_LEGAL_STATUS",
  "RATE_LIMIT_POLICY",
  "MARKET_SESSION_HANDLING",
  "TIMESTAMP_NORMALIZATION",
  "STALE_GUARD",
  "SOURCE_CONFLICT_THRESHOLD",
  "FALLBACK_DOWNGRADE",
  "NO_DANGER_GUARD",
  "DRY_RUN_MODE",
  "NO_WRITE_GUARD",
  "AUDIT_LOG_SHAPE",
  "ROLLBACK_PLAN",
  "KILL_SWITCH",
  "BUY_SELL_COMMAND_BLOCK",
  "PRODUCTION_WRITE_BLOCKED",
  "GO_DRY_RUN",
  "NO_GO",
  "production write 一律 BLOCKED",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "GO_DRY_RUN 不是 production",
  "GO_DRY_RUN 不代表可寫資料",
  "GO_DRY_RUN 不代表產生買賣指令",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V34 Runtime Pilot Dry-Run",
  "V35 Runtime Pilot UI / Monitoring",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "RuntimePilotReadinessGateId",
  "RuntimePilotGateSeverity",
  "RuntimePilotGateStatus",
  "RuntimePilotDecision",
  "RuntimePilotFeatureArea",
  "RuntimePilotReadinessGate",
  "RuntimePilotReadinessDecisionSummary",
  "RuntimePilotAuditLogShape",
  "RuntimePilotRollbackPlanShape",
  "RuntimePilotKillSwitchShape",
  "RuntimePilotReadinessBundle",
  "RUNTIME_PILOT_READINESS_CONTRACT_VERSION",
  "RUNTIME_PILOT_READINESS_ALLOWED_GATES",
  "RUNTIME_PILOT_READINESS_CRITICAL_GATES",
  "RUNTIME_PILOT_READINESS_ALLOWED_DECISIONS",
  "RUNTIME_PILOT_READINESS_SAFETY_LABELS",
  "RUNTIME_PILOT_READINESS_DISALLOWED_TERMS",
  "SOURCE_AUTHORIZATION",
  "STALE_GUARD",
  "NO_DANGER_GUARD",
  "DRY_RUN_MODE",
  "NO_WRITE_GUARD",
  "KILL_SWITCH",
  "BUY_SELL_COMMAND_BLOCK",
  "PRODUCTION_WRITE_BLOCKED",
  "GO_DRY_RUN",
  "NO_GO",
  "auditId",
  "rollbackId",
  "killSwitchId",
  "dryRunModeRequired: true",
  "noWriteModeRequired: true",
  "productionWriteAllowed: false",
  "buySellCommandGenerationBlocked: true",
  "notTradeAdviceAlwaysTrue: true",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Builder checks
// ---------------------------------------------------------------------------

const BUILDER_TERMS: string[] = [
  "buildRuntimePilotReadinessContract",
  "2026-06-23T00:00:00.000Z",
  "NO_GO",
  "spec_only",
  "V33",
  "gates",
  "decisionSummary",
  "auditLogShape",
  "rollbackPlanShape",
  "killSwitchShape",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
];

const BUILDER_FORBIDDEN: string[] = ["Date.now", "new Date"];

// ---------------------------------------------------------------------------
// Gate 5: Constant value checks (import + validate)
// ---------------------------------------------------------------------------

function checkConstants(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const {
    RUNTIME_PILOT_READINESS_CONTRACT_VERSION,
    RUNTIME_PILOT_READINESS_ALLOWED_GATES,
    RUNTIME_PILOT_READINESS_CRITICAL_GATES,
    RUNTIME_PILOT_READINESS_ALLOWED_DECISIONS,
    RUNTIME_PILOT_READINESS_SAFETY_LABELS,
    RUNTIME_PILOT_READINESS_DISALLOWED_TERMS,
  } = contractModule;

  if (RUNTIME_PILOT_READINESS_CONTRACT_VERSION === "V33") {
    details.push('PASS  RUNTIME_PILOT_READINESS_CONTRACT_VERSION === "V33".');
  } else {
    issues.push(
      `FAIL  RUNTIME_PILOT_READINESS_CONTRACT_VERSION === ${JSON.stringify(RUNTIME_PILOT_READINESS_CONTRACT_VERSION)}, expected "V33".`,
    );
  }

  if (RUNTIME_PILOT_READINESS_ALLOWED_GATES.length === 18) {
    details.push("PASS  RUNTIME_PILOT_READINESS_ALLOWED_GATES.length === 18.");
  } else {
    issues.push(
      `FAIL  RUNTIME_PILOT_READINESS_ALLOWED_GATES.length === ${RUNTIME_PILOT_READINESS_ALLOWED_GATES.length}, expected 18.`,
    );
  }

  const requiredCritical = [
    "SOURCE_AUTHORIZATION",
    "STALE_GUARD",
    "NO_DANGER_GUARD",
    "DRY_RUN_MODE",
    "NO_WRITE_GUARD",
    "KILL_SWITCH",
    "BUY_SELL_COMMAND_BLOCK",
    "PRODUCTION_WRITE_BLOCKED",
  ];
  for (const g of requiredCritical) {
    if (RUNTIME_PILOT_READINESS_CRITICAL_GATES.includes(g as never)) {
      details.push(`PASS  RUNTIME_PILOT_READINESS_CRITICAL_GATES includes "${g}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_READINESS_CRITICAL_GATES missing "${g}".`);
    }
  }

  const requiredDecisions = ["GO_DRY_RUN", "NO_GO", "BLOCKED", "READY_FOR_REVIEW", "DATA_INSUFFICIENT"];
  for (const d of requiredDecisions) {
    if (RUNTIME_PILOT_READINESS_ALLOWED_DECISIONS.includes(d as never)) {
      details.push(`PASS  RUNTIME_PILOT_READINESS_ALLOWED_DECISIONS includes "${d}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_READINESS_ALLOWED_DECISIONS missing "${d}".`);
    }
  }

  const requiredLabels = [
    "不自動下單",
    "不產生買賣指令",
    "不替代投資判斷",
    "Runtime Pilot Readiness Checklist 不是自動交易系統",
    "V33 不接真資料",
    "V33 不建立 runtime",
    "V33 不寫資料",
    "GO_DRY_RUN 不是 production",
    "GO_DRY_RUN 不代表可寫資料",
    "GO_DRY_RUN 不代表產生買賣指令",
    "production write 一律 BLOCKED",
    "fallback-only data 不得觸發 DANGER",
    "stale data 不得觸發 DANGER",
    "source conflict 不得觸發 DANGER",
    "priceVerified = false 時不得輸出精準價位",
    "資料不足就顯示資料不足",
  ];
  for (const label of requiredLabels) {
    if (RUNTIME_PILOT_READINESS_SAFETY_LABELS.includes(label as never)) {
      details.push(`PASS  RUNTIME_PILOT_READINESS_SAFETY_LABELS includes "${label}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_READINESS_SAFETY_LABELS missing "${label}".`);
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
    if (RUNTIME_PILOT_READINESS_DISALLOWED_TERMS.includes(term as never)) {
      details.push(`PASS  RUNTIME_PILOT_READINESS_DISALLOWED_TERMS includes "${term}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_READINESS_DISALLOWED_TERMS missing "${term}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "constant_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Payload checks (call pure function)
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const payload = buildRuntimePilotReadinessContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", payload.contractVersion, "V33");
  expectEq("sourceMode", payload.sourceMode, "spec_only");
  expectEq("generatedAt", payload.generatedAt, FIXED_TS);
  expectEq("requestPerformed", payload.requestPerformed, false);
  expectEq("supabaseConnected", payload.supabaseConnected, false);
  expectEq("productionWritePerformed", payload.productionWritePerformed, false);

  if (payload.gates.length === 18) {
    details.push("PASS  gates.length === 18.");
  } else {
    issues.push(`FAIL  gates.length === ${payload.gates.length}, expected 18.`);
  }

  const criticalCount = payload.gates.filter((g) => g.severity === "CRITICAL").length;
  if (criticalCount >= 8) {
    details.push(`PASS  critical gate count = ${criticalCount} (>= 8).`);
  } else {
    issues.push(`FAIL  critical gate count = ${criticalCount}, expected >= 8.`);
  }

  expectEq("decisionSummary.productionWriteAllowed", payload.decisionSummary.productionWriteAllowed, false);
  expectEq("decisionSummary.dryRunModeRequired", payload.decisionSummary.dryRunModeRequired, true);
  expectEq("decisionSummary.noWriteModeRequired", payload.decisionSummary.noWriteModeRequired, true);
  expectEq(
    "decisionSummary.buySellCommandGenerationBlocked",
    payload.decisionSummary.buySellCommandGenerationBlocked,
    true,
  );
  expectEq(
    "decisionSummary.notTradeAdviceAlwaysTrue",
    payload.decisionSummary.notTradeAdviceAlwaysTrue,
    true,
  );

  if (payload.decisionSummary.decision !== "GO_DRY_RUN") {
    details.push(`PASS  decisionSummary.decision = "${payload.decisionSummary.decision}" (!= GO_DRY_RUN).`);
  } else {
    issues.push("FAIL  decisionSummary.decision must not be GO_DRY_RUN in V33.");
  }

  expectEq("auditLogShape.requestPerformed", payload.auditLogShape.requestPerformed, false);
  expectEq("auditLogShape.supabaseConnected", payload.auditLogShape.supabaseConnected, false);
  expectEq(
    "auditLogShape.productionWritePerformed",
    payload.auditLogShape.productionWritePerformed,
    false,
  );

  const everyGate = (label: string, ok: boolean): void => {
    if (ok) details.push(`PASS  ${label}.`);
    else issues.push(`FAIL  ${label}.`);
  };
  everyGate("every gate has gateId", payload.gates.every((g) => typeof g.gateId === "string" && g.gateId.length > 0));
  everyGate("every gate has severity", payload.gates.every((g) => typeof g.severity === "string" && g.severity.length > 0));
  everyGate("every gate has status", payload.gates.every((g) => typeof g.status === "string" && g.status.length > 0));
  everyGate("every gate has requiredEvidence array", payload.gates.every((g) => Array.isArray(g.requiredEvidence)));

  // Any CRITICAL gate not PASS implies decision !== GO_DRY_RUN.
  const anyCriticalNotPass = payload.gates.some((g) => g.severity === "CRITICAL" && g.status !== "PASS");
  if (anyCriticalNotPass && payload.decisionSummary.decision === "GO_DRY_RUN") {
    issues.push("FAIL  a CRITICAL gate is not PASS but decision is GO_DRY_RUN.");
  } else {
    details.push("PASS  decision respects critical-gate gating.");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:runtime-pilot-readiness-checklist": "node --require ./scripts/register-typescript.cjs ./scripts/validate-runtime-pilot-readiness-checklist.ts"',
];

const README_TERMS: string[] = [
  "V33",
  "Runtime Pilot Readiness Checklist",
  "docs/runtime-pilot-readiness-checklist.md",
  "use-cases/runtime-pilot/runtime-pilot-readiness-contract.ts",
  "use-cases/runtime-pilot/build-runtime-pilot-readiness-contract.ts",
  "npm run test:runtime-pilot-readiness-checklist",
  "SOURCE_AUTHORIZATION",
  "STALE_GUARD",
  "NO_DANGER_GUARD",
  "DRY_RUN_MODE",
  "NO_WRITE_GUARD",
  "AUDIT_LOG_SHAPE",
  "ROLLBACK_PLAN",
  "KILL_SWITCH",
  "GO_DRY_RUN",
  "NO_GO",
  "production write 一律 BLOCKED",
  "V33 不接真資料",
  "V33 不建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 API route",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 8: Negation-context checks (doc prose)
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

  const { RUNTIME_PILOT_READINESS_DISALLOWED_TERMS } = contractModule;
  for (const term of RUNTIME_PILOT_READINESS_DISALLOWED_TERMS) {
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
// Gate 9: Safety checks
// ---------------------------------------------------------------------------

const FORBIDDEN_CODE_TOKENS: Array<{ token: string; label: string }> = [
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

  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      continue;
    }
    const lower = stripComments(body).toLowerCase();
    for (const { token, label } of FORBIDDEN_CODE_TOKENS) {
      if (lower.includes(token.toLowerCase())) {
        issues.push(`FAIL  Forbidden "${label}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${label}" in ${rel} code.`);
      }
    }
  }

  // No new SQL migration / API route / UI component for runtime pilot.
  const forbiddenArtifacts = [
    "supabase/runtime_pilot.sql",
    "app/api/runtime-pilot/route.ts",
    "components/runtime-pilot.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V33.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // No runtime pilot scanner / scheduler / poller.
  const forbiddenRuntime = [
    "services/runtime-pilot/quote-poller.ts",
    "services/runtime-pilot/scheduler.ts",
    "use-cases/runtime-pilot/runtime-pilot-runner.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V33 (spec-only).`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // Protected layers must still be present.
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "components/intraday-defense-tracker.tsx",
    "components/holding-defense-tracker.tsx",
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
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const contractCheck = checkTerms("contract_checks", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const builderTermCheck = checkTerms("builder_checks", builderBody, BUILDER_REL, BUILDER_TERMS);
const builderForbiddenCheck = checkAbsent(
  "builder_no_clock",
  builderBody == null ? null : stripComments(builderBody),
  BUILDER_REL,
  BUILDER_FORBIDDEN,
);
const constantCheck = checkConstants();
const payloadCheck = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const negationCheck = checkNegationContext(docBody);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  builderTermCheck,
  builderForbiddenCheck,
  constantCheck,
  payloadCheck,
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

const summary: RuntimePilotSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, PIPELINE_DOC_REL, INTRADAY_DOC_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    builder_checks: builderTermCheck.status,
    builder_no_clock: builderForbiddenCheck.status,
    constant_checks: constantCheck.status,
    payload_checks: payloadCheck.status,
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
