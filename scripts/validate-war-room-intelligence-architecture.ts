/**
 * War Room Intelligence Architecture Validator — V18C
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

// export {} isolates this file as a TypeScript module, preventing global const
// collisions with other script files that also use the CJS require() pattern.
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

interface WarRoomArchitectureSummary {
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
  cron_created: false;
  push_notification_created: false;
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

const ARCH_DOC_REL = "docs/war-room-intelligence-architecture.md";
const FORMULA_DOC_REL = "docs/portfolio-valuation-formula.md";
const SPEC_DOC_REL = "docs/portfolio-valuation-radar-spec.md";
const CONTRACT_REL = "use-cases/war-room/war-room-intelligence-contract.ts";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "War Room Intelligence Architecture doc (new)", rel: ARCH_DOC_REL },
    { label: "Portfolio valuation formula doc", rel: FORMULA_DOC_REL },
    { label: "Portfolio valuation radar spec", rel: SPEC_DOC_REL },
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

  // Contract is optional, but if present it is validated in the safety gate.
  if (fileExists(resolve(CONTRACT_REL))) {
    details.push(`PASS  Optional contract present: ${CONTRACT_REL}.`);
  } else {
    details.push(`WARNING  Optional contract not present: ${CONTRACT_REL}.`);
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "required_files", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 2: Required phrases
// ---------------------------------------------------------------------------

const REQUIRED_PHRASES: string[] = [
  "War Room Intelligence Architecture",
  "盤前",
  "盤中",
  "盤後",
  "即時",
  "PREMARKET",
  "INTRADAY",
  "POSTMARKET",
  "REALTIME_ALERT",
  "Institutional Research Center",
  "Technical Strategy Engine",
  "Risk Reward Engine",
  "Intraday Alert Engine",
  "Pullback Reason Classifier",
  "War Room Read Model",
  "Portfolio Valuation Radar",
  "估值便宜不等於高風報比",
  "法人研究評級不等於買點",
  "盤中警報不等於出場",
  "扣三低",
  "KD",
  "KDJ",
  "風報比",
  "TOP5",
  "1080x1920",
  "dataQualityStatus 非 PASS",
  "不自動下單",
  "不產生買賣指令",
  "資料不足",
];

// ---------------------------------------------------------------------------
// Gate 3: Boundary checks
// ---------------------------------------------------------------------------

const BOUNDARY_PHRASES: string[] = [
  "Research Center 不直接產生買點",
  "Technical Strategy Engine 不假裝基本面良好",
  "Valuation Radar 不直接等於 actionSignal",
  "Intraday Alert 不等於買賣指令",
  "War Room Read Model 不自己創造資料",
];

// ---------------------------------------------------------------------------
// Gate 4: Safety checks
// ---------------------------------------------------------------------------

// Forbidden runtime tokens that must NOT appear in the War Room contract file.
// The contract is types-only: no fetch, no Supabase client, no env reads.
const FORBIDDEN_CONTRACT_TOKENS: Array<{ token: string; label: string }> = [
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

  // 4a. Contract file (if present) must contain no forbidden runtime tokens.
  if (fileExists(resolve(CONTRACT_REL))) {
    const contract = readFile(resolve(CONTRACT_REL));
    if (contract == null) {
      issues.push(`FAIL  Cannot read ${CONTRACT_REL}.`);
    } else {
      const lower = contract.toLowerCase();
      for (const { token, label } of FORBIDDEN_CONTRACT_TOKENS) {
        if (lower.includes(token.toLowerCase())) {
          issues.push(`FAIL  Forbidden token "${label}" found in ${CONTRACT_REL}.`);
        } else {
          details.push(`PASS  No "${label}" in ${CONTRACT_REL}.`);
        }
      }
      // Contract must carry the read-only safety invariant flags.
      for (const flag of [
        "requestPerformed: false",
        "supabaseConnected: false",
        "productionWritePerformed: false",
      ]) {
        if (contract.includes(flag)) {
          details.push(`PASS  Contract declares "${flag}".`);
        } else {
          issues.push(`FAIL  Contract missing read-only flag "${flag}".`);
        }
      }
    }
  } else {
    details.push(`PASS  No contract file to scan (optional).`);
  }

  // 4b. No new SQL migration for war-room snapshots.
  const forbiddenMigrations = [
    "supabase/war_room_intelligence.sql",
    "supabase/v85_war_room_intelligence.sql",
    "supabase/intraday_index_snapshots.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V18C.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 4c. No new API route / UI component for war-room intelligence.
  const forbiddenRuntimeArtifacts = [
    "app/api/war-room/route.ts",
    "app/api/war-room-intelligence/route.ts",
    "components/war-room-intelligence.tsx",
    "components/war-room-read-model.tsx",
  ];
  for (const rel of forbiddenRuntimeArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime artifact ${rel} must not exist in V18C.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 4d. Protected layers must still be present (not deleted / refactored).
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

const archBody = readFile(resolve(ARCH_DOC_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms(
  "required_phrases",
  archBody,
  ARCH_DOC_REL,
  REQUIRED_PHRASES,
);
const boundaryCheck = checkTerms(
  "boundary_checks",
  archBody,
  ARCH_DOC_REL,
  BOUNDARY_PHRASES,
);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [fileCheck, phraseCheck, boundaryCheck, safetyCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: WarRoomArchitectureSummary = {
  status: overallStatus,
  checked_files: [ARCH_DOC_REL, FORMULA_DOC_REL, SPEC_DOC_REL, CONTRACT_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    boundary_checks: boundaryCheck.status,
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
  cron_created: false,
  push_notification_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
