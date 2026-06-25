/**
 * Runtime Pilot Dry-Run Spec Validator — V35
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

const contractModule = require("../use-cases/runtime-pilot/runtime-pilot-dry-run-contract") as typeof import("../use-cases/runtime-pilot/runtime-pilot-dry-run-contract");
const builderModule = require("../use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract") as typeof import("../use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract");
const { buildRuntimePilotDryRunContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface DryRunSpecSummary {
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

const DOC_REL = "docs/runtime-pilot-dry-run-spec.md";
const CONTRACT_REL = "use-cases/runtime-pilot/runtime-pilot-dry-run-contract.ts";
const BUILDER_REL = "use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract.ts";
const READINESS_DOC_REL = "docs/runtime-pilot-readiness-checklist.md";
const READINESS_UI_DOC_REL = "docs/runtime-pilot-readiness-ui.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Runtime Pilot Dry-Run Spec doc (new)", rel: DOC_REL },
    { label: "Runtime Pilot Dry-Run contract (new)", rel: CONTRACT_REL },
    { label: "Runtime Pilot Dry-Run builder (new)", rel: BUILDER_REL },
    { label: "Runtime Pilot Readiness Checklist doc", rel: READINESS_DOC_REL },
    { label: "Runtime Pilot Readiness UI doc", rel: READINESS_UI_DOC_REL },
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
  "Runtime Pilot Dry-Run Spec",
  "V35 不接真資料",
  "V35 不建立 runtime",
  "V35 不寫資料",
  "DRY_RUN_NOT_ALLOWED",
  "DRY_RUN_READY_FOR_REVIEW",
  "DRY_RUN_ALLOWED",
  "DRY_RUN_INITIALIZING",
  "DRY_RUN_OBSERVING",
  "DRY_RUN_DATA_QUALITY_BLOCKED",
  "DRY_RUN_SOURCE_CONFLICT_BLOCKED",
  "DRY_RUN_STALE_DATA_BLOCKED",
  "DRY_RUN_FALLBACK_ONLY_BLOCKED",
  "DRY_RUN_STOPPED_BY_KILL_SWITCH",
  "DRY_RUN_ROLLBACK_REQUIRED",
  "DRY_RUN_COMPLETED_WITH_NO_WRITE",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "Dry-run 不是 production",
  "Dry-run 不代表可寫資料",
  "Dry-run 不代表產生買賣指令",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V36 Runtime Pilot Dry-Run API",
  "V37 Runtime Pilot Monitoring",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "RuntimePilotDryRunLifecycleState",
  "RuntimePilotDryRunRuntimeMode",
  "RuntimePilotDryRunSourceMode",
  "RuntimePilotDryRunProofStatus",
  "RuntimePilotDryRunReadinessDecision",
  "RuntimePilotDryRunSourceDescriptor",
  "RuntimePilotDryRunQuoteSnapshot",
  "RuntimePilotDryRunPriceVerification",
  "RuntimePilotDryRunAlertProjection",
  "RuntimePilotDryRunAuditEvent",
  "RuntimePilotDryRunNoWriteProof",
  "RuntimePilotDryRunKillSwitch",
  "RuntimePilotDryRunRollback",
  "RuntimePilotDryRunBundle",
  "RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION",
  "RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES",
  "RUNTIME_PILOT_DRY_RUN_ALLOWED_RUNTIME_MODES",
  "RUNTIME_PILOT_DRY_RUN_ALLOWED_SOURCE_MODES",
  "RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS",
  "RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS",
  "DRY_RUN_NOT_ALLOWED",
  "DRY_RUN_COMPLETED_WITH_NO_WRITE",
  "dryRunAllowed",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "productionWriteRequested: false",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
  "writeAttempted: false",
  "databaseWritePerformed: false",
  "externalOrderPerformed: false",
  "highConfidenceConclusionAllowed: false",
  "precisePriceZoneAllowed: false",
  "noDangerGuardApplied: true",
];

// ---------------------------------------------------------------------------
// Gate 4: Builder checks
// ---------------------------------------------------------------------------

const BUILDER_TERMS: string[] = [
  "buildRuntimePilotDryRunContract",
  "2026-06-23T00:00:00.000Z",
  "V35",
  "spec_only",
  "dry_run_spec",
  "DRY_RUN_NOT_ALLOWED",
  "NO_GO",
  "dryRunAllowed: false",
  "priceVerified: false",
  "highConfidenceConclusionAllowed: false",
  "precisePriceZoneAllowed: false",
  "noDangerGuardApplied: true",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "productionWriteRequested: false",
  "writeAttempted: false",
  "productionWritePerformed: false",
  "databaseWritePerformed: false",
  "externalOrderPerformed: false",
  "supabaseConnected: false",
  "requestPerformed: false",
];

const BUILDER_FORBIDDEN: string[] = ["Date.now", "new Date"];

// ---------------------------------------------------------------------------
// Gate 5: Constant value checks (import + validate)
// ---------------------------------------------------------------------------

function checkConstants(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const {
    RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION,
    RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES,
    RUNTIME_PILOT_DRY_RUN_ALLOWED_RUNTIME_MODES,
    RUNTIME_PILOT_DRY_RUN_ALLOWED_SOURCE_MODES,
    RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS,
    RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS,
  } = contractModule;

  if (RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION === "V35") {
    details.push('PASS  RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION === "V35".');
  } else {
    issues.push(
      `FAIL  RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION === ${JSON.stringify(RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION)}, expected "V35".`,
    );
  }

  if (RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES.length === 12) {
    details.push("PASS  RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES.length === 12.");
  } else {
    issues.push(
      `FAIL  RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES.length === ${RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES.length}, expected 12.`,
    );
  }

  for (const m of ["dry_run_spec", "dry_run", "disabled"]) {
    if (RUNTIME_PILOT_DRY_RUN_ALLOWED_RUNTIME_MODES.includes(m as never)) {
      details.push(`PASS  RUNTIME_PILOT_DRY_RUN_ALLOWED_RUNTIME_MODES includes "${m}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_DRY_RUN_ALLOWED_RUNTIME_MODES missing "${m}".`);
    }
  }

  for (const m of ["spec_only", "fixture", "authorized_source_pending", "not_available"]) {
    if (RUNTIME_PILOT_DRY_RUN_ALLOWED_SOURCE_MODES.includes(m as never)) {
      details.push(`PASS  RUNTIME_PILOT_DRY_RUN_ALLOWED_SOURCE_MODES includes "${m}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_DRY_RUN_ALLOWED_SOURCE_MODES missing "${m}".`);
    }
  }

  const requiredLabels = [
    "不自動下單",
    "不產生買賣指令",
    "不替代投資判斷",
    "Runtime Pilot Dry-Run Spec 不是自動交易系統",
    "V35 不接真資料",
    "V35 不建立 runtime",
    "V35 不寫資料",
    "Dry-run 不是 production",
    "Dry-run 不代表可寫資料",
    "Dry-run 不代表產生買賣指令",
    "production write 一律 BLOCKED",
    "buySellCommandGenerated 必須 false",
    "autoOrderRequested 必須 false",
    "fallback-only data 不得觸發 DANGER",
    "stale data 不得觸發 DANGER",
    "source conflict 不得觸發 DANGER",
    "priceVerified = false 時不得輸出精準價位",
    "資料不足就顯示資料不足",
  ];
  for (const label of requiredLabels) {
    if (RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS.includes(label as never)) {
      details.push(`PASS  RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS includes "${label}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS missing "${label}".`);
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
    if (RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS.includes(term as never)) {
      details.push(`PASS  RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS includes "${term}".`);
    } else {
      issues.push(`FAIL  RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS missing "${term}".`);
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

  const p = buildRuntimePilotDryRunContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V35");
  expectEq("sourceMode", p.sourceMode, "spec_only");
  expectEq("runtimeMode", p.runtimeMode, "dry_run_spec");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("lifecycleState", p.lifecycleState, "DRY_RUN_NOT_ALLOWED");
  expectEq("readinessDecision", p.readinessDecision, "NO_GO");
  expectEq("dryRunAllowed", p.dryRunAllowed, false);
  expectEq("requestPerformed", p.requestPerformed, false);
  expectEq("supabaseConnected", p.supabaseConnected, false);
  expectEq("productionWritePerformed", p.productionWritePerformed, false);

  expectEq("sourceDescriptor.requestPerformed", p.sourceDescriptor.requestPerformed, false);
  expectEq("quoteSnapshot.requestPerformed", p.quoteSnapshot.requestPerformed, false);

  expectEq("priceVerification.priceVerified", p.priceVerification.priceVerified, false);
  expectEq(
    "priceVerification.highConfidenceConclusionAllowed",
    p.priceVerification.highConfidenceConclusionAllowed,
    false,
  );
  expectEq(
    "priceVerification.precisePriceZoneAllowed",
    p.priceVerification.precisePriceZoneAllowed,
    false,
  );
  expectEq("priceVerification.noDangerGuardApplied", p.priceVerification.noDangerGuardApplied, true);

  expectEq("alertProjection.buySellCommandGenerated", p.alertProjection.buySellCommandGenerated, false);
  expectEq("alertProjection.autoOrderRequested", p.alertProjection.autoOrderRequested, false);
  expectEq("alertProjection.productionWriteRequested", p.alertProjection.productionWriteRequested, false);
  expectEq("alertProjection.notExitSignal", p.alertProjection.notExitSignal, true);
  expectEq("alertProjection.notTradeAdvice", p.alertProjection.notTradeAdvice, true);

  expectEq("auditEvent.requestPerformed", p.auditEvent.requestPerformed, false);
  expectEq("auditEvent.supabaseConnected", p.auditEvent.supabaseConnected, false);
  expectEq("auditEvent.productionWritePerformed", p.auditEvent.productionWritePerformed, false);
  expectEq("auditEvent.buySellCommandGenerated", p.auditEvent.buySellCommandGenerated, false);
  expectEq("auditEvent.autoOrderRequested", p.auditEvent.autoOrderRequested, false);

  expectEq("noWriteProof.writeAttempted", p.noWriteProof.writeAttempted, false);
  expectEq("noWriteProof.productionWritePerformed", p.noWriteProof.productionWritePerformed, false);
  expectEq("noWriteProof.databaseWritePerformed", p.noWriteProof.databaseWritePerformed, false);
  expectEq("noWriteProof.externalOrderPerformed", p.noWriteProof.externalOrderPerformed, false);
  expectEq("noWriteProof.supabaseConnected", p.noWriteProof.supabaseConnected, false);

  expectEq("killSwitch.requiresManualReview", p.killSwitch.requiresManualReview, true);
  expectEq("rollback.manualReviewRequired", p.rollback.manualReviewRequired, true);

  if (p.safetyLabels.includes("不產生買賣指令")) {
    details.push('PASS  safetyLabels includes "不產生買賣指令".');
  } else {
    issues.push('FAIL  safetyLabels must include "不產生買賣指令".');
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:runtime-pilot-dry-run-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-runtime-pilot-dry-run-spec.ts"',
];

const README_TERMS: string[] = [
  "V35",
  "Runtime Pilot Dry-Run Spec",
  "docs/runtime-pilot-dry-run-spec.md",
  "use-cases/runtime-pilot/runtime-pilot-dry-run-contract.ts",
  "use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract.ts",
  "npm run test:runtime-pilot-dry-run-spec",
  "DRY_RUN_NOT_ALLOWED",
  "DRY_RUN_COMPLETED_WITH_NO_WRITE",
  "dry_run_spec",
  "NO_GO",
  "priceVerified = false 時不得輸出精準價位",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "V35 不接真資料",
  "V35 不建立 runtime",
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

  const { RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS } = contractModule;
  for (const term of RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS) {
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

  const forbiddenArtifacts = [
    "supabase/runtime_pilot_dry_run.sql",
    "app/api/runtime-pilot-dry-run/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "components/runtime-pilot-dry-run.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V35.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  const forbiddenRuntime = [
    "use-cases/runtime-pilot/runtime-pilot-dry-run-runner.ts",
    "services/runtime-pilot/dry-run-poller.ts",
    "services/runtime-pilot/dry-run-scheduler.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V35 (spec-only).`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "components/runtime-pilot-readiness.tsx",
    "use-cases/runtime-pilot/runtime-pilot-readiness-contract.ts",
    "use-cases/runtime-pilot/build-runtime-pilot-readiness-contract.ts",
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

const summary: DryRunSpecSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, READINESS_DOC_REL, READINESS_UI_DOC_REL, README_REL, PKG_REL],
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
