/**
 * Limited Live Fetch — Safety Chain Inventory Snapshot Validator
 *
 * Freezes the current safety-chain inventory: the exact 21 CHAIN_SPECS sourceScripts and
 * their order, the `test:safety-chain` script order (21 chain validators then the CI
 * guard last), the in-chain limited-live-fetch validators, and the manual-only / standalone
 * exclusions. Any future edit that adds, removes, reorders, or pulls a manual-only script
 * into the chain breaks this snapshot.
 *
 * Pure static + in-process contract checks. NO network, NO smoke, NO Supabase, NO env
 * read, NO provider change. Standalone — NOT part of test:safety-chain.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const goldenModule = require("../use-cases/war-room/build-golden-snapshot-contract") as typeof import("../use-cases/war-room/build-golden-snapshot-contract");
const mockModule = require("../use-cases/war-room/build-mock-fetch-boundary-contract") as typeof import("../use-cases/war-room/build-mock-fetch-boundary-contract");
const noFetchModule = require("../use-cases/war-room/build-default-no-fetch-boundary-contract") as typeof import("../use-cases/war-room/build-default-no-fetch-boundary-contract");
const { buildSafetyChainCiGuardContract } = guardModule;
const { buildGoldenSnapshotContract } = goldenModule;
const { buildMockFetchBoundaryContract } = mockModule;
const { buildDefaultNoFetchBoundaryContract } = noFetchModule;

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

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

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

const checks: CheckResult[] = [];

function pushCheck(name: string, conditions: Array<{ ok: boolean; pass: string; fail: string }>): void {
  const details: string[] = [];
  let status: CheckStatus = "PASS";
  for (const c of conditions) {
    if (c.ok) details.push(`PASS  ${c.pass}`);
    else {
      details.push(`FAIL  ${c.fail}`);
      status = "FAIL";
    }
  }
  checks.push({ name, status, details });
}

// ---------------------------------------------------------------------------
// Frozen inventory (the snapshot)
// ---------------------------------------------------------------------------

const EXPECTED_CHAIN_SCRIPTS = [
  "test:allen-war-room-operational-layout",
  "test:allen-score-scoring-model",
  "test:allen-score-deterministic-scoring-engine",
  "test:structured-candidate-trade-plan",
  "test:candidate-price-level-fixture-source",
  "test:descriptor-to-real-quote-mapping",
  "test:authorized-real-quote-field-catalog",
  "test:real-quote-source-conflict-resolution-policy",
  "test:conflict-to-trade-plan-verification",
  "test:downgraded-trade-plan-ui-behavior",
  "test:unified-connection-evidence-ledger",
  "test:evidence-ledger-transition",
  "test:ledger-integrity-rollup",
  "test:phase-2-locked-implementation",
  "test:phase-2b-shadow-comparison-ui-shell",
  "test:staging-shadow-runtime-scaffold",
  "test:limited-live-fetch-dry-run-pr-scope",
  "test:limited-live-fetch-dry-run-implementation",
  "test:limited-live-fetch-golden-snapshot",
  "test:limited-live-fetch-mock-fetch-boundary",
  "test:limited-live-fetch-default-no-fetch-boundary",
];

const GUARD_SCRIPT = "test:safety-chain-ci-guard";
// test:safety-chain runs the 21 chain validators in order, then the CI guard last.
const EXPECTED_SAFETY_CHAIN_ORDER = [...EXPECTED_CHAIN_SCRIPTS, GUARD_SCRIPT];

// Manual-only / standalone scripts that must NEVER be in test:safety-chain.
const EXCLUDED_SCRIPTS = [
  "smoke:limited-live-fetch:3019",
  "test:limited-live-fetch-3019-observation-round-1",
  "test:limited-live-fetch-3019-observation-round-2",
  "test:limited-live-fetch-deterministic-clock",
  "test:limited-live-fetch-safety-chain-inventory",
];

// In-chain limited live fetch validators.
const IN_CHAIN_LLF = [
  "test:limited-live-fetch-dry-run-pr-scope",
  "test:limited-live-fetch-dry-run-implementation",
  "test:limited-live-fetch-golden-snapshot",
  "test:limited-live-fetch-mock-fetch-boundary",
  "test:limited-live-fetch-default-no-fetch-boundary",
];

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const PKG_REL = "package.json";
const DOC_REL = "docs/limited-live-fetch-safety-chain-inventory.md";

const pkgBody = readFile(resolve(PKG_REL));
const providerRaw = readFile(resolve(PROVIDER_REL));
const providerStripped = providerRaw == null ? "" : stripComments(providerRaw);
const providerLower = providerStripped.toLowerCase();

let safetyChainStr = "";
let definedScripts: Record<string, string> = {};
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  definedScripts = pkg.scripts ?? {};
  safetyChainStr = definedScripts["test:safety-chain"] ?? "";
} catch {
  safetyChainStr = "";
}
const safetyChainOrder = [...safetyChainStr.matchAll(/npm run ([^\s&]+)/g)].map((m) => m[1]);

const guard = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
const chainSpecScripts = guard.checks.map((c) => c.sourceScript);

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

// 1. safety-chain total checks exactly 21.
pushCheck("01_total_checks_21", [
  { ok: guard.result.totalChecks === 21, pass: `guard totalChecks === 21 (got ${guard.result.totalChecks}).`, fail: `guard totalChecks must be exactly 21 (got ${guard.result.totalChecks}).` },
]);

// 2. CHAIN_SPECS length exactly 21.
pushCheck("02_chain_specs_length_21", [
  { ok: guard.checks.length === 21, pass: `CHAIN_SPECS length === 21 (got ${guard.checks.length}).`, fail: `CHAIN_SPECS length must be exactly 21 (got ${guard.checks.length}).` },
]);

// 3. package.json test:safety-chain includes the 21 chain scripts.
pushCheck("03_chain_scripts_present", [
  { ok: EXPECTED_CHAIN_SCRIPTS.every((s) => safetyChainOrder.includes(s)), pass: "test:safety-chain includes all 21 chain scripts.", fail: "test:safety-chain must include all 21 chain scripts." },
]);

// 4. package.json test:safety-chain script order fixed (21 chain + guard last).
pushCheck("04_chain_script_order_fixed", [
  { ok: arraysEqual(safetyChainOrder, EXPECTED_SAFETY_CHAIN_ORDER), pass: "test:safety-chain script order matches the frozen inventory (21 + guard last).", fail: `test:safety-chain order drifted. Expected ${JSON.stringify(EXPECTED_SAFETY_CHAIN_ORDER)}, got ${JSON.stringify(safetyChainOrder)}.` },
]);

// 5. CHAIN_SPECS name order fixed.
pushCheck("05_chain_specs_order_fixed", [
  { ok: arraysEqual(chainSpecScripts, EXPECTED_CHAIN_SCRIPTS), pass: "CHAIN_SPECS sourceScript order matches the frozen inventory.", fail: `CHAIN_SPECS order drifted. Expected ${JSON.stringify(EXPECTED_CHAIN_SCRIPTS)}, got ${JSON.stringify(chainSpecScripts)}.` },
]);

// 6. CHAIN_SPECS includes the limited live fetch implementation/safety + boundary validators.
pushCheck("06_chain_specs_include_llf", [
  { ok: IN_CHAIN_LLF.every((s) => chainSpecScripts.includes(s)), pass: "CHAIN_SPECS includes pr-scope, implementation, golden, mock, default-no-fetch.", fail: "CHAIN_SPECS must include all limited live fetch in-chain validators." },
]);

// 7–9. golden / mock / default-no-fetch remain in safety-chain.
pushCheck("07_golden_in_chain", [
  { ok: safetyChainOrder.includes("test:limited-live-fetch-golden-snapshot") && chainSpecScripts.includes("test:limited-live-fetch-golden-snapshot"), pass: "Golden snapshot validator in safety chain.", fail: "Golden snapshot validator must be in safety chain." },
]);
pushCheck("08_mock_in_chain", [
  { ok: safetyChainOrder.includes("test:limited-live-fetch-mock-fetch-boundary") && chainSpecScripts.includes("test:limited-live-fetch-mock-fetch-boundary"), pass: "Mock fetch boundary validator in safety chain.", fail: "Mock fetch boundary validator must be in safety chain." },
]);
pushCheck("09_default_no_fetch_in_chain", [
  { ok: safetyChainOrder.includes("test:limited-live-fetch-default-no-fetch-boundary") && chainSpecScripts.includes("test:limited-live-fetch-default-no-fetch-boundary"), pass: "Default no-fetch boundary validator in safety chain.", fail: "Default no-fetch boundary validator must be in safety chain." },
]);

// 10–14. Manual-only / standalone scripts remain OUTSIDE safety-chain (and CHAIN_SPECS).
for (const [idx, script] of EXCLUDED_SCRIPTS.entries()) {
  const id = String(10 + idx).padStart(2, "0");
  pushCheck(`${id}_excluded_${script.replace(/[^a-z0-9]/gi, "_")}`, [
    { ok: !safetyChainOrder.includes(script), pass: `${script} NOT in test:safety-chain.`, fail: `${script} must NOT be in test:safety-chain.` },
    { ok: !chainSpecScripts.includes(script), pass: `${script} NOT in CHAIN_SPECS.`, fail: `${script} must NOT be in CHAIN_SPECS.` },
  ]);
}

// 15. safety-chain CI guard runs last in test:safety-chain.
pushCheck("15_guard_last", [
  { ok: safetyChainOrder[safetyChainOrder.length - 1] === GUARD_SCRIPT, pass: `${GUARD_SCRIPT} runs last in test:safety-chain.`, fail: `${GUARD_SCRIPT} must run last in test:safety-chain (got ${safetyChainOrder[safetyChainOrder.length - 1]}).` },
]);

// 16–21. Approved scope (provider static scan).
pushCheck("16_symbol_3019", [
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"'), pass: "Approved symbol remains 3019.", fail: "Approved symbol must remain 3019." },
]);
pushCheck("17_channel", [
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "Approved channel remains tse_3019.tw.", fail: "Approved channel must remain tse_3019.tw." },
]);
pushCheck("18_timeout_3000", [
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_TIMEOUT_MS = 3000"), pass: "timeoutMs remains 3000.", fail: "timeoutMs must remain 3000." },
]);
pushCheck("19_max_retries_0", [
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_MAX_RETRIES = 0"), pass: "maxRetries remains 0.", fail: "maxRetries must remain 0." },
]);
pushCheck("20_get_only", [
  { ok: providerLower.includes('method: "get"'), pass: "GET only remains.", fail: "GET only must remain." },
]);
pushCheck("21_dryrun_default_false", [
  { ok: providerStripped.includes("options?.dryRunLiveFetch === true"), pass: "dryRunLiveFetch default=false (explicit opt-in required).", fail: "dryRunLiveFetch must default to false." },
]);

// 22–24. Boundary contracts represent their safe markers.
const golden = buildGoldenSnapshotContract({ generatedAt: "2026-06-23T00:00:00.000Z" }) as unknown as Record<string, unknown>;
const mock = buildMockFetchBoundaryContract({ generatedAt: "2026-06-23T00:00:00.000Z" }) as unknown as Record<string, unknown>;
const noFetch = buildDefaultNoFetchBoundaryContract({ generatedAt: "2026-06-23T00:00:00.000Z" }) as unknown as Record<string, unknown>;
pushCheck("22_default_fetch_count_0", [
  { ok: noFetch.defaultPathFetchCallCount === 0 && noFetch.explicitDryRunFalseFetchCallCount === 0, pass: "Default no-fetch contract: default + explicit-false fetch call count = 0.", fail: "Default no-fetch contract must represent fetch call count = 0." },
]);
pushCheck("23_mock_real_network_false", [
  { ok: mock.realNetworkUsed === false, pass: "Mock fetch boundary contract: realNetworkUsed=false.", fail: "Mock fetch boundary contract must represent realNetworkUsed=false." },
]);
pushCheck("24_golden_live_fetch_false", [
  { ok: golden.liveFetchPerformed === false, pass: "Golden snapshot contract: liveFetchPerformed=false.", fail: "Golden snapshot contract must represent liveFetchPerformed=false." },
]);

// 25–29. Non-operational / production flags across the three boundary contracts + guard.
const guardRec = guard as unknown as Record<string, unknown>;
pushCheck("25_29_non_operational_flags", [
  { ok: golden.productionDataSwitchAllowed === false && mock.productionDataSwitchAllowed === false && noFetch.productionDataSwitchAllowed === false, pass: "productionDataSwitchAllowed=false across boundary contracts.", fail: "productionDataSwitchAllowed must be false across boundary contracts." },
  { ok: golden.operationalUseAllowed === false && mock.operationalUseAllowed === false && noFetch.operationalUseAllowed === false, pass: "operationalUseAllowed=false across boundary contracts.", fail: "operationalUseAllowed must be false." },
  { ok: golden.buySellCommandGenerated === false && mock.buySellCommandGenerated === false && noFetch.buySellCommandGenerated === false, pass: "buySellCommandGenerated=false across boundary contracts.", fail: "buySellCommandGenerated must be false." },
  { ok: golden.autoOrderRequested === false && mock.autoOrderRequested === false && noFetch.autoOrderRequested === false, pass: "autoOrderRequested=false across boundary contracts.", fail: "autoOrderRequested must be false." },
  { ok: golden.productionReady === false && mock.productionReady === false && noFetch.productionReady === false && guardRec.productionReady === false, pass: "productionReady=false across boundary contracts + guard.", fail: "productionReady must be false." },
]);

// 30–38. Provider safety boundary (no expansion).
const FORBIDDEN_SYMBOLS = ["4966", "5347", "4979", "2455", "2743"];
pushCheck("30_38_provider_safety_boundary", [
  { ok: FORBIDDEN_SYMBOLS.every((s) => !providerStripped.includes(s)), pass: "No new symbol beyond 3019.", fail: "No new symbol may be added." },
  { ok: !providerLower.includes("yahoo"), pass: "No Yahoo.", fail: "No Yahoo." },
  { ok: !fileExists(resolve("app/api/market-data/route.ts")) && !fileExists(resolve("app/api/live-fetch/route.ts")) && !fileExists(resolve("app/api/portfolio/live-fetch/route.ts")), pass: "No new API route.", fail: "No new API route." },
  { ok: !providerStripped.includes("/api/portfolio"), pass: "No /api/portfolio switch.", fail: "No /api/portfolio switch." },
  { ok: !providerLower.includes("@supabase") && !providerLower.includes("createclient"), pass: "No Supabase.", fail: "No Supabase." },
  { ok: !providerLower.includes("process.env"), pass: "No process.env.", fail: "No process.env." },
  { ok: !providerLower.includes("brokerapi") && !providerLower.includes("broker_api"), pass: "No broker API.", fail: "No broker API." },
  { ok: !providerLower.includes("placeorder"), pass: "No buy/sell command.", fail: "No buy/sell command." },
  { ok: !providerLower.includes("autoorder("), pass: "No auto order.", fail: "No auto order." },
]);

// 39. No manual smoke in safety-chain (re-assert at the inventory level).
pushCheck("39_no_smoke_in_chain", [
  { ok: !safetyChainStr.includes("smoke:limited-live-fetch:3019"), pass: "No manual smoke in test:safety-chain.", fail: "Manual smoke must not be in test:safety-chain." },
]);

// 40. In-chain limited live fetch validators are offline / mock-only (no live fetch).
pushCheck("40_in_chain_validators_offline", [
  { ok: golden.offline === true && mock.offline === true && noFetch.offline === true, pass: "In-chain golden / mock / default-no-fetch contracts are offline=true.", fail: "In-chain boundary contracts must be offline=true." },
  { ok: mock.mockFetchOnly === true && noFetch.realNetworkUsed === false, pass: "Mock fetch only + default path uses no real network.", fail: "In-chain validators must be mock-only / no real network." },
]);

// 41. Inventory validator itself NOT in chain + doc + script exist.
pushCheck("41_inventory_standalone_and_files", [
  { ok: !safetyChainOrder.includes("test:limited-live-fetch-safety-chain-inventory"), pass: "Inventory validator NOT in safety chain (standalone).", fail: "Inventory validator must NOT be in safety chain." },
  { ok: fileExists(resolve(DOC_REL)), pass: "Inventory doc exists.", fail: "Inventory doc must exist." },
  { ok: pkgBody != null && pkgBody.includes('"test:limited-live-fetch-safety-chain-inventory": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-safety-chain-inventory.ts"'), pass: "package.json has the inventory script.", fail: "package.json must add the inventory script." },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const summary = {
  status: overallStatus,
  spec: "LIMITED_LIVE_FETCH_SAFETY_CHAIN_INVENTORY",
  frozen_total_checks: 21,
  guard_total_checks: guard.result.totalChecks,
  chain_specs_length: guard.checks.length,
  safety_chain_order: safetyChainOrder,
  chain_spec_scripts: chainSpecScripts,
  excluded_scripts: EXCLUDED_SCRIPTS,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  operationalUseAllowed: false,
  productionReady: false,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
