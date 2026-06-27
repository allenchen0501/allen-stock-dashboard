/**
 * Allen War Room Operational Layout Validator — V60
 *
 * Static + contract check. Imports the pure builder + constants and inspects the
 * layout bundle, and statically checks the UI files / pages. It does NOT start a
 * Next.js server, make any HTTP request, connect to Supabase, read env keys,
 * build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive. UI files (components + pages) are
 * scanned for the full forbidden list including autoorder / placeorder. The
 * contract / builder are scanned for the connection / write list only (the safety
 * FLAG `autoOrderRequested` legitimately contains the substring "autoorder").
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-allen-war-room-operational-layout-contract") as typeof import("../use-cases/war-room/build-allen-war-room-operational-layout-contract");
const { buildAllenWarRoomOperationalLayoutContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface LayoutSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  actual_position_count: number;
  watchlist_count: number;
  system_candidate_count: number;
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

const DOC_REL = "docs/allen-war-room-operational-layout.md";
const CONTRACT_REL = "use-cases/war-room/allen-war-room-data-taxonomy-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-allen-war-room-operational-layout-contract.ts";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const ACTUAL_REL = "components/war-room/actual-positions-table.tsx";
const WATCH_REL = "components/war-room/fixed-watchlist-table.tsx";
const CAND_REL = "components/war-room/system-candidates-table.tsx";
const SESSION_REL = "components/war-room/market-session-panel.tsx";
const BANNER_REL = "components/war-room/data-verification-banner.tsx";
const HOLDINGS_REL = "app/holdings/page.tsx";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

const UI_FILES = [LAYOUT_REL, ACTUAL_REL, WATCH_REL, CAND_REL, SESSION_REL, BANNER_REL, HOLDINGS_REL, SAFETY_PAGE_REL];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Layout doc (new)", rel: DOC_REL },
    { label: "Data taxonomy contract (new)", rel: CONTRACT_REL },
    { label: "Layout builder (new)", rel: BUILDER_REL },
    { label: "Operational layout component (new)", rel: LAYOUT_REL },
    { label: "Actual positions table (new)", rel: ACTUAL_REL },
    { label: "Fixed watchlist table (new)", rel: WATCH_REL },
    { label: "System candidates table (new)", rel: CAND_REL },
    { label: "Market session panel (new)", rel: SESSION_REL },
    { label: "Data verification banner (new)", rel: BANNER_REL },
    { label: "Holdings page", rel: HOLDINGS_REL },
    { label: "System safety page (new)", rel: SAFETY_PAGE_REL },
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
  "V60",
  "Allen War Room Operational Layout",
  "owner and user, not developer",
  "final website must use real data before operational use",
  "current fixture/mock data is not operational data",
  "actual positions are entered holdings only",
  "watchlist is not position",
  "system candidate is not position",
  "actual position requires shares and average cost before PnL",
  "no fake PnL",
  "no fake position size",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
  "pre-market",
  "intraday",
  "after-close",
  "data date",
  "data source",
  "verification status",
  "engineering safety moved away from primary trading view",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "WarRoomDataCategory",
  "WarRoomMarketSession",
  "WarRoomDataVerificationStatus",
  "WarRoomTodayAction",
  "WarRoomActualPosition",
  "WarRoomWatchlistItem",
  "WarRoomSystemCandidate",
  "AllenWarRoomOperationalLayoutBundle",
  "ALLEN_WAR_ROOM_OPERATIONAL_LAYOUT_CONTRACT_VERSION",
  "ALLEN_WAR_ROOM_DATA_CATEGORIES",
  "ALLEN_WAR_ROOM_MARKET_SESSIONS",
  "ALLEN_WAR_ROOM_VERIFICATION_STATUSES",
  "ALLEN_WAR_ROOM_TODAY_ACTIONS",
  "ALLEN_WAR_ROOM_SAFETY_LABELS",
  "ACTUAL_POSITION",
  "FIXED_WATCHLIST",
  "SYSTEM_CANDIDATE",
  "OPPORTUNITY_POOL",
  "RISK_BLOCKLIST",
  "ENGINEERING_SAFETY",
  "PRE_MARKET",
  "INTRADAY",
  "AFTER_CLOSE",
  "US_MARKET_PREVIEW",
  "DATA_UNAVAILABLE",
  "VERIFIED",
  "DELAYED",
  "STALE",
  "CONFLICT",
  "FIXTURE_ONLY",
  "MOCK_ONLY",
  "INSUFFICIENT_DATA",
  "NOT_CONNECTED",
  "ADD_ON_CONFIRMATION",
  "WATCH_PULLBACK",
  "userIsDeveloper: false",
  "actualPositionsDefinitionLocked: true",
  "watchlistDefinitionLocked: true",
  "systemCandidatesDefinitionLocked: true",
  "actualPositionRequiresEntryRecord: true",
  "actualPositionRequiresSharesAndCostForPnl: true",
  "watchlistIsNotPosition: true",
  "systemCandidateIsNotPosition: true",
  "mockDataMustBeLabeled: true",
  "fixtureDataMustBeLabeled: true",
  "operationalLayoutDefined: true",
  "productionTradingReady: false",
  "realDataConnected: false",
  "supabaseConnected: false",
  "envReadPerformed: false",
  "databaseWritePerformed: false",
  "portfolioApiSwitched: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
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
// Gate 4: Payload checks
// ---------------------------------------------------------------------------

function checkPayload(): { result: CheckResult; actualCount: number; watchCount: number; candCount: number; decision: string } {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildAllenWarRoomOperationalLayoutContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", p.contractVersion, "V60");
  expectEq("layoutName", p.layoutName, "Allen War Room Operational Layout");
  expectEq("page", p.page, "/holdings");
  expectEq("primaryUserRole", p.primaryUserRole, "owner_operator");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("decision", p.decision, "READY_FOR_UI_REVIEW");
  if ((p.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');
  else details.push('PASS  decision is not "PRODUCTION_READY".');

  const trueFlags = [
    "actualPositionsDefinitionLocked", "watchlistDefinitionLocked", "systemCandidatesDefinitionLocked",
    "actualPositionRequiresEntryRecord", "actualPositionRequiresSharesAndCostForPnl", "watchlistIsNotPosition",
    "systemCandidateIsNotPosition", "mockDataMustBeLabeled", "fixtureDataMustBeLabeled", "operationalLayoutDefined",
    "engineeringSafetyMovedAwayFromPrimaryView",
  ] as const;
  const falseFlags = [
    "userIsDeveloper", "productionTradingReady", "realDataConnected", "supabaseConnected", "envReadPerformed",
    "databaseWritePerformed", "portfolioApiSwitched", "buySellCommandGenerated", "autoOrderRequested",
  ] as const;
  const rec = p as unknown as Record<string, unknown>;
  for (const f of trueFlags) expectEq(f, rec[f], true);
  for (const f of falseFlags) expectEq(f, rec[f], false);

  // Categories locked + disjoint roles.
  if (p.actualPositions.every((a) => a.category === "ACTUAL_POSITION")) details.push("PASS  all actualPositions category ACTUAL_POSITION.");
  else issues.push("FAIL  actualPositions must all be ACTUAL_POSITION.");
  if (p.fixedWatchlist.every((w) => w.category === "FIXED_WATCHLIST" && w.isPosition === false)) details.push("PASS  watchlist is not position (isPosition false).");
  else issues.push("FAIL  watchlist items must be FIXED_WATCHLIST with isPosition false.");
  if (p.systemCandidates.every((c) => c.category === "SYSTEM_CANDIDATE" && c.isPosition === false)) details.push("PASS  system candidate is not position (isPosition false).");
  else issues.push("FAIL  system candidates must be SYSTEM_CANDIDATE with isPosition false.");

  // No PnL without shares + cost.
  let pnlOk = true;
  for (const a of p.actualPositions) {
    if ((!a.sharesKnown || !a.averageCostKnown)) {
      if (a.pnlComputable !== false || a.marketValue !== null || a.unrealizedPnl !== null) {
        pnlOk = false;
        issues.push(`FAIL  ${a.symbol} has no shares/cost but PnL is computed.`);
      }
    }
  }
  if (pnlOk) details.push("PASS  no PnL computed without shares + averageCost (no fake PnL).");

  // Known incomplete positions present.
  for (const sym of ["4966", "2743"]) {
    const found = p.actualPositions.find((a) => a.symbol === sym);
    if (found && !found.pnlComputable) details.push(`PASS  ${sym} present as incomplete actual position (持股資料待補).`);
    else issues.push(`FAIL  ${sym} must be present as incomplete actual position with pnlComputable false.`);
  }

  if (p.summaryCards.length >= 4) details.push(`PASS  summaryCards.length = ${p.summaryCards.length} (>= 4).`);
  else issues.push(`FAIL  summaryCards.length = ${p.summaryCards.length}, expected >= 4.`);

  const sessions = new Set(p.sessionStructures.map((s) => s.session));
  for (const s of ["PRE_MARKET", "INTRADAY", "AFTER_CLOSE"]) {
    if (sessions.has(s as never)) details.push(`PASS  session structure covers ${s}.`);
    else issues.push(`FAIL  session structure must cover ${s}.`);
  }

  expectEq("dataVerification.isFixtureOrMock", p.dataVerification.isFixtureOrMock, true);

  return {
    result: { name: "payload_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    actualCount: p.actualPositions.length,
    watchCount: p.fixedWatchlist.length,
    candCount: p.systemCandidates.length,
    decision: p.decision,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const watch = readFile(resolve(WATCH_REL));
  if (watch && watch.includes("追蹤股不等於持股")) details.push("PASS  watchlist table states 追蹤股不等於持股.");
  else issues.push("FAIL  watchlist table must state 追蹤股不等於持股.");

  const cand = readFile(resolve(CAND_REL));
  if (cand && cand.includes("系統候選股不等於持股")) details.push("PASS  candidates table states 系統候選股不等於持股.");
  else issues.push("FAIL  candidates table must state 系統候選股不等於持股.");

  const banner = readFile(resolve(BANNER_REL));
  if (banner && banner.includes("目前非真實資料，不可作為操作依據")) details.push("PASS  banner shows fixture/mock not-operational warning.");
  else issues.push("FAIL  data verification banner must show fixture/mock not-operational warning.");

  const session = readFile(resolve(SESSION_REL));
  if (session && session.includes("盤前") && session.includes("盤中") && session.includes("收盤後")) {
    details.push("PASS  session panel has 盤前 / 盤中 / 收盤後.");
  } else issues.push("FAIL  session panel must have 盤前 / 盤中 / 收盤後.");

  // Layout composes the three core tables + session + banner.
  const layout = readFile(resolve(LAYOUT_REL));
  if (layout) {
    for (const tag of ["<ActualPositionsTable", "<FixedWatchlistTable", "<SystemCandidatesTable", "<MarketSessionPanel", "<DataVerificationBanner"]) {
      if (layout.includes(tag)) details.push(`PASS  layout renders ${tag}.`);
      else issues.push(`FAIL  layout must render ${tag}.`);
    }
  } else issues.push(`FAIL  Cannot read ${LAYOUT_REL}.`);

  // Holdings page: war room first, engineering moved into a collapsible below it.
  const holdings = readFile(resolve(HOLDINGS_REL));
  if (holdings) {
    const wIdx = holdings.indexOf("<WarRoomOperationalLayout");
    const engIdx = holdings.indexOf("<ShadowRunnerDryRunMonitoring");
    if (wIdx >= 0) details.push("PASS  holdings renders <WarRoomOperationalLayout /> (operational first screen).");
    else issues.push("FAIL  holdings must render <WarRoomOperationalLayout />.");
    if (wIdx >= 0 && engIdx >= 0 && wIdx < engIdx) details.push("PASS  war room layout precedes engineering monitoring (engineering not first screen).");
    else issues.push("FAIL  war room layout must precede engineering monitoring on holdings page.");
    if (holdings.includes("<details")) details.push("PASS  engineering safety wrapped in collapsible <details>.");
    else issues.push("FAIL  engineering safety must be in a collapsible <details> (moved away from primary view).");
    if (holdings.includes("系統安全監控")) details.push("PASS  holdings has 系統安全監控 / Engineering Safety section.");
    else issues.push("FAIL  holdings must label 系統安全監控 / Engineering Safety section.");
  } else issues.push(`FAIL  Cannot read ${HOLDINGS_REL}.`);

  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: System safety page + existing monitoring components still present
// ---------------------------------------------------------------------------

function checkSafetyRelocation(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const safetyPage = readFile(resolve(SAFETY_PAGE_REL));
  if (safetyPage == null) {
    issues.push(`FAIL  Cannot read ${SAFETY_PAGE_REL}.`);
  } else {
    for (const tag of ["<RuntimePilotMonitoring", "<ShadowRunnerDryRunMonitoring", "<FirstAuthorizedSourceDryRunMonitoring", "<RuntimePilotReadiness"]) {
      if (safetyPage.includes(tag)) details.push(`PASS  /system/safety renders ${tag}.`);
      else issues.push(`FAIL  /system/safety must render ${tag}.`);
    }
  }

  // Existing monitoring components must still exist (not deleted, only relocated).
  const monitoringComponents = [
    "components/runtime-pilot-monitoring.tsx",
    "components/first-authorized-source-dry-run-monitoring.tsx",
    "components/shadow-runner-dry-run-monitoring.tsx",
    "components/runtime-pilot-readiness.tsx",
  ];
  for (const rel of monitoringComponents) {
    if (fileExists(resolve(rel))) details.push(`PASS  existing monitoring component ${rel} still present.`);
    else issues.push(`FAIL  existing monitoring component ${rel} missing.`);
  }

  return { name: "safety_relocation", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:allen-war-room-operational-layout": "node --require ./scripts/register-typescript.cjs ./scripts/validate-allen-war-room-operational-layout.ts"',
];

const README_TERMS: string[] = [
  "V60",
  "Allen War Room Operational Layout",
  "docs/allen-war-room-operational-layout.md",
  "use-cases/war-room/allen-war-room-data-taxonomy-contract.ts",
  "use-cases/war-room/build-allen-war-room-operational-layout-contract.ts",
  "npm run test:allen-war-room-operational-layout",
  "追蹤股不等於持股",
  "系統候選股不等於持股",
  "engineering safety moved away from primary trading view",
];

// ---------------------------------------------------------------------------
// Gate 8: Safety (forbidden token scan)
// ---------------------------------------------------------------------------

const UI_FORBIDDEN = [
  "@supabase",
  "createclient",
  "process.env",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "autoorder",
  "placeorder",
];

// contract / builder: the safety FLAG `autoOrderRequested` legitimately contains
// "autoorder", so only the connection / write tokens are scanned here.
const SPEC_FORBIDDEN = [
  "fetch(",
  "axios",
  "@supabase",
  "createclient",
  "process.env",
  "date.now",
  "new date(",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of UI_FILES) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const lower = stripComments(body).toLowerCase();
    for (const token of UI_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
  }

  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const lower = stripComments(body).toLowerCase();
    for (const token of SPEC_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
  }

  // No new war-room API route added in V60.
  const forbiddenArtifacts = [
    "app/api/portfolio/allen-war-room/route.ts",
    "supabase/allen_war_room.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V60.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "app/api/portfolio/first-authorized-source-dry-run/route.ts",
    "app/api/portfolio/shadow-runner-dry-run/route.ts",
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
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
const noProdReadyCheck = checkNoProductionReady();
const { result: payloadCheck, actualCount, watchCount, candCount, decision } = checkPayload();
const uiCheck = checkUi();
const safetyRelocationCheck = checkSafetyRelocation();
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
  safetyRelocationCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: LayoutSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, LAYOUT_REL, ACTUAL_REL, WATCH_REL, CAND_REL, SESSION_REL, BANNER_REL, HOLDINGS_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    no_production_ready: noProdReadyCheck.status,
    payload_checks: payloadCheck.status,
    ui_checks: uiCheck.status,
    safety_relocation: safetyRelocationCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  actual_position_count: actualCount,
  watchlist_count: watchCount,
  system_candidate_count: candCount,
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
