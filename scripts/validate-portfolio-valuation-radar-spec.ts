/**
 * Portfolio Valuation Radar Spec Validator — V15
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - connect to Supabase
 *   - read environment keys
 *   - make any HTTP request
 *   - create an API route
 *   - create a SQL migration
 *   - read or write real portfolio data
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

interface ValuationRadarSpecSummary {
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

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

const REQUIRED_FILES: Array<{ label: string; rel: string }> = [
  {
    label: "Portfolio Valuation Radar spec (new)",
    rel: "docs/portfolio-valuation-radar-spec.md",
  },
  {
    label: "Schema boundary decisions",
    rel: "docs/schema-boundary-decisions.md",
  },
  {
    label: "Portfolio API switch guard",
    rel: "docs/portfolio-api-switch-guard.md",
  },
];

function checkRequiredFiles(): CheckResult {
  const missing: string[] = [];
  for (const { label, rel } of REQUIRED_FILES) {
    if (!fileExists(resolve(rel))) {
      missing.push(`FAIL  Missing: ${rel} (${label})`);
    }
  }
  if (missing.length > 0) {
    return { name: "required_files", status: "FAIL", details: missing };
  }
  return {
    name: "required_files",
    status: "PASS",
    details: [`PASS  All ${REQUIRED_FILES.length} required files present.`],
  };
}

// ---------------------------------------------------------------------------
// Gate 2: Spec completeness
// ---------------------------------------------------------------------------

const SPEC_REQUIRED_TERMS: Array<{ term: RegExp; label: string }> = [
  {
    term: /Portfolio\s+Valuation\s+Radar/i,
    label: "Portfolio Valuation Radar module",
  },
  { term: /Market\s+Temperature/i, label: "Market Temperature module" },
  { term: /Stock\s+Research\s+Snapshot/i, label: "Stock Research Snapshot module" },
  { term: /Event\s+Radar/i, label: "Event Radar module" },
  { term: /Warm\s+Risk\s+Reminder/i, label: "Warm Risk Reminder module" },
  {
    term: /portfolio\.valuationSummary/i,
    label: "portfolio.valuationSummary API name",
  },
  {
    term: /market\.temperature/i,
    label: "market.temperature API name",
  },
  {
    term: /stock\.researchSnapshot/i,
    label: "stock.researchSnapshot API name",
  },
  {
    term: /events\.radar/i,
    label: "events.radar API name",
  },
  {
    term: /riskReminders\.list/i,
    label: "riskReminders.list API name",
  },
  { term: /valuationTier/i, label: "valuationTier field" },
  { term: /actionSignal/i, label: "actionSignal field" },
  { term: /dataQualityStatus/i, label: "dataQualityStatus field" },
  { term: /stock_valuation_snapshots/i, label: "stock_valuation_snapshots table candidate" },
  { term: /現在不建|不新增.*stock_valuation|stock_valuation.*不建|現在不建表/i, label: "明確標記現在不建" },
  {
    term: /特價不等於可立即買進|特價.*不等於.*買進|不等於可立即買進/i,
    label: "特價不等於可立即買進",
  },
  {
    term: /高股價不等於昂貴|高.*股價.*不等於.*昂貴/i,
    label: "高股價不等於昂貴",
  },
  {
    term: /低股價不等於便宜|低.*股價.*不等於.*便宜/i,
    label: "低股價不等於便宜",
  },
  { term: /owner_id/i, label: "owner_id safety design" },
  { term: /\bRLS\b/i, label: "RLS" },
  { term: /hardcoded\s+fallback|fallback.*hardcoded/i, label: "hardcoded fallback" },
  { term: /no\s+VIP|不做\s*VIP/i, label: "no VIP" },
  { term: /no\s+search\s+limit|不做.*search\s+limit/i, label: "no search limit" },
  { term: /V16\s+Promotion\s+Gate|Promotion\s+Gate.*V16/i, label: "V16 Promotion Gate" },
];

function checkSpecCompleteness(): CheckResult {
  const filePath = resolve("docs/portfolio-valuation-radar-spec.md");
  const doc = readFile(filePath);
  if (!doc) {
    return {
      name: "spec_completeness",
      status: "FAIL",
      details: ["FAIL  Cannot read docs/portfolio-valuation-radar-spec.md."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  for (const { term, label } of SPEC_REQUIRED_TERMS) {
    if (term.test(doc)) {
      details.push(`PASS  "${label}" present in spec.`);
    } else {
      issues.push(
        `FAIL  "${label}" not found in docs/portfolio-valuation-radar-spec.md.`,
      );
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "spec_completeness", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 3: Boundary alignment
// ---------------------------------------------------------------------------

const BOUNDARY_TERMS: Array<{ term: RegExp; label: string }> = [
  {
    term: /不新增.*SQL\s*migration|不得.*新增.*migration|no.*new.*sql.*migration|本階段不.*migration/i,
    label: "不新增 SQL migration",
  },
  {
    term: /不新增\s*stock_valuation_snapshots|stock_valuation_snapshots.*現在不建|現在不建.*stock_valuation/i,
    label: "不新增 stock_valuation_snapshots",
  },
  {
    term: /不.*平行.*取代.*v85_pro_plus_scores|不.*v85_pro_plus_scores.*平行|不得平行取代/i,
    label: "不平行取代 v85_pro_plus_scores",
  },
  {
    term: /valuationTier.*spec.only|spec.only.*valuationTier|本階段.*spec.only/i,
    label: "valuationTier 目前 spec-only",
  },
  {
    term: /actionSignal.*不得.*自動.*下單|不得.*自動.*下單|不.*自動.*產生.*買賣指令|不得觸發.*買賣/i,
    label: "actionSignal 不得自動下單",
  },
  {
    term: /不.*產生.*公開.*投資建議|不.*公開.*推薦|不作為.*公開.*投資建議/i,
    label: "不產生公開投資建議",
  },
];

function checkBoundaryAlignment(): CheckResult {
  const filePath = resolve("docs/portfolio-valuation-radar-spec.md");
  const doc = readFile(filePath);
  if (!doc) {
    return {
      name: "boundary_alignment",
      status: "FAIL",
      details: ["FAIL  Cannot read docs/portfolio-valuation-radar-spec.md."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  for (const { term, label } of BOUNDARY_TERMS) {
    if (term.test(doc)) {
      details.push(`PASS  "${label}" confirmed in spec.`);
    } else {
      issues.push(
        `FAIL  "${label}" not confirmed in docs/portfolio-valuation-radar-spec.md.`,
      );
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return {
    name: "boundary_alignment",
    status,
    details: [...details, ...issues],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fileCheck = checkRequiredFiles();
const specCheck = checkSpecCompleteness();
const boundaryCheck = checkBoundaryAlignment();

const allChecks: CheckResult[] = [fileCheck, specCheck, boundaryCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: ValuationRadarSpecSummary = {
  status: overallStatus,
  checked_files: REQUIRED_FILES.map((f) => f.rel),
  gates: {
    required_files: fileCheck.status,
    spec_completeness: specCheck.status,
    boundary_alignment: boundaryCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
