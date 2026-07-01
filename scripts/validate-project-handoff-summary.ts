/**
 * Project Handoff Summary Validator — static analysis only
 *
 * Verifies the project handoff summary + red-lines/roadmap docs exist and carry the
 * required sections (current production commit, safety-chain status, permanent red lines,
 * current phase restrictions, future allowed direction, UI language rule, required
 * handoff rule, auto scanner roadmap), that README documents the per-version handoff
 * rule, and that this guard + smoke stay out of test:safety-chain (which stays 22).
 *
 * Pure static read of docs / README / package.json. NO network, NO smoke, NO Supabase,
 * NO env read, NO provider change. Standalone — NOT part of test:safety-chain.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildSafetyChainCiGuardContract } = guardModule;

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

function combineStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.some((s) => s === "FAIL")) return "FAIL";
  if (statuses.some((s) => s === "WARNING")) return "WARNING";
  return "PASS";
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
// Paths + load
// ---------------------------------------------------------------------------

const SUMMARY_REL = "docs/project-handoff-summary.md";
const ROADMAP_REL = "docs/project-red-lines-and-roadmap.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const summary = readFile(resolve(SUMMARY_REL));
const roadmap = readFile(resolve(ROADMAP_REL));
const readme = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

function summaryHas(term: string): boolean {
  return summary != null && summary.includes(term);
}
function roadmapHas(term: string): boolean {
  return roadmap != null && roadmap.includes(term);
}

// 1–2. Docs exist.
pushCheck("01_summary_exists", [
  { ok: fileExists(resolve(SUMMARY_REL)), pass: "project-handoff-summary.md exists.", fail: "project-handoff-summary.md must exist." },
]);
pushCheck("02_roadmap_exists", [
  { ok: fileExists(resolve(ROADMAP_REL)), pass: "project-red-lines-and-roadmap.md exists.", fail: "project-red-lines-and-roadmap.md must exist." },
]);

// 3–12. Handoff summary required sections / tokens.
const SUMMARY_TERMS = [
  "Project Handoff Summary",
  "production commit",
  "0cbd450",
  "safety-chain",
  "22 checks",
  "Permanent Red Lines",
  "Current Phase Restrictions",
  "Future Allowed Direction",
  "UI Language Rule",
  "Required Handoff Rule",
];
pushCheck("03_12_summary_sections", SUMMARY_TERMS.map((t) => ({
  ok: summaryHas(t),
  pass: `Summary contains 「${t}」.`,
  fail: `Summary must contain 「${t}」.`,
})));

// 13–16. Roadmap required tokens.
const ROADMAP_TERMS = ["Auto Scanner Roadmap", "扣三低", "走多", "候選股"];
pushCheck("13_16_roadmap_tokens", ROADMAP_TERMS.map((t) => ({
  ok: roadmapHas(t),
  pass: `Roadmap contains 「${t}」.`,
  fail: `Roadmap must contain 「${t}」.`,
})));

// 17. README documents the per-version handoff rule.
pushCheck("17_readme_handoff_rule", [
  { ok: readme != null && readme.includes("future completed version must include Project Handoff Summary"), pass: "README states future completed version must include Project Handoff Summary.", fail: "README must state that every future completed version must include Project Handoff Summary." },
]);

// 18–19 & 21. package.json script present + guard/smoke not in safety-chain.
let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}
pushCheck("18_package_script", [
  { ok: pkgBody != null && pkgBody.includes('"test:project-handoff-summary": "node --require ./scripts/register-typescript.cjs ./scripts/validate-project-handoff-summary.ts"'), pass: "package.json has test:project-handoff-summary.", fail: "package.json must add test:project-handoff-summary." },
]);
pushCheck("19_guard_not_in_chain", [
  { ok: safetyChain.length > 0, pass: "test:safety-chain present.", fail: "test:safety-chain must exist." },
  { ok: !safetyChain.includes("test:project-handoff-summary"), pass: "Handoff guard NOT in test:safety-chain (standalone).", fail: "Handoff guard must NOT be in test:safety-chain." },
]);
pushCheck("21_smoke_not_in_chain", [
  { ok: !safetyChain.includes("smoke:limited-live-fetch:3019"), pass: "Smoke script NOT in test:safety-chain.", fail: "Smoke script must NOT be in test:safety-chain." },
]);

// 20. Safety-chain total remains 22.
let totalChecks = -1;
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}
pushCheck("20_safety_chain_22", [
  { ok: totalChecks === 22, pass: `Safety chain CI guard remains 22 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must remain 22 checks (got ${totalChecks}).` },
]);

// Red-line wording split into permanent vs current-phase (both docs).
pushCheck("22_red_line_split", [
  { ok: summaryHas("Permanent Red Lines") && summaryHas("Current Phase Restrictions"), pass: "Summary splits permanent red lines vs current phase restrictions.", fail: "Summary must split permanent red lines vs current phase restrictions." },
  { ok: roadmapHas("永久紅線") && roadmapHas("目前階段性限制") && roadmapHas("未來允許方向"), pass: "Roadmap splits 永久紅線 / 目前階段性限制 / 未來允許方向.", fail: "Roadmap must split 永久紅線 / 目前階段性限制 / 未來允許方向." },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const out = {
  status: overallStatus,
  spec: "PROJECT_HANDOFF_SUMMARY",
  production_commit: "0cbd450",
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
};

console.log(JSON.stringify(out, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
