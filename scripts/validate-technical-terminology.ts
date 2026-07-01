/**
 * Technical Terminology Guard.
 *
 * Scans README / docs / scripts / use-cases for common terminology typos and ensures
 * the correct Traditional Chinese term is used in user-facing handoff surfaces.
 *
 * Standalone - NOT part of test:safety-chain.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildSafetyChainCiGuardContract } = guardModule;

type CheckStatus = "PASS" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

const CORRECT_TERM = "扣三低";
const FORBIDDEN_TERMS = ["柯三弟", "柯三低", "扣三弟", "柯三地"] as const;
const TARGET_ROOTS = ["README.md", "docs", "scripts", "use-cases"];
// Only this guard file may contain the forbidden typos (in the FORBIDDEN_TERMS list).
const ALLOWED_FORBIDDEN_TERM_FILES = new Set([
  "scripts/validate-technical-terminology.ts",
]);

const checks: CheckResult[] = [];

function resolve(...parts: string[]): string {
  return path.resolve(process.cwd(), ...parts);
}

function toRel(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
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

function walk(dir: string, extensions: Set<string>, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(next, extensions, out);
    } else if (extensions.has(path.extname(entry.name))) {
      out.push(next);
    }
  }
}

function targetFiles(): string[] {
  const files: string[] = [];
  for (const root of TARGET_ROOTS) {
    const abs = resolve(root);
    if (root === "README.md") files.push(abs);
    else {
      const ext = root === "docs" ? new Set([".md"]) : new Set([".ts"]);
      walk(abs, ext, files);
    }
  }
  return files;
}

function pushCheck(name: string, conditions: Array<{ ok: boolean; pass: string; fail: string }>): void {
  const details: string[] = [];
  let status: CheckStatus = "PASS";
  for (const condition of conditions) {
    if (condition.ok) details.push(`PASS  ${condition.pass}`);
    else {
      status = "FAIL";
      details.push(`FAIL  ${condition.fail}`);
    }
  }
  checks.push({ name, status, details });
}

const files = targetFiles();
const violations: Array<{ file: string; term: string }> = [];

for (const file of files) {
  const rel = toRel(file);
  const body = readFile(file) ?? "";
  if (ALLOWED_FORBIDDEN_TERM_FILES.has(rel)) continue;
  for (const term of FORBIDDEN_TERMS) {
    if (body.includes(term)) violations.push({ file: rel, term });
  }
}

const readme = readFile(resolve("README.md"));
const handoff = readFile(resolve("docs/project-handoff-summary.md"));
let safetyChain = "";
let totalChecks = -1;
try {
  const pkg = JSON.parse(readFile(resolve("package.json")) ?? "{}") as { scripts?: Record<string, string> };
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-01T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}

pushCheck("01_scans_expected_scope", [
  { ok: files.some((file) => toRel(file) === "README.md"), pass: "README.md scanned.", fail: "README.md must be scanned." },
  { ok: files.some((file) => toRel(file).startsWith("docs/")), pass: "docs/**/*.md scanned.", fail: "docs/**/*.md must be scanned." },
  { ok: files.some((file) => toRel(file).startsWith("scripts/")), pass: "scripts/**/*.ts scanned.", fail: "scripts/**/*.ts must be scanned." },
  { ok: files.some((file) => toRel(file).startsWith("use-cases/")), pass: "use-cases/**/*.ts scanned.", fail: "use-cases/**/*.ts must be scanned." },
]);

pushCheck("02_no_forbidden_terms", [
  {
    ok: violations.length === 0,
    pass: "No forbidden terminology typos outside allowed fixture validator/contract files.",
    fail: `Forbidden terminology typos found: ${violations.map((item) => `${item.file}:${item.term}`).join(", ")}`,
  },
]);

pushCheck("03_handoff_correct_term", [
  { ok: handoff != null && handoff.includes(CORRECT_TERM), pass: "Project handoff summary uses correct term.", fail: "Project handoff summary must use correct term 扣三低." },
]);

pushCheck("04_readme_correct_term", [
  { ok: readme != null && readme.includes(CORRECT_TERM), pass: "README uses correct term.", fail: "README must use correct term 扣三低." },
]);

pushCheck("05_validator_standalone", [
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:technical-terminology"), pass: "technical terminology validator not in test:safety-chain.", fail: "technical terminology validator must remain standalone." },
]);

pushCheck("06_safety_chain_22", [
  { ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` },
]);

const status: CheckStatus = checks.some((check) => check.status === "FAIL") ? "FAIL" : "PASS";
const issues = checks.flatMap((check) => check.details.filter((line) => line.startsWith("FAIL")));

console.log(JSON.stringify({
  status,
  spec: "TECHNICAL_TERMINOLOGY_GUARD",
  correct_term: CORRECT_TERM,
  forbidden_terms: FORBIDDEN_TERMS,
  scanned_file_count: files.length,
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((check) => check.status === "PASS").length,
  failed_checks: checks.filter((check) => check.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((check) => [check.name, check.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
}, null, 2));

process.exit(status === "FAIL" ? 1 : 0);
