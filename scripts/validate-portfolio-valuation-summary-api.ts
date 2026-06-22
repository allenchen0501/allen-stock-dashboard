/**
 * Portfolio Valuation Summary API Validator — V16
 *
 * Fixture-only check. Does NOT:
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

const {
  PORTFOLIO_VALUATION_TIERS,
  PORTFOLIO_ACTION_SIGNALS,
} = require("../use-cases/portfolio/valuation-summary-contract") as typeof import("../use-cases/portfolio/valuation-summary-contract");

const {
  resolvePortfolioValuationTier,
  resolvePortfolioActionSignal,
} = require("../use-cases/portfolio/valuation-tier") as typeof import("../use-cases/portfolio/valuation-tier");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface ValuationSummaryApiSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: true;
  sql_migration_created: false;
  stock_valuation_snapshots_created: false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolve(...parts: string[]): string {
  return path.resolve(process.cwd(), ...parts);
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
    label: "Valuation summary contract",
    rel: "use-cases/portfolio/valuation-summary-contract.ts",
  },
  {
    label: "Valuation summary builder",
    rel: "use-cases/portfolio/build-valuation-summary-contract.ts",
  },
  {
    label: "Valuation tier pure functions",
    rel: "use-cases/portfolio/valuation-tier.ts",
  },
  {
    label: "Spec-only API route",
    rel: "app/api/portfolio/valuation-summary/route.ts",
  },
  {
    label: "Portfolio Valuation Radar spec",
    rel: "docs/portfolio-valuation-radar-spec.md",
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
// Gate 2: Contract shape
// ---------------------------------------------------------------------------

const REQUIRED_ITEM_KEYS: string[] = [
  "stockId",
  "stockName",
  "market",
  "price",
  "change",
  "changePercent",
  "valuationTier",
  "valuationReason",
  "avgCost",
  "quantity",
  "unrealizedPnL",
  "unrealizedPnLPercent",
  "positionWeight",
  "ttmEPS",
  "estimatedEPS",
  "forwardPE",
  "fairPrice",
  "cheapPrice",
  "expensivePrice",
  "riskRewardRatio",
  "technicalStatus",
  "capitalFlowStatus",
  "newsSignal",
  "eventRisk",
  "actionSignal",
  "dataQualityStatus",
];

function checkContractShape(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  let response: ReturnType<typeof buildPortfolioValuationSummaryContract>;
  try {
    response = buildPortfolioValuationSummaryContract();
  } catch (err) {
    return {
      name: "contract_shape",
      status: "FAIL",
      details: [
        `FAIL  buildPortfolioValuationSummaryContract() threw: ${String(err)}`,
      ],
    };
  }

  // data must be an array
  if (!Array.isArray(response.data)) {
    issues.push("FAIL  response.data is not an array.");
  } else {
    details.push("PASS  response.data is an array.");

    // must have at least one item
    if (response.data.length === 0) {
      issues.push("FAIL  response.data is empty — expected at least one item.");
    } else {
      details.push(`PASS  response.data has ${response.data.length} item(s).`);

      // check all required keys on first item
      const firstItem = response.data[0] as Record<string, unknown>;
      for (const key of REQUIRED_ITEM_KEYS) {
        if (!(key in firstItem)) {
          issues.push(`FAIL  Required field "${key}" missing from item.`);
        } else {
          details.push(`PASS  Field "${key}" present.`);
        }
      }

      // check all items for enum validity and V16 defaults
      let allTiersValid = true;
      let allSignalsValid = true;
      let allDefaultTier = true;
      let allDefaultSignal = true;
      let allDefaultQuality = true;
      let foundBuySell = false;

      for (const item of response.data) {
        const i = item as Record<string, unknown>;

        if (!PORTFOLIO_VALUATION_TIERS.includes(i["valuationTier"] as never)) {
          allTiersValid = false;
        }
        if (!PORTFOLIO_ACTION_SIGNALS.includes(i["actionSignal"] as never)) {
          allSignalsValid = false;
        }
        if (i["valuationTier"] !== "資料不足") {
          allDefaultTier = false;
        }
        if (i["actionSignal"] !== "資料不足") {
          allDefaultSignal = false;
        }
        if (i["dataQualityStatus"] !== "WARNING") {
          allDefaultQuality = false;
        }

        const reason = String(i["valuationReason"] ?? "");
        if (reason.includes("買進") || reason.includes("賣出")) {
          foundBuySell = true;
        }
        const signal = String(i["actionSignal"] ?? "");
        if (signal === "買進" || signal === "賣出") {
          foundBuySell = true;
        }
      }

      allTiersValid
        ? details.push("PASS  All valuationTier values are valid enum members.")
        : issues.push("FAIL  Some valuationTier values are not valid enum members.");

      allSignalsValid
        ? details.push("PASS  All actionSignal values are valid enum members.")
        : issues.push("FAIL  Some actionSignal values are not valid enum members.");

      allDefaultTier
        ? details.push(
            'PASS  V16 default valuationTier is "資料不足" for all items.',
          )
        : issues.push(
            'FAIL  V16 default valuationTier must be "資料不足" for all items.',
          );

      allDefaultSignal
        ? details.push(
            'PASS  V16 default actionSignal is "資料不足" for all items.',
          )
        : issues.push(
            'FAIL  V16 default actionSignal must be "資料不足" for all items.',
          );

      allDefaultQuality
        ? details.push('PASS  All items have dataQualityStatus "WARNING".')
        : issues.push(
            'FAIL  V16 default dataQualityStatus must be "WARNING" for all items.',
          );

      foundBuySell
        ? issues.push(
            'FAIL  "買進" or "賣出" found in response — buy/sell commands are forbidden.',
          )
        : details.push('PASS  No "買進" or "賣出" found in response.');
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "contract_shape", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 3: Metadata
// ---------------------------------------------------------------------------

function checkMetadata(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  let response: ReturnType<typeof buildPortfolioValuationSummaryContract>;
  try {
    response = buildPortfolioValuationSummaryContract();
  } catch (err) {
    return {
      name: "metadata",
      status: "FAIL",
      details: [`FAIL  Builder threw: ${String(err)}`],
    };
  }

  const meta = response.metadata as Record<string, unknown>;

  const checks: Array<{ key: string; expected: unknown }> = [
    { key: "source_mode", expected: "spec_only" },
    { key: "response_source", expected: "mock_or_contract" },
    { key: "production_write_performed", expected: false },
    { key: "request_performed", expected: false },
    { key: "supabase_connected", expected: false },
    { key: "model_inference_used", expected: false },
    { key: "api_contract_version", expected: "V16" },
    { key: "sql_migration_created", expected: false },
    { key: "stock_valuation_snapshots_created", expected: false },
  ];

  for (const { key, expected } of checks) {
    if (meta[key] === expected) {
      details.push(`PASS  metadata.${key} === ${JSON.stringify(expected)}`);
    } else {
      issues.push(
        `FAIL  metadata.${key} must be ${JSON.stringify(expected)}, got ${JSON.stringify(meta[key])}`,
      );
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "metadata", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: Pure functions
// ---------------------------------------------------------------------------

function checkPureFunctions(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // resolvePortfolioValuationTier — missing data → '資料不足'
  const tierMissingAll = resolvePortfolioValuationTier({});
  if (tierMissingAll === "資料不足") {
    details.push('PASS  resolvePortfolioValuationTier({}) → "資料不足".');
  } else {
    issues.push(
      `FAIL  resolvePortfolioValuationTier({}) must return "資料不足", got "${tierMissingAll}".`,
    );
  }

  const tierMissingEPS = resolvePortfolioValuationTier({
    price: 100,
    ttmEPS: null,
    estimatedEPS: null,
  });
  if (tierMissingEPS === "資料不足") {
    details.push(
      'PASS  resolvePortfolioValuationTier with price but no EPS → "資料不足".',
    );
  } else {
    issues.push(
      `FAIL  Missing EPS must produce "資料不足", got "${tierMissingEPS}".`,
    );
  }

  const tierFailQuality = resolvePortfolioValuationTier({
    price: 100,
    ttmEPS: 10,
    dataQualityStatus: "FAIL",
  });
  if (tierFailQuality === "資料不足") {
    details.push(
      'PASS  resolvePortfolioValuationTier with FAIL dataQuality → "資料不足".',
    );
  } else {
    issues.push(
      `FAIL  FAIL dataQuality must produce "資料不足", got "${tierFailQuality}".`,
    );
  }

  // resolvePortfolioActionSignal — '資料不足' tier → '資料不足'
  const signalMissingTier = resolvePortfolioActionSignal({
    valuationTier: "資料不足",
  });
  if (signalMissingTier === "資料不足") {
    details.push(
      'PASS  resolvePortfolioActionSignal with "資料不足" tier → "資料不足".',
    );
  } else {
    issues.push(
      `FAIL  "資料不足" tier must produce "資料不足" signal, got "${signalMissingTier}".`,
    );
  }

  const signalWarningQuality = resolvePortfolioActionSignal({
    valuationTier: "便宜",
    dataQualityStatus: "WARNING",
  });
  if (signalWarningQuality === "資料不足") {
    details.push(
      'PASS  resolvePortfolioActionSignal with WARNING quality → "資料不足".',
    );
  } else {
    issues.push(
      `FAIL  WARNING dataQuality must produce "資料不足" signal, got "${signalWarningQuality}".`,
    );
  }

  const signalFailQuality = resolvePortfolioActionSignal({
    valuationTier: "合理",
    dataQualityStatus: "FAIL",
  });
  if (signalFailQuality === "資料不足") {
    details.push(
      'PASS  resolvePortfolioActionSignal with FAIL quality → "資料不足".',
    );
  } else {
    issues.push(
      `FAIL  FAIL dataQuality must produce "資料不足" signal, got "${signalFailQuality}".`,
    );
  }

  // No buy/sell commands in actionSignal outputs
  const forbiddenOutputs = ["買進", "賣出"];
  const testInputs: Parameters<typeof resolvePortfolioActionSignal>[0][] = [
    { valuationTier: "資料不足" },
    { valuationTier: "便宜", dataQualityStatus: "PASS" },
    { valuationTier: "合理", dataQualityStatus: "PASS" },
    { valuationTier: "昂貴", dataQualityStatus: "PASS" },
  ];

  let buySellDetected = false;
  for (const input of testInputs) {
    const output = resolvePortfolioActionSignal(input);
    if (forbiddenOutputs.some((f) => String(output).includes(f))) {
      buySellDetected = true;
      issues.push(
        `FAIL  resolvePortfolioActionSignal produced forbidden output: "${output}".`,
      );
    }
  }
  if (!buySellDetected) {
    details.push(
      'PASS  resolvePortfolioActionSignal never outputs "買進" or "賣出".',
    );
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "pure_functions", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fileCheck = checkRequiredFiles();
const shapeCheck = checkContractShape();
const metaCheck = checkMetadata();
const fnCheck = checkPureFunctions();

const allChecks: CheckResult[] = [fileCheck, shapeCheck, metaCheck, fnCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: ValuationSummaryApiSummary = {
  status: overallStatus,
  checked_files: REQUIRED_FILES.map((f) => f.rel),
  gates: {
    required_files: fileCheck.status,
    contract_shape: shapeCheck.status,
    metadata: metaCheck.status,
    pure_functions: fnCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: true,
  sql_migration_created: false,
  stock_valuation_snapshots_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
