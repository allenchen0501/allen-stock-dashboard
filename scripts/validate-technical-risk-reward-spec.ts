/**
 * Technical + Risk Reward Strategy Spec Validator — V18E
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - start a Next.js server
 *   - make any HTTP request
 *   - connect to Supabase
 *   - read environment keys
 *   - write data
 *   - create an API route
 *   - create a UI component
 *   - compute technical indicators / fetch K-line data
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

interface TechnicalRiskRewardSpecSummary {
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
  technical_runtime_created: false;
  kline_runtime_created: false;
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

const SPEC_DOC_REL = "docs/technical-risk-reward-strategy-spec.md";
const CONTRACT_REL = "use-cases/technical-strategy/technical-risk-reward-contract.ts";
const ARCH_DOC_REL = "docs/war-room-intelligence-architecture.md";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Technical + Risk Reward Strategy Spec (new)", rel: SPEC_DOC_REL },
    { label: "Technical Risk Reward Contract (new)", rel: CONTRACT_REL },
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
  "Technical + Risk Reward Strategy Engine",
  "扣三低",
  "KD",
  "KDJ",
  "MACD",
  "5MA",
  "10MA",
  "20MA",
  "週 30MA",
  "日 200MA",
  "量縮回測",
  "爆量轉強",
  "支撐區",
  "壓力區",
  "invalidLevel",
  "風報比",
  "1:3",
  "1:4",
  "1:5",
  "低檔高風報比候選 TOP5",
  "高風報比不等於基本面好",
  "KD 低檔不等於買點",
  "MACD 轉強不等於買點",
  "TOP5 Technical Candidates 不等於買進清單",
  "不自動下單",
  "不產生買賣指令",
  "dataQualityStatus 非 PASS",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "TechnicalSetupType",
  "TechnicalDataQualityStatus",
  "RiskRewardGrade",
  "CandidateDecisionBoundary",
  "TechnicalSetupSnapshot",
  "RiskRewardSnapshot",
  "TechnicalRiskRewardCandidate",
  "DEDUCTION_THREE_LOW",
  "KD_LOW_TURN_UP",
  "KDJ_LOW_TURN_UP",
  "MACD_MOMENTUM_RECOVERY",
  "WEEKLY_30MA_SUPPORT",
  "DAILY_200MA_SUPPORT",
  "VOLUME_CONTRACTION_PULLBACK",
  "VOLUME_BREAKOUT",
  "RISK_REWARD_QUALIFIED",
  "OBSERVATION_ONLY",
  "NO_TOUCH",
  "notEntrySignal",
  "notTradeAdvice",
  "requestPerformed",
  "supabaseConnected",
  "productionWritePerformed",
];

// ---------------------------------------------------------------------------
// Gate 4: Architecture alignment
// ---------------------------------------------------------------------------

const ARCH_ALIGNMENT_TERMS: string[] = [
  "Technical Strategy Engine",
  "Risk Reward Engine",
  "低檔高風報比候選",
  "扣三低",
  "風報比",
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
  { token: "tradingview", label: "TradingView runtime" },
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 5a. Contract file must contain no forbidden runtime tokens (code only).
  if (fileExists(resolve(CONTRACT_REL))) {
    const contract = readFile(resolve(CONTRACT_REL));
    if (contract == null) {
      issues.push(`FAIL  Cannot read ${CONTRACT_REL}.`);
    } else {
      const codeOnly = contract
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      const lower = codeOnly.toLowerCase();
      for (const { token, label } of FORBIDDEN_RUNTIME_TOKENS) {
        if (lower.includes(token.toLowerCase())) {
          issues.push(`FAIL  Forbidden token "${label}" found in ${CONTRACT_REL}.`);
        } else {
          details.push(`PASS  No "${label}" in ${CONTRACT_REL} code.`);
        }
      }
    }
  }

  // 5b. No new SQL migration for technical strategy.
  const forbiddenMigrations = [
    "supabase/technical_strategy.sql",
    "supabase/v88_technical_strategy.sql",
    "supabase/kline_snapshots.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V18E.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5c. No new API route / UI component for technical strategy.
  const forbiddenRuntimeArtifacts = [
    "app/api/technical/route.ts",
    "app/api/technical-strategy/route.ts",
    "app/technical/page.tsx",
    "components/technical-strategy.tsx",
    "components/technical-risk-reward.tsx",
  ];
  for (const rel of forbiddenRuntimeArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime artifact ${rel} must not exist in V18E.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5d. No K-line / technical indicator runtime.
  const forbiddenTechnicalRuntime = [
    "services/technical/kline-provider.ts",
    "services/technical/indicator-engine.ts",
    "lib/technical/kd-engine.ts",
    "lib/technical/macd-engine.ts",
    "lib/technical/risk-reward-engine.ts",
  ];
  for (const rel of forbiddenTechnicalRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Technical runtime ${rel} must not exist in V18E.`);
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

const summary: TechnicalRiskRewardSpecSummary = {
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
  api_route_created: false,
  ui_created: false,
  technical_runtime_created: false,
  kline_runtime_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
