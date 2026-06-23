/**
 * Institutional Research Center Spec Validator — V18D
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - start a Next.js server
 *   - make any HTTP request
 *   - connect to Supabase
 *   - read environment keys
 *   - write data
 *   - create an API route
 *   - create a UI component
 *   - render image / PDF / HTML cards
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

interface ResearchCenterSpecSummary {
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
  image_renderer_created: false;
  pdf_renderer_created: false;
  licensed_data_runtime_created: false;
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

const SPEC_DOC_REL = "docs/institutional-research-center-spec.md";
const CONTRACT_REL = "use-cases/research/research-center-contract.ts";
const ARCH_DOC_REL = "docs/war-room-intelligence-architecture.md";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Institutional Research Center Spec (new)", rel: SPEC_DOC_REL },
    { label: "Research Center Contract (new)", rel: CONTRACT_REL },
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
  "Institutional Research Center",
  "八條件",
  "TOP5",
  "1080x1920",
  "FactSet",
  "LICENSE_REQUIRED",
  "資料不足",
  "法人目標價",
  "EPS",
  "月營收",
  "法說會",
  "AI 供應鏈",
  "全球市占率",
  "主要競爭對手",
  "Research Rating 不是買賣建議",
  "TOP5 Research 不等於 TOP5 Entry",
  "Research Center 不直接產生買點",
  "不得使用「強力買進 / 買進」",
  "不捏造 FactSet",
  "dataQualityStatus 非 PASS",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "ResearchCoverageStatus",
  "ResearchDataQualityStatus",
  "ResearchRating",
  "ResearchScoreFactor",
  "AiSupplyChainTag",
  "AiBenefitLevel",
  "PullbackReasonType",
  "ResearchUniverseInput",
  "ResearchStockSnapshot",
  "ResearchTopPick",
  "ResearchCardSpec",
  "LICENSE_REQUIRED",
  "TARGET_PRICE_UPSIDE",
  "AI_DIRECT_BENEFIT",
  "PULLBACK_NOT_DEMAND_DECAY",
  "GB200_GB300",
  "CPO",
  "LIQUID_COOLING",
  "COWOS",
  "notEntrySignal",
  "renderPerformed",
  "exportPerformed",
  "requestPerformed",
  "supabaseConnected",
  "productionWritePerformed",
];

// ---------------------------------------------------------------------------
// Gate 4: Architecture alignment
// ---------------------------------------------------------------------------

const ARCH_ALIGNMENT_TERMS: string[] = [
  "Institutional Research Center",
  "Research Score Engine",
  "TOP 5 Research Ranking",
  "Research Card Export 1080x1920",
  "Research Center 不直接產生買點",
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
  { token: "factset", label: "FactSet runtime" },
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
      // Strip line + block comments so doc-prose tokens (e.g. "FactSet" in the
      // header comment) are not mistaken for runtime usage.
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

  // 5b. No new SQL migration for research center.
  const forbiddenMigrations = [
    "supabase/research_center.sql",
    "supabase/v87_research_center.sql",
    "supabase/research_snapshots.sql",
  ];
  for (const rel of forbiddenMigrations) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  SQL migration ${rel} must not exist in V18D.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5c. No new API route / UI component for research center.
  const forbiddenRuntimeArtifacts = [
    "app/api/research/route.ts",
    "app/api/research-center/route.ts",
    "app/research/page.tsx",
    "components/research-center.tsx",
    "components/institutional-research-center.tsx",
  ];
  for (const rel of forbiddenRuntimeArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime artifact ${rel} must not exist in V18D.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5d. No image / PDF / HTML card renderer.
  const forbiddenRenderers = [
    "scripts/render-research-card.ts",
    "scripts/export-research-card.ts",
    "lib/research/card-renderer.ts",
    "lib/research/pdf-renderer.ts",
    "lib/research/weasyprint.ts",
  ];
  for (const rel of forbiddenRenderers) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Renderer artifact ${rel} must not exist in V18D.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5e. No broker / FactSet scraping runtime.
  const forbiddenDataRuntime = [
    "services/research/factset-provider.ts",
    "services/research/broker-report-scraper.ts",
    "lib/research/factset-client.ts",
  ];
  for (const rel of forbiddenDataRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Licensed-data runtime ${rel} must not exist in V18D.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 5f. Protected layers must still be present.
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

const summary: ResearchCenterSpecSummary = {
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
  image_renderer_created: false,
  pdf_renderer_created: false,
  licensed_data_runtime_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
