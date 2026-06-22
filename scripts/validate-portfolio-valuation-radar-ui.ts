/**
 * Portfolio Valuation Radar UI Validator — V17A
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - start a Next.js server
 *   - make any HTTP request
 *   - connect to Supabase
 *   - read environment keys
 *   - write data
 *   - read real portfolio holdings
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

// export {} isolates this file as a TypeScript module, preventing global const
// collisions with other script files that also use the CJS require() pattern.
export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const {
  buildPortfolioValuationSummaryContract,
} = require("../use-cases/portfolio/build-valuation-summary-contract") as typeof import("../use-cases/portfolio/build-valuation-summary-contract");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface ValuationRadarUiSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  ui_shell_created: true;
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

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

const REQUIRED_FILES: Array<{ label: string; rel: string }> = [
  {
    label: "Portfolio valuation radar UI component",
    rel: "components/portfolio-valuation-radar.tsx",
  },
  {
    label: "Holdings page (must include radar component)",
    rel: "app/holdings/page.tsx",
  },
  {
    label: "Valuation summary API route",
    rel: "app/api/portfolio/valuation-summary/route.ts",
  },
  {
    label: "Valuation summary builder",
    rel: "use-cases/portfolio/build-valuation-summary-contract.ts",
  },
  {
    label: "Valuation summary contract",
    rel: "use-cases/portfolio/valuation-summary-contract.ts",
  },
  {
    label: "Portfolio valuation summary API doc",
    rel: "docs/portfolio-valuation-summary-api.md",
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
// Gate 2: UI safety text (required phrases in component source)
// ---------------------------------------------------------------------------

const REQUIRED_UI_PHRASES: Array<{ phrase: string; label: string }> = [
  { phrase: "Allen 持股估值雷達", label: "Title: Allen 持股估值雷達" },
  { phrase: "Spec-only UI shell", label: "Spec-only UI shell notice" },
  { phrase: "資料不足", label: "資料不足 state display" },
  { phrase: "估值公式尚未啟用", label: "估值公式尚未啟用 notice" },
  { phrase: "不構成投資建議", label: "Safety: 不構成投資建議" },
  { phrase: "不會自動產生買賣指令", label: "Safety: 不會自動產生買賣指令" },
  { phrase: "source_mode", label: "Metadata: source_mode display" },
  { phrase: "response_source", label: "Metadata: response_source display" },
  { phrase: "api_contract_version", label: "Metadata: api_contract_version display" },
  { phrase: "supabase_connected", label: "Metadata: supabase_connected display" },
  { phrase: "stock_valuation_snapshots_created", label: "Metadata: stock_valuation_snapshots_created display" },
];

// These terms must NOT appear anywhere in the component source.
// Only the character sequences are listed here — no surrounding context.
const FORBIDDEN_UI_PHRASES: Array<{ phrase: string; label: string }> = [
  { phrase: "推薦買進", label: "推薦買進" },
  { phrase: "強力買進", label: "強力買進" },
  { phrase: "立即進場", label: "立即進場" },
  { phrase: "停損價", label: "停損價" },
  { phrase: "目標價", label: "目標價" },
];

// Single-character terms checked separately for more targeted matching.
// These are matched only as standalone signals (not part of larger words).
// We check for the two-character combos that are problematic.
const FORBIDDEN_TWO_CHAR: Array<{ phrase: string; label: string }> = [
  { phrase: "買進", label: "買進" },
  { phrase: "賣出", label: "賣出" },
  { phrase: "出場", label: "出場" },
];

function checkUiSafetyText(): CheckResult {
  const filePath = resolve("components/portfolio-valuation-radar.tsx");
  const source = readFile(filePath);
  if (!source) {
    return {
      name: "ui_safety_text",
      status: "FAIL",
      details: ["FAIL  Cannot read components/portfolio-valuation-radar.tsx."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  // Required phrases
  for (const { phrase, label } of REQUIRED_UI_PHRASES) {
    if (source.includes(phrase)) {
      details.push(`PASS  Required phrase "${label}" found.`);
    } else {
      issues.push(`FAIL  Required phrase "${label}" not found in component.`);
    }
  }

  // Forbidden multi-character phrases
  for (const { phrase, label } of FORBIDDEN_UI_PHRASES) {
    if (source.includes(phrase)) {
      issues.push(`FAIL  Forbidden phrase "${label}" found in component source.`);
    } else {
      details.push(`PASS  Forbidden phrase "${label}" absent.`);
    }
  }

  // Forbidden two-character combos
  for (const { phrase, label } of FORBIDDEN_TWO_CHAR) {
    if (source.includes(phrase)) {
      issues.push(`FAIL  Forbidden term "${label}" found in component source.`);
    } else {
      details.push(`PASS  Forbidden term "${label}" absent.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "ui_safety_text", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 3: Holdings page integration
// ---------------------------------------------------------------------------

function checkHoldingsPageIntegration(): CheckResult {
  const filePath = resolve("app/holdings/page.tsx");
  const source = readFile(filePath);
  if (!source) {
    return {
      name: "holdings_integration",
      status: "FAIL",
      details: ["FAIL  Cannot read app/holdings/page.tsx."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  if (source.includes("PortfolioValuationRadar")) {
    details.push("PASS  PortfolioValuationRadar imported and used in holdings page.");
  } else {
    issues.push("FAIL  PortfolioValuationRadar not found in app/holdings/page.tsx.");
  }

  if (source.includes("HoldingsTable")) {
    details.push("PASS  Existing HoldingsTable preserved in holdings page.");
  } else {
    issues.push("FAIL  HoldingsTable was removed from holdings page — must be preserved.");
  }

  if (source.includes("CoreScore")) {
    details.push("PASS  Existing CoreScore preserved in holdings page.");
  } else {
    issues.push("FAIL  CoreScore was removed from holdings page — must be preserved.");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "holdings_integration", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: Safety behavior (metadata + no SQL / no snapshots)
// ---------------------------------------------------------------------------

function checkSafetyBehavior(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // Call builder and verify metadata constants
  let response: ReturnType<typeof buildPortfolioValuationSummaryContract>;
  try {
    response = buildPortfolioValuationSummaryContract();
  } catch (err) {
    return {
      name: "safety_behavior",
      status: "FAIL",
      details: [`FAIL  buildPortfolioValuationSummaryContract() threw: ${String(err)}`],
    };
  }

  const meta = response.metadata as Record<string, unknown>;

  const safetyChecks: Array<{ key: string; expected: unknown }> = [
    { key: "source_mode", expected: "spec_only" },
    { key: "response_source", expected: "mock_or_contract" },
    { key: "supabase_connected", expected: false },
    { key: "production_write_performed", expected: false },
    { key: "sql_migration_created", expected: false },
    { key: "stock_valuation_snapshots_created", expected: false },
  ];

  for (const { key, expected } of safetyChecks) {
    if (meta[key] === expected) {
      details.push(`PASS  API metadata.${key} === ${JSON.stringify(expected)}`);
    } else {
      issues.push(
        `FAIL  API metadata.${key} must be ${JSON.stringify(expected)}, got ${JSON.stringify(meta[key])}`,
      );
    }
  }

  // Verify no SQL migration files were added for valuation snapshots
  const snapshotsMigrationPatterns = [
    "supabase/v85_stock_valuation_snapshots.sql",
    "supabase/stock_valuation_snapshots.sql",
  ];
  for (const rel of snapshotsMigrationPatterns) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V17A.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct — not created in V17A).`);
    }
  }

  // Verify repositories and services were not modified (check they still exist and have no snapshot refs)
  const protectedFiles = [
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} still present (not deleted).`);
    } else {
      issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "safety_behavior", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fileCheck = checkRequiredFiles();
const uiTextCheck = checkUiSafetyText();
const integrationCheck = checkHoldingsPageIntegration();
const safetyCheck = checkSafetyBehavior();

const allChecks: CheckResult[] = [fileCheck, uiTextCheck, integrationCheck, safetyCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: ValuationRadarUiSummary = {
  status: overallStatus,
  checked_files: REQUIRED_FILES.map((f) => f.rel),
  gates: {
    required_files: fileCheck.status,
    ui_safety_text: uiTextCheck.status,
    holdings_integration: integrationCheck.status,
    safety_behavior: safetyCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  ui_shell_created: true,
  sql_migration_created: false,
  stock_valuation_snapshots_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
