/**
 * Intraday Risk Alert Spec Validator — V18F
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - start a Next.js server
 *   - make any HTTP request
 *   - connect to Supabase
 *   - read environment keys
 *   - write data
 *   - create a cron
 *   - create a push notification runtime
 *   - create an API route
 *   - create a UI component
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface IntradayAlertSpecSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  cron_created: false;
  push_notification_created: false;
  api_route_created: false;
  ui_created: false;
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SPEC_DOC_REL = "docs/intraday-risk-crisis-alert-spec.md";
const CONTRACT_REL = "use-cases/intraday-alert/intraday-alert-contract.ts";
const ARCH_DOC_REL = "docs/war-room-intelligence-architecture.md";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Intraday Risk Crisis Alert Spec (new)", rel: SPEC_DOC_REL },
    { label: "Intraday Alert Contract (new)", rel: CONTRACT_REL },
    { label: "War Room Intelligence Architecture doc", rel: ARCH_DOC_REL },
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
// Gate 2: Required phrases in spec doc
// ---------------------------------------------------------------------------

const REQUIRED_PHRASES: string[] = [
  "盤中風險危機告警系統",
  "事件驅動型警報",
  "大盤急跌警報",
  "大盤急漲警報",
  "持股急跌警報",
  "持股急漲警報",
  "族群警報",
  "5 分鐘內跌超過 250 點",
  "15 分鐘內跌超過 500 點",
  "5 分鐘急拉 250 點",
  "3 分鐘內跌超過 2%",
  "5 分鐘內跌超過 3%",
  "3019 亞光",
  "4966 譜瑞",
  "2743 山富",
  "跌破 160",
  "跌破 680",
  "跌破 67",
  "DATA_INSUFFICIENT",
  "不自動下單",
  "不是買賣指令",
  "Yahoo / yfinance-like 資料不得作為唯一正式來源",
  "dataQualityStatus 非 PASS 時",
  "fallback-only data 不得獨立觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "cooldown",
  "dedup",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "IntradayAlertLevel",
  "IntradayAlertType",
  "IntradayAlertScope",
  "IntradayAlertPayload",
  "MARKET_CRASH",
  "MARKET_SURGE",
  "HOLDING_CRASH",
  "HOLDING_SURGE",
  "SUPPORT_BREAK",
  "RESISTANCE_BREAK",
  "VOLUME_ANOMALY",
  "BREADTH_DIVERGENCE",
  "SECTOR_WEAKNESS",
  "SECTOR_SURGE_DIVERGENCE",
  "requestPerformed",
  "supabaseConnected",
  "productionWritePerformed",
];

// ---------------------------------------------------------------------------
// Gate 4: Architecture alignment
// ---------------------------------------------------------------------------

const ARCH_ALIGNMENT_TERMS: string[] = [
  "Intraday Alert Engine",
  "Realtime Alert Center",
  "stale data cannot trigger DANGER",
  "fallback-only data cannot trigger DANGER",
];

// ---------------------------------------------------------------------------
// Gate 5: Safety checks
// ---------------------------------------------------------------------------

const FORBIDDEN_RUNTIME_TOKENS: Array<{ token: string; label: string }> = [
  { token: "fetch(", label: "fetch( call" },
  { token: "axios", label: "axios import/usage" },
  { token: "createClient", label: "Supabase createClient" },
  { token: "@supabase", label: "@supabase import" },
  { token: "process.env", label: "env secret read" },
  { token: "yfinance", label: "yfinance runtime" },
  { token: "finmind", label: "FinMind runtime" },
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 5a. Contract file must contain no forbidden runtime tokens.
  if (fileExists(resolve(CONTRACT_REL))) {
    const contract = readFile(resolve(CONTRACT_REL));
    if (contract == null) {
      issues.push(`FAIL  Cannot read ${CONTRACT_REL}.`);
    } else {
      const lower = contract.toLowerCase();
      for (const { token, label } of FORBIDDEN_RUNTIME_TOKENS) {
        if (lower.includes(token.toLowerCase())) {
          issues.push(`FAIL  Forbidden token "${label}" found in ${CONTRACT_REL}.`);
        } else {
          details.push(`PASS  No "${label}" in ${CONTRACT_REL}.`);
        }
      }
    }
  }

  // 5b. No new SQL migration for intraday-alert.
  const forbiddenMigrations = [
    "supabase/intraday_alert_snapshots.sql",
    "supabase/v86_intraday_alert.sql",
    "supabase/intraday_index_snapshots.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V18F.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5c. No new API route / UI component for intraday-alert.
  const forbiddenRuntimeArtifacts = [
    "app/api/intraday-alert/route.ts",
    "app/api/intraday-risk-alert/route.ts",
    "components/intraday-alert.tsx",
    "components/intraday-risk-alert.tsx",
  ];
  for (const rel of forbiddenRuntimeArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime artifact ${rel} must not exist in V18F.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5d. No new cron / push notification implementation.
  const forbiddenCronArtifacts = [
    "scripts/intraday-alert-cron.ts",
    "scripts/intraday-alert-push.ts",
    "lib/cron/intraday-alert.ts",
  ];
  for (const rel of forbiddenCronArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Cron/push artifact ${rel} must not exist in V18F.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5e. Protected layers must still be present.
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} still present (not modified/deleted).`);
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

const specBody = readFile(resolve(SPEC_DOC_REL));
const contractBody = readFile(resolve(CONTRACT_REL));
const archBody = readFile(resolve(ARCH_DOC_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms(
  "required_phrases",
  specBody,
  SPEC_DOC_REL,
  REQUIRED_PHRASES,
);
const contractCheck = checkTerms(
  "contract_checks",
  contractBody,
  CONTRACT_REL,
  CONTRACT_TERMS,
);
const archAlignCheck = checkTerms(
  "architecture_alignment",
  archBody,
  ARCH_DOC_REL,
  ARCH_ALIGNMENT_TERMS,
);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  archAlignCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: IntradayAlertSpecSummary = {
  status: overallStatus,
  checked_files: [SPEC_DOC_REL, CONTRACT_REL, ARCH_DOC_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    architecture_alignment: archAlignCheck.status,
    safety: safetyCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  cron_created: false,
  push_notification_created: false,
  api_route_created: false,
  ui_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
