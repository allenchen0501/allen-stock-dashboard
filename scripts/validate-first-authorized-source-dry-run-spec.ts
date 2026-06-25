/**
 * First Authorized Source Dry-Run Spec Validator — V39
 *
 * Spec-only check. Imports the pure builder + static constants and inspects the
 * payload shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, write data, or create a runtime.
 *
 * Safety scanning for forbidden runtime tokens (including concrete data-source
 * names) is applied ONLY to the contract + builder code files (comment-stripped).
 * Documentation may legitimately mention "官方 / 授權資料源" as governance notes,
 * so docs are NOT scanned for those source names.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/runtime-pilot/first-authorized-source-dry-run-contract") as typeof import("../use-cases/runtime-pilot/first-authorized-source-dry-run-contract");
const builderModule = require("../use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract") as typeof import("../use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract");
const { buildFirstAuthorizedSourceDryRunContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface FasSpecSummary {
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

const DOC_REL = "docs/first-authorized-source-dry-run-spec.md";
const CONTRACT_REL = "use-cases/runtime-pilot/first-authorized-source-dry-run-contract.ts";
const BUILDER_REL = "use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract.ts";
const IMPL_DOC_REL = "docs/runtime-pilot-implementation-review.md";
const MONITORING_DOC_REL = "docs/runtime-pilot-monitoring-ui.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "First Authorized Source Dry-Run Spec doc (new)", rel: DOC_REL },
    { label: "First Authorized Source Dry-Run contract (new)", rel: CONTRACT_REL },
    { label: "First Authorized Source Dry-Run builder (new)", rel: BUILDER_REL },
    { label: "Runtime Pilot Implementation Review doc", rel: IMPL_DOC_REL },
    { label: "Runtime Pilot Monitoring UI doc", rel: MONITORING_DOC_REL },
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
  "First Authorized Source Dry-Run Spec",
  "V39 不接真資料",
  "V39 不建立 runtime",
  "V39 不寫資料",
  "single-source",
  "source-neutral connector shape",
  "authorizationStatus 未 PASS → NO_GO",
  "manualSignOffCompleted = false → NO_GO",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "V40 First Authorized Source Dry-Run API",
  "V41 First Authorized Source Dry-Run Monitoring UI",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "FirstAuthorizedSourceDryRunSourceCategory",
  "FirstAuthorizedSourceDryRunReviewStatus",
  "FirstAuthorizedSourceDryRunDecision",
  "FirstAuthorizedSourceDryRunRequestMode",
  "FirstAuthorizedSourceDryRunDataQualityStatus",
  "FirstAuthorizedSourcePreflight",
  "FirstAuthorizedSourceConnectorShape",
  "FirstAuthorizedSourceQuoteSnapshot",
  "FirstAuthorizedSourcePriceVerificationGate",
  "FirstAuthorizedSourceAlertProjection",
  "FirstAuthorizedSourceAuditEvent",
  "FirstAuthorizedSourceNoWriteProof",
  "FirstAuthorizedSourceKillSwitch",
  "FirstAuthorizedSourceRollback",
  "FirstAuthorizedSourceDryRunBundle",
  "FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION",
  "FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_SOURCE_CATEGORIES",
  "FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_DECISIONS",
  "FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_REQUEST_MODES",
  "FIRST_AUTHORIZED_SOURCE_DRY_RUN_SAFETY_LABELS",
  "FIRST_AUTHORIZED_SOURCE_DRY_RUN_DISALLOWED_TERMS",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "manualSignOffCompleted: false",
  "dryRunAllowed: false",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
  "rawResponseStored: false",
  "normalizedSnapshotProduced: false",
  "priceVerified: false",
  "highConfidenceConclusionAllowed: false",
  "precisePriceZoneAllowed: false",
  "noDangerGuardApplied: true",
  "notExitSignal: true",
  "notTradeAdvice: true",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "productionWriteRequested: false",
  "writeAttempted: false",
  "databaseWritePerformed: false",
  "externalOrderPerformed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Builder checks
// ---------------------------------------------------------------------------

const BUILDER_TERMS: string[] = [
  "buildFirstAuthorizedSourceDryRunContract",
  "2026-06-23T00:00:00.000Z",
  "V39",
  "spec_only",
  "NO_GO",
  "dryRunAllowed: false",
  "manualSignOffCompleted: false",
  "requestPerformed: false",
  "rawResponseStored: false",
  "normalizedSnapshotProduced: false",
  "priceVerified: false",
  "highConfidenceConclusionAllowed: false",
  "precisePriceZoneAllowed: false",
  "noDangerGuardApplied: true",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "productionWriteRequested: false",
  "writeAttempted: false",
  "databaseWritePerformed: false",
  "productionWritePerformed: false",
  "externalOrderPerformed: false",
  "supabaseConnected: false",
];

const BUILDER_FORBIDDEN: string[] = ["Date.now", "new Date"];

// ---------------------------------------------------------------------------
// Gate 5: Constant value checks (import + validate)
// ---------------------------------------------------------------------------

function checkConstants(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const {
    FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION,
    FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_SOURCE_CATEGORIES,
    FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_DECISIONS,
    FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_REQUEST_MODES,
    FIRST_AUTHORIZED_SOURCE_DRY_RUN_SAFETY_LABELS,
    FIRST_AUTHORIZED_SOURCE_DRY_RUN_DISALLOWED_TERMS,
  } = contractModule;

  if (FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION === "V39") {
    details.push('PASS  FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION === "V39".');
  } else {
    issues.push(
      `FAIL  FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION === ${JSON.stringify(FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION)}, expected "V39".`,
    );
  }

  const requiredCategories = [
    "OFFICIAL_OR_AUTHORIZED",
    "EXCHANGE_AUTHORIZED",
    "VENDOR_AUTHORIZED",
    "MANUAL_REVIEW_REQUIRED",
    "NOT_AVAILABLE",
  ];
  for (const c of requiredCategories) {
    if (FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_SOURCE_CATEGORIES.includes(c as never)) {
      details.push(`PASS  allowed source categories include "${c}".`);
    } else {
      issues.push(`FAIL  allowed source categories missing "${c}".`);
    }
  }

  const requiredDecisions = [
    "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
    "NO_GO",
    "BLOCKED",
    "READY_FOR_REVIEW",
    "DATA_INSUFFICIENT",
  ];
  for (const d of requiredDecisions) {
    if (FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_DECISIONS.includes(d as never)) {
      details.push(`PASS  allowed decisions include "${d}".`);
    } else {
      issues.push(`FAIL  allowed decisions missing "${d}".`);
    }
  }

  for (const m of ["dry_run", "disabled", "not_available"]) {
    if (FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_REQUEST_MODES.includes(m as never)) {
      details.push(`PASS  allowed request modes include "${m}".`);
    } else {
      issues.push(`FAIL  allowed request modes missing "${m}".`);
    }
  }

  const requiredLabels = [
    "不自動下單",
    "不產生買賣指令",
    "不替代投資判斷",
    "First Authorized Source Dry-Run Spec 不是自動交易系統",
    "V39 不接真資料",
    "V39 不建立 runtime",
    "V39 不寫資料",
    "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production",
    "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料",
    "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令",
    "production write 一律 BLOCKED",
    "buySellCommandGenerated 必須 false",
    "autoOrderRequested 必須 false",
    "priceVerified = false 時不得輸出精準價位",
    "fallback-only data 不得觸發 DANGER",
    "stale data 不得觸發 DANGER",
    "source conflict 不得觸發 DANGER",
    "資料不足就顯示資料不足",
  ];
  for (const label of requiredLabels) {
    if (FIRST_AUTHORIZED_SOURCE_DRY_RUN_SAFETY_LABELS.includes(label as never)) {
      details.push(`PASS  safety labels include "${label}".`);
    } else {
      issues.push(`FAIL  safety labels missing "${label}".`);
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
    if (FIRST_AUTHORIZED_SOURCE_DRY_RUN_DISALLOWED_TERMS.includes(term as never)) {
      details.push(`PASS  disallowed terms include "${term}".`);
    } else {
      issues.push(`FAIL  disallowed terms missing "${term}".`);
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

  const p = buildFirstAuthorizedSourceDryRunContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V39");
  expectEq("sourceMode", p.sourceMode, "spec_only");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("decision", p.decision, "NO_GO");
  expectEq("dryRunAllowed", p.dryRunAllowed, false);

  expectEq("preflight.manualSignOffCompleted", p.preflight.manualSignOffCompleted, false);

  expectEq("connectorShape.requestPerformed", p.connectorShape.requestPerformed, false);
  expectEq("connectorShape.rawResponseStored", p.connectorShape.rawResponseStored, false);
  expectEq("connectorShape.normalizedSnapshotProduced", p.connectorShape.normalizedSnapshotProduced, false);
  expectEq("connectorShape.productionWritePerformed", p.connectorShape.productionWritePerformed, false);
  expectEq("connectorShape.buySellCommandGenerated", p.connectorShape.buySellCommandGenerated, false);
  expectEq("connectorShape.autoOrderRequested", p.connectorShape.autoOrderRequested, false);

  expectEq("quoteSnapshot.priceVerified", p.quoteSnapshot.priceVerified, false);
  expectEq("quoteSnapshot.requestPerformed", p.quoteSnapshot.requestPerformed, false);

  expectEq("priceVerification.priceVerified", p.priceVerification.priceVerified, false);
  expectEq("priceVerification.highConfidenceConclusionAllowed", p.priceVerification.highConfidenceConclusionAllowed, false);
  expectEq("priceVerification.precisePriceZoneAllowed", p.priceVerification.precisePriceZoneAllowed, false);
  expectEq("priceVerification.noDangerGuardApplied", p.priceVerification.noDangerGuardApplied, true);

  expectEq("alertProjection.projectedAlertLevel", p.alertProjection.projectedAlertLevel, "DATA_INSUFFICIENT");
  expectEq("alertProjection.notExitSignal", p.alertProjection.notExitSignal, true);
  expectEq("alertProjection.notTradeAdvice", p.alertProjection.notTradeAdvice, true);
  expectEq("alertProjection.buySellCommandGenerated", p.alertProjection.buySellCommandGenerated, false);
  expectEq("alertProjection.autoOrderRequested", p.alertProjection.autoOrderRequested, false);
  expectEq("alertProjection.productionWriteRequested", p.alertProjection.productionWriteRequested, false);

  expectEq("auditEvent.requestPerformed", p.auditEvent.requestPerformed, false);
  expectEq("auditEvent.supabaseConnected", p.auditEvent.supabaseConnected, false);
  expectEq("auditEvent.productionWritePerformed", p.auditEvent.productionWritePerformed, false);
  expectEq("auditEvent.buySellCommandGenerated", p.auditEvent.buySellCommandGenerated, false);
  expectEq("auditEvent.autoOrderRequested", p.auditEvent.autoOrderRequested, false);

  expectEq("noWriteProof.writeAttempted", p.noWriteProof.writeAttempted, false);
  expectEq("noWriteProof.databaseWritePerformed", p.noWriteProof.databaseWritePerformed, false);
  expectEq("noWriteProof.productionWritePerformed", p.noWriteProof.productionWritePerformed, false);
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
  '"test:first-authorized-source-dry-run-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-first-authorized-source-dry-run-spec.ts"',
];

const README_TERMS: string[] = [
  "V39",
  "First Authorized Source Dry-Run Spec",
  "docs/first-authorized-source-dry-run-spec.md",
  "use-cases/runtime-pilot/first-authorized-source-dry-run-contract.ts",
  "use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract.ts",
  "npm run test:first-authorized-source-dry-run-spec",
  "single-source",
  "source-neutral connector shape",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "manualSignOffCompleted = false",
  "priceVerified = false 時不得輸出精準價位",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "V39 不接真資料",
  "V39 不建立 runtime",
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

  const { FIRST_AUTHORIZED_SOURCE_DRY_RUN_DISALLOWED_TERMS } = contractModule;
  for (const term of FIRST_AUTHORIZED_SOURCE_DRY_RUN_DISALLOWED_TERMS) {
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
    "supabase/first_authorized_source_dry_run.sql",
    "app/api/first-authorized-source-dry-run/route.ts",
    // V40 sanctioned the fixture-only API route
    // app/api/portfolio/first-authorized-source-dry-run/route.ts — it is a
    // mock_or_contract internal endpoint wrapping this V39 bundle, so it is no
    // longer forbidden here. (No Supabase / no external request / no write / no
    // buy-sell / no SQL migration / no runtime — still enforced by V40's checker.)
    "components/first-authorized-source-dry-run.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V39.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  const forbiddenRuntime = [
    "use-cases/runtime-pilot/first-authorized-source-connector.ts",
    "services/runtime-pilot/first-authorized-source-poller.ts",
    "services/runtime-pilot/first-authorized-source-scheduler.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V39 (spec-only).`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
    "app/api/war-room/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "components/runtime-pilot-monitoring.tsx",
    "use-cases/runtime-pilot/build-runtime-pilot-implementation-review-contract.ts",
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

const summary: FasSpecSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, IMPL_DOC_REL, MONITORING_DOC_REL, README_REL, PKG_REL],
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
