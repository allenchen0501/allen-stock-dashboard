/**
 * System Safety UI Language Guard Validator — static analysis only
 *
 * Verifies that the user-visible system safety UI stays Traditional Chinese: the page
 * heading and section/card titles are Chinese-primary, required Chinese keywords are
 * present, monitoring component titles are Chinese-primary (English tech name only inside
 * parentheses), the shadow comparison card keeps its Chinese warning, no obvious
 * pure-English UI title leaks back in, and booleans are rendered via zhBool() rather than
 * raw true / false. Technical identifiers / contract keys are allowed alongside Chinese.
 *
 * Pure static read of UI files. NO network, NO smoke, NO Supabase, NO env read, NO
 * provider change. Standalone — NOT part of test:safety-chain (which stays 22 checks).
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

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function combineStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.some((s) => s === "FAIL")) return "FAIL";
  if (statuses.some((s) => s === "WARNING")) return "WARNING";
  return "PASS";
}

const CJK = /[一-鿿]/;

/** Extract the inner text of every <h2>…</h2> block, with JSX tags/braces stripped. */
function extractH2Texts(body: string): string[] {
  const out: string[] = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const inner = m[1]
      .replace(/\{[^}]*\}/g, "") // drop JSX expressions
      .replace(/<[^>]*>/g, "") // drop nested tags
      .replace(/\s+/g, " ")
      .trim();
    if (inner.length > 0) out.push(inner);
  }
  return out;
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

const PAGE_REL = "app/system/safety/page.tsx";
const CARD_REL = "components/war-room/shadow-quote-comparison-card.tsx";
const MONITORING_RELS = [
  "components/runtime-pilot-readiness.tsx",
  "components/runtime-pilot-monitoring.tsx",
  "components/first-authorized-source-dry-run-monitoring.tsx",
  "components/shadow-runner-dry-run-monitoring.tsx",
];
const ALL_UI_RELS = [PAGE_REL, CARD_REL, ...MONITORING_RELS];
const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const PKG_REL = "package.json";
const DOC_REL = "docs/system-safety-ui-language-guard.md";

const page = readFile(resolve(PAGE_REL));
const card = readFile(resolve(CARD_REL));
const pkgBody = readFile(resolve(PKG_REL));
const providerRaw = readFile(resolve(PROVIDER_REL));
const providerStripped = providerRaw == null ? "" : stripComments(providerRaw);
const providerLower = providerStripped.toLowerCase();

// 1. Page exists.
pushCheck("01_page_exists", [
  { ok: fileExists(resolve(PAGE_REL)), pass: "System safety page exists.", fail: "System safety page must exist." },
]);

// 2. The five directly-rendered UI components exist.
pushCheck("02_components_exist", [
  { ok: fileExists(resolve(CARD_REL)), pass: "Shadow comparison card exists.", fail: "Shadow comparison card must exist." },
  ...MONITORING_RELS.map((rel) => ({ ok: fileExists(resolve(rel)), pass: `${rel} exists.`, fail: `${rel} must exist.` })),
]);

// 3. Page heading contains 工程安全監控 or 系統安全監控.
pushCheck("03_page_heading_chinese", [
  { ok: page != null && (page.includes("工程安全監控") || page.includes("系統安全監控")), pass: "Page heading contains 工程安全監控 / 系統安全監控.", fail: "Page heading must contain 工程安全監控 or 系統安全監控." },
]);

// 4. Required Traditional Chinese keywords on the page.
const REQUIRED_KEYWORDS = [
  "工程安全監控", "系統安全監控", "安全鏈", "黃金快照", "模擬請求", "預設不請求",
  "逾時", "中止", "人工簽核", "正式切換", "不可作為正式操作依據",
];
pushCheck("04_required_keywords", REQUIRED_KEYWORDS.map((k) => ({
  ok: page != null && page.includes(k),
  pass: `Page contains 「${k}」.`,
  fail: `Page must contain 「${k}」.`,
})));

// 5. Monitoring component h2 titles are Chinese-primary (English tech name only in parens).
const monitoringConds: Array<{ ok: boolean; pass: string; fail: string }> = [];
for (const rel of MONITORING_RELS) {
  const body = readFile(resolve(rel));
  const h2s = body == null ? [] : extractH2Texts(body);
  const title = h2s[0] ?? "";
  const chineseFirst = CJK.test(title.charAt(0));
  // Any English run that sits OUTSIDE parentheses is disallowed; English is only allowed
  // inside （ ... ） / ( ... ).
  const outsideParens = title.replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "");
  const englishOutsideParens = /[A-Za-z]{2,}/.test(outsideParens);
  monitoringConds.push({
    ok: title.length > 0 && chineseFirst && !englishOutsideParens,
    pass: `${rel} h2 is Chinese-primary（「${title}」）.`,
    fail: `${rel} h2 must be Chinese-primary with English only in parentheses（got「${title}」）.`,
  });
}
pushCheck("05_monitoring_titles_chinese_primary", monitoringConds);

// 6. Shadow comparison card keeps its Chinese warning.
pushCheck("06_card_chinese_warning", [
  { ok: card != null && card.includes("此卡僅為介面外殼"), pass: "Card contains Chinese warning 「此卡僅為介面外殼」.", fail: "Card must contain a Chinese warning（此卡僅為介面外殼）." },
  { ok: card != null && card.includes("無買賣指令"), pass: "Card contains 「無買賣指令」.", fail: "Card must contain 「無買賣指令」." },
]);

