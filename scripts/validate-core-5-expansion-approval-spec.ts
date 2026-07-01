/**
 * Core 5 Read-Only Expansion Approval Spec Validator — fixture-only / static.
 *
 * Verifies the core 5 approval governance spec: the doc + contract (deterministic, current
 * approved state is EXACTLY 3019, candidate table with 4966/5347/4979/2455 pending, the
 * owner-approval / manual-smoke / production-endpoint gates, red-line flags), that the
 * candidate symbols never leaked into any RUNTIME file (provider / route / MVP contract /
 * dashboard), that the runtime approved set is still exactly ["3019"], and that this guard
 * + related validators stay standalone (safety-chain stays 22).
 *
 * NO network, NO smoke, NO Supabase, NO env read, NO provider change. Standalone.
 * Exit 0 → PASS/WARNING, Exit 1 → FAIL.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const approvalModule = require("../use-cases/war-room/build-core-5-expansion-approval-contract") as typeof import("../use-cases/war-room/build-core-5-expansion-approval-contract");
const mvpModule = require("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract") as typeof import("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildCore5ExpansionApprovalContract } = approvalModule;
const { buildApproved3019LiveQuoteMvpContract } = mvpModule;
const { buildSafetyChainCiGuardContract } = guardModule;

type CheckStatus = "PASS" | "WARNING" | "FAIL";
interface CheckResult { name: string; status: CheckStatus; details: string[]; }

function resolve(...p: string[]): string { return path.resolve(process.cwd(), ...p); }
function readFile(p: string): string | null { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
function fileExists(p: string): boolean { try { return fs.statSync(p).isFile(); } catch { return false; } }
function stripComments(s: string): string { return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); }
function combineStatus(a: CheckStatus[]): CheckStatus { if (a.some((s) => s === "FAIL")) return "FAIL"; if (a.some((s) => s === "WARNING")) return "WARNING"; return "PASS"; }

const checks: CheckResult[] = [];
function pushCheck(name: string, conds: Array<{ ok: boolean; pass: string; fail: string }>): void {
  const details: string[] = [];
  let status: CheckStatus = "PASS";
  for (const c of conds) { if (c.ok) details.push(`PASS  ${c.pass}`); else { details.push(`FAIL  ${c.fail}`); status = "FAIL"; } }
  checks.push({ name, status, details });
}
function arraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean { return a.length === b.length && a.every((v, i) => v === b[i]); }

const DOC_REL = "docs/core-5-read-only-expansion-approval-spec.md";
const CONTRACT_REL = "use-cases/war-room/build-core-5-expansion-approval-contract.ts";
const MVP_CONTRACT_REL = "use-cases/war-room/build-approved-live-quote-3019-mvp-contract.ts";
const ROUTE_REL = "app/api/war-room/approved-live-quote/route.ts";
const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const DASHBOARD_REL = "components/war-room-dashboard.tsx";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const doc = readFile(resolve(DOC_REL)) ?? "";
const contractRaw = readFile(resolve(CONTRACT_REL)) ?? "";
const contractLower = stripComments(contractRaw).toLowerCase();
const mvpContractRaw = readFile(resolve(MVP_CONTRACT_REL)) ?? "";
const routeRaw = readFile(resolve(ROUTE_REL)) ?? "";
const providerRaw = readFile(resolve(PROVIDER_REL)) ?? "";
const dashboard = readFile(resolve(DASHBOARD_REL)) ?? "";
const handoff = readFile(resolve(HANDOFF_REL)) ?? "";
const readme = readFile(resolve(README_REL)) ?? "";
const pkgBody = readFile(resolve(PKG_REL));

// RUNTIME files that must NEVER contain the candidate symbols / proposed channels.
const runtimeCombined = stripComments(mvpContractRaw) + "\n" + stripComments(routeRaw) + "\n" + stripComments(providerRaw) + "\n" + dashboard;

const contract = buildCore5ExpansionApprovalContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const contractB = buildCore5ExpansionApprovalContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const cc = contract as unknown as Record<string, unknown>;
const cands = contract.core5Candidates;
const byId = (s: string) => cands.find((c) => c.symbol === s);
const mvp = buildApproved3019LiveQuoteMvpContract({ generatedAt: "2026-07-02T00:00:00.000Z" });

function noTok(body: string, t: string): boolean { return !body.includes(t); }
const PENDING = ["4966", "5347", "4979", "2455"] as const;

// ---------------------------------------------------------------------------
// 1–3. Files + determinism
// ---------------------------------------------------------------------------
pushCheck("01_doc_exists", [{ ok: fileExists(resolve(DOC_REL)), pass: "spec doc exists.", fail: "spec doc must exist." }]);
pushCheck("02_contract_exists", [{ ok: fileExists(resolve(CONTRACT_REL)), pass: "approval contract exists.", fail: "approval contract must exist." }]);
pushCheck("03_deterministic", [{ ok: JSON.stringify(contract) === JSON.stringify(contractB), pass: "contract deterministic.", fail: "contract must be deterministic." }]);

// ---------------------------------------------------------------------------
// 4–14. Doc content
// ---------------------------------------------------------------------------
pushCheck("04_doc_title", [{ ok: doc.includes("Core 5 Read-Only Expansion Approval Spec"), pass: "doc has title.", fail: "doc must have the title." }]);
pushCheck("05_doc_symbols", [{ ok: ["3019", "4966", "5347", "4979", "2455"].every((s) => doc.includes(s)), pass: "doc lists all 5 symbols.", fail: "doc must list all 5 symbols." }]);
pushCheck("06_doc_names", [{ ok: ["亞光", "譜瑞", "世界", "華星光", "全新"].every((n) => doc.includes(n)), pass: "doc lists all 5 names.", fail: "doc must list all 5 names." }]);
pushCheck("07_doc_current_state", [{ ok: doc.includes('approvedLiveFetchSymbols = ["3019"]'), pass: "doc states approvedLiveFetchSymbols = [3019].", fail: "doc must state approvedLiveFetchSymbols = [3019]." }]);
pushCheck("08_doc_owner_gate", [{ ok: doc.includes("Owner Approval Gate"), pass: "doc includes Owner Approval Gate.", fail: "doc must include Owner Approval Gate." }]);
pushCheck("09_doc_smoke_gate", [{ ok: doc.includes("Manual Smoke Gate"), pass: "doc includes Manual Smoke Gate.", fail: "doc must include Manual Smoke Gate." }]);
pushCheck("10_doc_endpoint_gate", [{ ok: doc.includes("Production Endpoint Case Gate"), pass: "doc includes Production Endpoint Case Gate.", fail: "doc must include Production Endpoint Case Gate." }]);
pushCheck("11_doc_evidence_checklist", [{ ok: doc.includes("Per-Symbol Required Evidence"), pass: "doc includes Per-Symbol Required Evidence.", fail: "doc must include Per-Symbol Required Evidence." }]);
pushCheck("12_doc_workflow", [{ ok: doc.includes("Future Approval Workflow"), pass: "doc includes Future Approval Workflow.", fail: "doc must include Future Approval Workflow." }]);
pushCheck("13_doc_pending", [{ ok: doc.includes("pending_owner_approval"), pass: "doc marks candidates pending_owner_approval.", fail: "doc must mark candidates pending_owner_approval." }]);
pushCheck("14_doc_red_lines", [
  { ok: doc.includes('approved live-fetch symbols remain exactly ["3019"]'), pass: "doc states approvedLiveFetchSymbols exactly [3019].", fail: "doc must state approvedLiveFetchSymbols exactly [3019]." },
  { ok: doc.includes("no /api/portfolio switch"), pass: "doc states no /api/portfolio switch.", fail: "doc must state no /api/portfolio switch." },
  { ok: doc.includes("no Supabase"), pass: "doc states no Supabase.", fail: "doc must state no Supabase." },
  { ok: doc.includes("no broker API"), pass: "doc states no broker API.", fail: "doc must state no broker API." },
  { ok: doc.includes("no auto order"), pass: "doc states no auto order.", fail: "doc must state no auto order." },
  { ok: doc.includes("no production data switch"), pass: "doc states no production data switch.", fail: "doc must state no production data switch." },
]);

// ---------------------------------------------------------------------------
// 15–31. Contract content
// ---------------------------------------------------------------------------
pushCheck("15_spec_version", [{ ok: contract.specVersion === "V1", pass: "specVersion V1.", fail: "specVersion must be V1." }]);
pushCheck("16_current_symbols", [{ ok: arraysEqual(contract.currentApprovedState.approvedLiveFetchSymbols, ["3019"]), pass: "currentApprovedState.approvedLiveFetchSymbols exactly [3019].", fail: "currentApprovedState.approvedLiveFetchSymbols must be exactly [3019]." }]);
pushCheck("17_current_channels", [{ ok: arraysEqual(contract.currentApprovedState.approvedChannels, ["tse_3019.tw"]), pass: "currentApprovedState.approvedChannels exactly [tse_3019.tw].", fail: "currentApprovedState.approvedChannels must be exactly [tse_3019.tw]." }]);
pushCheck("18_provider", [{ ok: contract.currentApprovedState.approvedProvider === "TWSE_TPEX", pass: "approvedProvider TWSE_TPEX.", fail: "approvedProvider must be TWSE_TPEX." }]);
pushCheck("19_candidates_5", [{ ok: cands.length === 5, pass: `core5Candidates length 5 (got ${cands.length}).`, fail: `core5Candidates must be 5 (got ${cands.length}).` }]);
{
  const c = byId("3019");
  pushCheck("20_3019_approved", [{ ok: !!c && c.approvalStatus === "approved" && c.inApprovedLiveFetchSymbols === true && c.ownerApproved === true && c.manualSmokeEvidenceComplete === true && c.productionEndpointEvidenceComplete === true && c.perSymbolValidatorComplete === true && c.channelVerified === true, pass: "3019 approved with all evidence complete.", fail: "3019 must be approved with all evidence complete." }]);
}
for (const [id, sym] of [["21", "4966"], ["22", "5347"], ["23", "4979"], ["24", "2455"]] as const) {
  const c = byId(sym);
  pushCheck(`${id}_${sym}_pending`, [{ ok: !!c && c.approvalStatus === "pending_owner_approval" && c.inApprovedLiveFetchSymbols === false && c.ownerApproved === false && c.manualSmokeEvidenceComplete === false && c.productionEndpointEvidenceComplete === false && c.channelVerified === false, pass: `${sym} pending, not in approved set, evidence false.`, fail: `${sym} must be pending, not in approved set, evidence false.` }]);
}
pushCheck("25_only_3019_in_set", [{ ok: cands.filter((c) => c.inApprovedLiveFetchSymbols).length === 1 && cands.filter((c) => c.inApprovedLiveFetchSymbols)[0].symbol === "3019", pass: "exactly one candidate (3019) in approved set.", fail: "exactly 3019 must be in the approved set." }]);
pushCheck("26_derived_set", [{ ok: arraysEqual(cands.filter((c) => c.inApprovedLiveFetchSymbols).map((c) => c.symbol), ["3019"]), pass: "derived approved set is [3019].", fail: "derived approved set must be [3019]." }]);
pushCheck("27_summary", [{ ok: contract.summary.totalCandidates === 5 && contract.summary.approvedCount === 1 && contract.summary.pendingCount === 4 && contract.summary.inApprovedSetCount === 1, pass: "summary counts correct (5/1/4/1).", fail: "summary counts must be 5/1/4/1." }]);
pushCheck("28_candidate_fields", [{ ok: cands.every((c) => c.requiredEvidenceChecklist.length >= 10 && c.proposedChannel.length > 0), pass: "every candidate has checklist + proposedChannel.", fail: "every candidate must have checklist + proposedChannel." }]);
pushCheck("29_workflow", [{ ok: contract.approvalWorkflow.length >= 6, pass: `approvalWorkflow has ${contract.approvalWorkflow.length} ordered gates.`, fail: "approvalWorkflow must have >= 6 ordered gates." }]);
pushCheck("30_gates_required", [{ ok: contract.ownerApprovalGate.required === true && contract.manualSmokeGate.required === true && contract.productionEndpointCaseGate.required === true && contract.productionEndpointCaseGate.requiredCasesZh.length === 4, pass: "owner/manual/production gates required, 4 endpoint cases.", fail: "owner/manual/production gates must be required with 4 endpoint cases." }]);
pushCheck("31_red_line_flags", [{ ok: cc.liveFetchSymbolAdded === false && cc.approvedSetExpanded === false && cc.newRuntimeChannelAdded === false && cc.realNetworkUsed === false && cc.supabaseConnected === false && cc.envReadPerformed === false && cc.databaseWritePerformed === false && cc.apiRouteCreated === false && cc.brokerApiUsed === false && cc.buySellCommandGenerated === false && cc.autoOrderRequested === false && cc.productionDataSwitched === false && cc.productionTradingReady === false, pass: "all red-line flags false.", fail: "all red-line flags must be false." }]);

// ---------------------------------------------------------------------------
// 32–36. Runtime must NOT expand
// ---------------------------------------------------------------------------
pushCheck("32_runtime_mvp_3019", [{ ok: arraysEqual(mvp.approvedLiveFetchSymbols, ["3019"]) && arraysEqual(mvp.approvedChannels, ["tse_3019.tw"]), pass: "runtime MVP contract still 3019 / tse_3019.tw only.", fail: "runtime MVP contract must remain 3019 / tse_3019.tw only." }]);
pushCheck("33_no_candidate_in_runtime", [{ ok: PENDING.every((s) => !runtimeCombined.includes(s)), pass: "no candidate symbol (4966/5347/4979/2455) leaked into runtime files.", fail: "candidate symbols must not appear in runtime files (provider/route/MVP contract/dashboard)." }]);
pushCheck("34_no_proposed_channel_in_runtime", [{ ok: ["tse_4966", "tse_5347", "otc_4979", "tse_2455"].every((ch) => !runtimeCombined.includes(ch)), pass: "no proposed channel leaked into runtime files.", fail: "proposed channels must not appear in runtime files." }]);
pushCheck("35_provider_scope", [
  { ok: providerRaw.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"'), pass: "provider still restricts symbol to 3019.", fail: "provider must still restrict symbol to 3019." },
  { ok: providerRaw.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "provider still pins channel tse_3019.tw.", fail: "provider must still pin channel tse_3019.tw." },
]);
pushCheck("36_contract_no_runtime_leak", [
  { ok: noTok(contractLower, "fetch("), pass: "approval contract has no fetch(.", fail: "approval contract must not fetch." },
  { ok: noTok(contractLower, "@supabase") && noTok(contractLower, "createclient"), pass: "approval contract has no Supabase.", fail: "approval contract must not use Supabase." },
  { ok: noTok(contractLower, "process.env"), pass: "approval contract has no process.env.", fail: "approval contract must not read process.env." },
  { ok: noTok(contractLower, "insert(") && noTok(contractLower, "upsert(") && noTok(contractLower, ".update("), pass: "approval contract has no DB write.", fail: "approval contract must not write DB." },
  // Usage tokens only — the contract legitimately DECLARES flags like `brokerApiUsed: false`.
  { ok: noTok(contractLower, "broker_api") && noTok(contractLower, "placeorder") && cc.brokerApiUsed === false && cc.buySellCommandGenerated === false, pass: "approval contract has no broker / order usage.", fail: "approval contract must not use broker / order." },
  { ok: noTok(contractLower, "/api/portfolio"), pass: "approval contract has no /api/portfolio.", fail: "approval contract must not touch /api/portfolio." },
  // Usage tokens only — the safetyLabels legitimately say "no Yahoo".
  { ok: noTok(contractLower, "yahoo-readonly-provider") && noTok(contractLower, "yahoo.com") && noTok(contractLower, "query1.finance"), pass: "approval contract has no Yahoo provider/URL.", fail: "approval contract must not add a Yahoo provider/URL." },
]);

// ---------------------------------------------------------------------------
// 37–43. Standalone + chain integrity + docs
// ---------------------------------------------------------------------------
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-02T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }

pushCheck("37_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:core-5-expansion-approval-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-core-5-expansion-approval-spec.ts"'), pass: "package.json has the script.", fail: "package.json must add the script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:core-5-expansion-approval-spec"), pass: "guard NOT in test:safety-chain.", fail: "guard must NOT be in test:safety-chain." },
]);
pushCheck("38_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);
pushCheck("39_mvp_standalone", [{ ok: !safetyChain.includes("test:approved-live-quote-3019-mvp"), pass: "MVP validator remains standalone.", fail: "MVP validator must remain standalone." }]);
pushCheck("40_prod_smoke_standalone", [{ ok: !safetyChain.includes("test:approved-live-quote-3019-production-smoke"), pass: "production-smoke validator remains standalone.", fail: "production-smoke validator must remain standalone." }]);
pushCheck("41_post_deploy_standalone", [{ ok: !safetyChain.includes("test:approved-live-quote-3019-post-deployment-explicit-manual"), pass: "post-deployment validator remains standalone.", fail: "post-deployment validator must remain standalone." }]);
pushCheck("42_handoff_present", [{ ok: fileExists(resolve(HANDOFF_REL)) && handoff.includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." }]);
pushCheck("43_completion_rule", [{ ok: readme.includes("future completed version must include Project Handoff Summary"), pass: "README states the per-version Project Handoff Summary rule.", fail: "README must state the per-version Project Handoff Summary rule." }]);
pushCheck("44_readme_core5", [{ ok: readme.includes("Core 5 Read-Only Expansion Approval Spec"), pass: "README documents the Core 5 approval spec.", fail: "README must document the Core 5 approval spec." }]);

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "CORE_5_READ_ONLY_EXPANSION_APPROVAL_SPEC",
  spec_version: contract.specVersion,
  approved_symbols: contract.currentApprovedState.approvedLiveFetchSymbols,
  approved_channels: contract.currentApprovedState.approvedChannels,
  summary: contract.summary,
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
}, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
