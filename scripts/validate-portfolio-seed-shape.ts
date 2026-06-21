const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const SEED_PATH = path.resolve(
  process.cwd(),
  "supabase/seeds/portfolio_staging_seed.example.sql",
);

const REQUIRED_COLUMNS = [
  "owner_id",
  "symbol",
  "stock_name",
  "market_type",
  "industry",
  "quantity",
  "average_cost",
  "is_active",
  "opened_at",
  "source_name",
  "source_type",
  "data_frequency",
  "is_model_inference",
  "created_at",
  "updated_at",
] as const;

const ALLOWED_MARKETS = ["TWSE", "TPEx", "NASDAQ", "NYSE"] as const;
const FORBIDDEN_PLACEHOLDERS = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /REPLACE[_ -]?ME/i,
  /YOUR[_ -]?(?:OWNER|USER|UUID|VALUE)/i,
  /00000000-0000-0000-0000-000000000000/i,
  /<[^>]+>/,
  /\b(?:DUMMY|FAKE|SAMPLE|PLACEHOLDER)\b/i,
] as const;

function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "");
}

function extractCreateTableBody(sql: string): string {
  const match = /create\s+temporary\s+table\s+portfolio_staging_seed_input\s*\(/i.exec(
    sql,
  );
  if (!match) throw new Error("Missing portfolio_staging_seed_input table contract.");

  const start = match.index + match[0].length;
  let depth = 1;
  let inQuote = false;
  for (let index = start; index < sql.length; index += 1) {
    const character = sql[index];
    if (character === "'" && sql[index - 1] !== "\\") inQuote = !inQuote;
    if (inQuote) continue;
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (depth === 0) return sql.slice(start, index);
  }

  throw new Error("Unclosed portfolio staging seed table contract.");
}

function splitTopLevelColumns(body: string): string[] {
  const definitions: string[] = [];
  let start = 0;
  let depth = 0;
  let inQuote = false;

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (character === "'" && body[index - 1] !== "\\") inQuote = !inQuote;
    if (inQuote) continue;
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      definitions.push(body.slice(start, index).trim());
      start = index + 1;
    }
  }

  definitions.push(body.slice(start).trim());
  return definitions.filter(Boolean);
}

function fail(errors: readonly string[]): never {
  console.error("Portfolio Seed Shape Test: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

try {
  const sql = fs.readFileSync(SEED_PATH, "utf8");
  const executableSql = stripSqlComments(sql);
  const body = extractCreateTableBody(executableSql);
  const definitions = splitTopLevelColumns(body);
  const columnNames = definitions.map(
    (definition) => definition.split(/\s+/, 1)[0].replaceAll('"', "").toLowerCase(),
  );
  const errors: string[] = [];

  const counts = new Map<string, number>();
  for (const column of columnNames) counts.set(column, (counts.get(column) ?? 0) + 1);
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([column]) => column);
  if (duplicates.length > 0) {
    errors.push(`Duplicate columns: ${duplicates.join(", ")}`);
  }

  const missing = REQUIRED_COLUMNS.filter((column) => !counts.has(column));
  if (missing.length > 0) errors.push(`Missing required columns: ${missing.join(", ")}`);

  const unexpected = columnNames.filter(
    (column) => !(REQUIRED_COLUMNS as readonly string[]).includes(column),
  );
  if (unexpected.length > 0) {
    errors.push(`Unexpected columns: ${unexpected.join(", ")}`);
  }

  for (const pattern of FORBIDDEN_PLACEHOLDERS) {
    if (pattern.test(executableSql)) {
      errors.push(`Forbidden placeholder matched: ${pattern.source}`);
    }
  }

  const marketDefinition = definitions.find((definition) =>
    /^market_type\s/i.test(definition),
  );
  if (!marketDefinition) {
    errors.push("market_type definition is missing.");
  } else {
    const declaredMarkets = [...marketDefinition.matchAll(/'([^']+)'/g)].map(
      (match) => match[1],
    );
    const invalidMarkets = declaredMarkets.filter(
      (market) => !(ALLOWED_MARKETS as readonly string[]).includes(market),
    );
    const missingMarkets = ALLOWED_MARKETS.filter(
      (market) => !declaredMarkets.includes(market),
    );
    if (invalidMarkets.length > 0) {
      errors.push(`Invalid market_type values: ${invalidMarkets.join(", ")}`);
    }
    if (missingMarkets.length > 0 || !/check\s*\(/i.test(marketDefinition)) {
      errors.push("market_type must enforce the complete approved market whitelist.");
    }
  }

  const activeDefinition = definitions.find((definition) =>
    /^is_active\s/i.test(definition),
  );
  if (!activeDefinition || !/\bboolean\b/i.test(activeDefinition)) {
    errors.push("is_active must exist and use the boolean type.");
  }

  if (/\binsert\s+into\b|\bcopy\s+portfolio_staging_seed_input\b/i.test(executableSql)) {
    errors.push("Repository example must not insert or copy Portfolio rows.");
  }
  if (!/\brollback\s*;/i.test(executableSql)) {
    errors.push("Repository example must end with rollback safety.");
  }

  if (errors.length > 0) fail(errors);

  console.log("Portfolio Seed Shape Test: PASS");
  console.log(`Required columns: ${REQUIRED_COLUMNS.length}/${REQUIRED_COLUMNS.length}`);
  console.log("Duplicate columns: 0");
  console.log("Forbidden placeholders: 0");
  console.log(`Allowed market_type: ${ALLOWED_MARKETS.join(", ")}`);
  console.log("is_active: boolean, required");
  console.log("Permanent writes: 0 (rollback guarded)");
  process.exit(0);
} catch (error) {
  fail([error instanceof Error ? error.message : "Unknown validation error."]);
}
