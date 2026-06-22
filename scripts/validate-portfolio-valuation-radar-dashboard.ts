/**
 * Portfolio Valuation Radar Dashboard Validator — V17C
 *
 * Fixture-only check for Dashboard integration. Does NOT:
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

interface DashboardSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  dashboard_summary_created: true;
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
    label: "Portfolio valuation radar summary (dashboard component)",
    rel: "components/portfolio-valuation-radar-summary.tsx",
  },
  {
    label: "Portfolio valuation radar (holdings component)",
    rel: "components/portfolio-valuation-radar.tsx",
  },
  {
    label: "Dashboard page",
    rel: "app/page.tsx",
  },
  {
    label: "Holdings page",
    rel: "app/holdings/page.tsx",
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
    label: "Portfolio valuation radar UI doc",
    rel: "docs/portfolio-valuation-radar-ui.md",
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
// Gate 2: Dashboard summary required phrases
// ---------------------------------------------------------------------------

const REQUIRED_SUMMARY_PHRASES: Array<{ phrase: string; label: string }> = [
  { phrase: "持股估值雷達摘要", label: "Title: 持股估值雷達摘要" },
  { phrase: "V17C Dashboard preview", label: "V17C Dashboard preview notice" },
  { phrase: "spec_only", label: "Metadata: spec_only" },
  { phrase: "mock_or_contract", label: "Metadata: mock_or_contract" },
  { phrase: "Supabase disabled", label: "Status bar: Supabase disabled" },
  { phrase: "Write false", label: "Status bar: Write false" },
  { phrase: "公式未啟用", label: "Tier 資料不足 → 公式未啟用 label" },
  { phrase: "合約階段", label: "DataQuality WARNING → 合約階段 label" },
  { phrase: "等待資料", label: "ActionSignal 資料不足 → 等待資料 label" },
  { phrase: "查看完整持股估值雷達", label: "CTA link text" },
];

const FORBIDDEN_SUMMARY_PHRASES: Array<{ phrase: string; label: string }> = [
  { phrase: "推薦買進", label: "推薦買進" },
  { phrase: "強力買進", label: "強力買進" },
  { phrase: "立即進場", label: "立即進場" },
  { phrase: "明確買進", label: "明確買進" },
  { phrase: "明確賣出", label: "明確賣出" },
  { phrase: "停損價", label: "停損價" },
  { phrase: "目標價", label: "目標價" },
];

function checkDashboardSummaryPhrases(): CheckResult {
  const filePath = resolve("components/portfolio-valuation-radar-summary.tsx");
  const source = readFile(filePath);
  if (!source) {
    return {
      name: "dashboard_summary_phrases",
      status: "FAIL",
      details: ["FAIL  Cannot read components/portfolio-valuation-radar-summary.tsx."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  for (const { phrase, label } of REQUIRED_SUMMARY_PHRASES) {
    if (source.includes(phrase)) {
      details.push(`PASS  Required phrase "${label}" found.`);
    } else {
      issues.push(`FAIL  Required phrase "${label}" not found in summary component.`);
    }
  }

  for (const { phrase, label } of FORBIDDEN_SUMMARY_PHRASES) {
    if (source.includes(phrase)) {
      issues.push(`FAIL  Forbidden phrase "${label}" found in summary component.`);
    } else {
      details.push(`PASS  Forbidden phrase "${label}" absent.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "dashboard_summary_phrases", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 3: Integration checks
// ---------------------------------------------------------------------------

function checkIntegration(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // Check dashboard page imports and uses PortfolioValuationRadarSummary
  const dashSource = readFile(resolve("app/page.tsx"));
  if (!dashSource) {
    issues.push("FAIL  Cannot read app/page.tsx.");
  } else {
    if (dashSource.includes("PortfolioValuationRadarSummary")) {
      details.push("PASS  PortfolioValuationRadarSummary imported and used in app/page.tsx.");
    } else {
      issues.push("FAIL  PortfolioValuationRadarSummary not found in app/page.tsx.");
    }
    if (dashSource.includes("<PortfolioValuationRadarSummary")) {
      details.push("PASS  <PortfolioValuationRadarSummary /> JSX present in dashboard page.");
    } else {
      issues.push("FAIL  <PortfolioValuationRadarSummary /> not rendered in app/page.tsx.");
    }
  }

  // Check holdings page still has the full radar
  const holdingsSource = readFile(resolve("app/holdings/page.tsx"));
  if (!holdingsSource) {
    issues.push("FAIL  Cannot read app/holdings/page.tsx.");
  } else {
    if (holdingsSource.includes("PortfolioValuationRadar")) {
      details.push("PASS  Full PortfolioValuationRadar preserved in app/holdings/page.tsx.");
    } else {
      issues.push(
        "FAIL  PortfolioValuationRadar missing from app/holdings/page.tsx — V17B radar was removed.",
      );
    }
    if (holdingsSource.includes("HoldingsTable")) {
      details.push("PASS  HoldingsTable preserved in holdings page.");
    } else {
      issues.push("FAIL  HoldingsTable removed from holdings page.");
    }
  }

  // Verify summary component links to holdings
  const summarySource = readFile(
    resolve("components/portfolio-valuation-radar-summary.tsx"),
  );
  if (summarySource) {
    if (summarySource.includes("/holdings")) {
      details.push('PASS  CTA link to "/holdings" present in summary component.');
    } else {
      issues.push('FAIL  CTA link to "/holdings" not found in summary component.');
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "integration", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: Safety checks
// ---------------------------------------------------------------------------

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // Invoke builder and verify metadata
  let response: ReturnType<typeof buildPortfolioValuationSummaryContract>;
  try {
    response = buildPortfolioValuationSummaryContract();
  } catch (err) {
    return {
      name: "safety",
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

  // Verify no SQL migration files for valuation snapshots
  const snapshotsMigrations = [
    "supabase/v85_stock_valuation_snapshots.sql",
    "supabase/stock_valuation_snapshots.sql",
  ];
  for (const rel of snapshotsMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // Protected files still present
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
  return { name: "safety", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fileCheck = checkRequiredFiles();
const phrasesCheck = checkDashboardSummaryPhrases();
const integrationCheck = checkIntegration();
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [fileCheck, phrasesCheck, integrationCheck, safetyCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: DashboardSummary = {
  status: overallStatus,
  checked_files: REQUIRED_FILES.map((f) => f.rel),
  gates: {
    required_files: fileCheck.status,
    dashboard_summary_phrases: phrasesCheck.status,
    integration: integrationCheck.status,
    safety: safetyCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  dashboard_summary_created: true,
  sql_migration_created: false,
  stock_valuation_snapshots_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