// 7. No obvious pure-English UI title.
//    (a) Fully-removed English titles must be absent from the page entirely.
const FORBIDDEN_ENGLISH_TITLES_ABSENT = [
  "Engineering Safety",
  "Allen Score Engine / Trade Plan Consistency",
  "Timeout Boundary Validator",
  "Mock Fetch Boundary",
  "Default No-Fetch Boundary",
];
//    (b) Every <h2> on the page must contain CJK (no pure-English title, even if an
//        English technical name is kept in parentheses).
const pageH2s = page == null ? [] : extractH2Texts(page);
const pureEnglishH2s = pageH2s.filter((t) => !CJK.test(t));
const cond7: Array<{ ok: boolean; pass: string; fail: string }> = [
  { ok: pageH2s.length > 0, pass: `Page has ${pageH2s.length} <h2> titles.`, fail: "Page must have <h2> titles." },
  { ok: pureEnglishH2s.length === 0, pass: "No pure-English <h2> title on the page.", fail: `Pure-English <h2> title(s) found: ${pureEnglishH2s.join(" | ")}.` },
];
for (const t of FORBIDDEN_ENGLISH_TITLES_ABSENT) {
  cond7.push({ ok: page != null && !page.includes(t), pass: `Page does not contain pure-English title 「${t}」.`, fail: `Page must not contain pure-English title 「${t}」.` });
}
pushCheck("07_no_pure_english_title", cond7);

// 8. No direct true / false UI display on the canonical localized surfaces (page + card):
//    booleans are rendered via zhBool(), not {String(…)}. (The monitoring components'
//    internal technical readouts are localized at the title level here; their deeper
//    boolean readouts are a documented follow-up — see docs/system-safety-ui-language-guard.md.)
const PRIMARY_LOCALIZED = [PAGE_REL, CARD_REL];
const stringJsxHits = PRIMARY_LOCALIZED.filter((rel) => {
  const b = readFile(resolve(rel));
  return b != null && b.includes("{String(");
});
pushCheck("08_no_raw_boolean_display", [
  { ok: page != null && page.includes("zhBool"), pass: "Page uses zhBool() for boolean display.", fail: "Page must use zhBool() for boolean display." },
  { ok: card != null && card.includes("zhBool"), pass: "Card uses zhBool() for boolean display.", fail: "Card must use zhBool() for boolean display." },
  { ok: stringJsxHits.length === 0, pass: "No raw {String(…)} boolean display in page + card.", fail: `Raw {String(…)} display present in: ${stringJsxHits.join(", ")}.` },
  { ok: page != null && !/>\s*(true|false)\s*</.test(page), pass: "No literal >true</ / >false< text on the page.", fail: "Page must not render literal true / false text." },
]);

// 9. Technical identifiers are allowed but accompanied by Chinese (overall density check).
//    The page legitimately keeps tokens like operationalUseAllowed / NO_GO; assert each
//    appears together with a Chinese gloss somewhere on the page.
const TOKEN_GLOSS: Array<[string, string]> = [
  ["operationalUseAllowed", "操作允許"],
  ["NO_GO", "不可放行"],
  ["READY_FOR_CI_GUARD", "CI 防護已就緒"],
  ["productionReady", "正式就緒"],
];
pushCheck("09_tokens_have_chinese_gloss", TOKEN_GLOSS.map(([tok, gloss]) => ({
  ok: page != null && (!page.includes(tok) || page.includes(gloss)),
  pass: page != null && page.includes(tok) ? `Token 「${tok}」 has Chinese gloss 「${gloss}」.` : `Token 「${tok}」 not present (ok).`,
  fail: `Token 「${tok}」 must be accompanied by Chinese gloss 「${gloss}」.`,
})));

// 10. Safety-chain total remains 22.
let totalChecks = -1;
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}
pushCheck("10_safety_chain_22", [
  { ok: totalChecks === 22, pass: `Safety chain CI guard remains 22 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must remain 22 checks (got ${totalChecks}).` },
]);

// 11–12. UI language guard + smoke must NOT be in test:safety-chain.
let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}
pushCheck("11_guard_not_in_chain", [
  { ok: safetyChain.length > 0, pass: "test:safety-chain present.", fail: "test:safety-chain must exist." },
  { ok: !safetyChain.includes("test:system-safety-ui-language"), pass: "UI language guard NOT in test:safety-chain (standalone).", fail: "UI language guard must NOT be in test:safety-chain." },
]);
pushCheck("12_smoke_not_in_chain", [
  { ok: !safetyChain.includes("smoke:limited-live-fetch:3019"), pass: "Smoke script NOT in test:safety-chain.", fail: "Smoke script must NOT be in test:safety-chain." },
]);

// 13. Provider runtime unchanged (approved shape intact).
pushCheck("13_provider_runtime_unchanged", [
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"'), pass: "Provider still pins approved symbol 3019.", fail: "Provider must still pin approved symbol 3019." },
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "Provider still pins channel tse_3019.tw.", fail: "Provider must still pin channel tse_3019.tw." },
]);

// 14–22. Scope safety boundary (provider scan + no API route artifacts).
const FORBIDDEN_SYMBOLS = ["4966", "5347", "4979", "2455", "2743"];
pushCheck("14_22_scope_boundary", [
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

// 23. Doc + script exist.
pushCheck("23_doc_and_script", [
  { ok: fileExists(resolve(DOC_REL)), pass: "UI language guard doc exists.", fail: "UI language guard doc must exist." },
  { ok: pkgBody != null && pkgBody.includes('"test:system-safety-ui-language": "node --require ./scripts/register-typescript.cjs ./scripts/validate-system-safety-ui-language.ts"'), pass: "package.json has the UI language guard script.", fail: "package.json must add the UI language guard script." },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const summary = {
  status: overallStatus,
  spec: "SYSTEM_SAFETY_UI_LANGUAGE_GUARD",
  page_h2_count: pageH2s.length,
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

console.log(JSON.stringify(summary, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
