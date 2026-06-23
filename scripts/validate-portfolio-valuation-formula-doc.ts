/**
 * Portfolio Valuation Formula Documentation Validator — V18-alt
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - start a Next.js server
 *   - make any HTTP request
 *   - connect to Supabase
 *   - read environment keys
 *   - write data
 *   - read real portfolio holdings
 *   - implement any valuation formula
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

interface FormulaDocSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  formula_implemented: false;
  api_behavior_changed: false;
  sql_migration_created: false;
  stock_valuation_snapshots_created: false;
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

/**
 * Runs a literal-substring presence check across a document body.
 * Each term must appear verbatim (exact match) in the document.
 */
function checkTerms(
  name: string,
  body: string | null,
  fileLabel: string,
  terms: string[],
): CheckResult {
  if (body == null) {
    return {
      name,
      status: "FAIL",
      details: [`FAIL  Cannot read ${fileLabel}.`],
    };
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

const FORMULA_DOC_REL = "docs/portfolio-valuation-formula.md";
const SPEC_DOC_REL = "docs/portfolio-valuation-radar-spec.md";
const API_DOC_REL = "docs/portfolio-valuation-summary-api.md";
const VALUATION_TIER_REL = "use-cases/portfolio/valuation-tier.ts";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

const REQUIRED_FILES: Array<{ label: string; rel: string }> = [
  { label: "Portfolio valuation formula doc (new)", rel: FORMULA_DOC_REL },
  { label: "Portfolio valuation radar spec", rel: SPEC_DOC_REL },
  { label: "Portfolio valuation summary API doc", rel: API_DOC_REL },
  { label: "Valuation tier pure functions", rel: VALUATION_TIER_REL },
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
// Gate 2: Formula doc required terms
// ---------------------------------------------------------------------------

const FORMULA_REQUIRED_TERMS: string[] = [
  "normalizedEPS",
  "estimatedEPS",
  "ttmEPS",
  "peP10",
  "peP25",
  "peP50",
  "peP75",
  "peP90",
  "deepCheapPrice",
  "cheapPrice",
  "fairPrice",
  "expensivePrice",
  "crazyPrice",
  "特價",
  "便宜",
  "合理",
  "昂貴",
  "瘋狂",
  "資料不足",
  "特價 不等於可立即買進",
  "高股價不等於昂貴",
  "低股價不等於便宜",
  "EPS <= 0",
  "景氣循環股",
  "P/B",
  "P/S",
  "EV/EBITDA",
  "不新增 stock_valuation_snapshots",
  "不產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 3: Boundary alignment (formula doc)
// ---------------------------------------------------------------------------

const FORMULA_BOUNDARY_TERMS: string[] = [
  "不連 Supabase",
  "不新增 SQL migration",
  "不實作公式",
  "不改 API 行為",
  "不新增 stock_valuation_snapshots",
  "不直接輸出 actionSignal",
  "valuationTier 不得直接等於 actionSignal",
  "dataQualityStatus 非 PASS 時必須保守",
];

// ---------------------------------------------------------------------------
// Gate 4: API doc alignment
// ---------------------------------------------------------------------------

const API_DOC_TERMS: string[] = [
  "Formula Status",
  "V18-alt",
  "valuationTier 預設仍是 資料不足",
  "actionSignal 預設仍是 資料不足",
  "不改 API 行為",
];

// ---------------------------------------------------------------------------
// Gate 5: Spec doc alignment
// ---------------------------------------------------------------------------

const SPEC_DOC_TERMS: string[] = [
  "Valuation Formula Reference",
  "docs/portfolio-valuation-formula.md",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const formulaBody = readFile(resolve(FORMULA_DOC_REL));
const specBody = readFile(resolve(SPEC_DOC_REL));
const apiBody = readFile(resolve(API_DOC_REL));

const fileCheck = checkRequiredFiles();
const formulaTermsCheck = checkTerms(
  "formula_required_terms",
  formulaBody,
  FORMULA_DOC_REL,
  FORMULA_REQUIRED_TERMS,
);
const boundaryCheck = checkTerms(
  "boundary_alignment",
  formulaBody,
  FORMULA_DOC_REL,
  FORMULA_BOUNDARY_TERMS,
);
const apiDocCheck = checkTerms("api_doc_alignment", apiBody, API_DOC_REL, API_DOC_TERMS);
const specDocCheck = checkTerms("spec_doc_alignment", specBody, SPEC_DOC_REL, SPEC_DOC_TERMS);

const allChecks: CheckResult[] = [
  fileCheck,
  formulaTermsCheck,
  boundaryCheck,
  apiDocCheck,
  specDocCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: FormulaDocSummary = {
  status: overallStatus,
  checked_files: REQUIRED_FILES.map((f) => f.rel),
  gates: {
    required_files: fileCheck.status,
    formula_required_terms: formulaTermsCheck.status,
    boundary_alignment: boundaryCheck.status,
    api_doc_alignment: apiDocCheck.status,
    spec_doc_alignment: specDocCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  formula_implemented: false,
  api_behavior_changed: false,
  sql_migration_created: false,
  stock_valuation_snapshots_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
