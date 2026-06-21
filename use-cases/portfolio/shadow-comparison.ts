import type {
  DatabasePortfolioShadowRecord,
  PortfolioIdentityRecord,
  ShadowComparisonInput,
  ShadowComparisonResult,
  ShadowDifference,
  ShadowStatus,
} from "./types";

interface NormalizedIdentity {
  symbol: string;
  market: string;
  name: string;
}

function normalizeIdentity(record: PortfolioIdentityRecord): NormalizedIdentity {
  return {
    symbol: record.symbol.trim().toUpperCase(),
    market: record.market.trim().toUpperCase(),
    name: record.name?.trim() ?? "",
  };
}

function identityKey(record: PortfolioIdentityRecord): string {
  const normalized = normalizeIdentity(record);
  return `${normalized.market}:${normalized.symbol}`;
}

function duplicateKeys(records: readonly PortfolioIdentityRecord[]): Set<string> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = identityKey(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key]) => key),
  );
}

function addDuplicateDifferences(
  differences: ShadowDifference[],
  records: readonly PortfolioIdentityRecord[],
  code:
    | "DUPLICATE_HARDCODED_IDENTITY"
    | "DUPLICATE_DATABASE_IDENTITY",
): void {
  for (const key of duplicateKeys(records)) {
    const [market, symbol] = key.split(":");
    differences.push({
      code,
      severity: "fail",
      symbol,
      ...(code === "DUPLICATE_HARDCODED_IDENTITY"
        ? { hardcoded_market: market }
        : { database_market: market }),
      message: `Duplicate Portfolio identity detected for ${key}.`,
    });
  }
}

function statusFromDifferences(differences: readonly ShadowDifference[]): ShadowStatus {
  if (differences.some((difference) => difference.severity === "fail")) return "fail";
  if (differences.length > 0) return "warning";
  return "pass";
}

/** Compares identity only; cost and shares are intentionally excluded. */
export function comparePortfolioShadow(
  input: ShadowComparisonInput,
): ShadowComparisonResult {
  const differences: ShadowDifference[] = [];
  const activeDatabase = input.database.filter((record) => record.is_active);
  addDuplicateDifferences(
    differences,
    input.hardcoded,
    "DUPLICATE_HARDCODED_IDENTITY",
  );
  addDuplicateDifferences(
    differences,
    activeDatabase,
    "DUPLICATE_DATABASE_IDENTITY",
  );

  for (const record of input.database.filter((item) => !item.is_active)) {
    const normalized = normalizeIdentity(record);
    differences.push({
      code: "INACTIVE_DATABASE_RECORD",
      severity: "fail",
      symbol: normalized.symbol,
      database_market: normalized.market,
      message: "Inactive database row was included in the shadow input.",
    });
  }

  const databaseBySymbol = new Map<string, DatabasePortfolioShadowRecord[]>();
  for (const record of activeDatabase) {
    const symbol = normalizeIdentity(record).symbol;
    const existing = databaseBySymbol.get(symbol) ?? [];
    existing.push(record);
    databaseBySymbol.set(symbol, existing);
  }

  const hardcodedSymbols = new Set(
    input.hardcoded.map((record) => normalizeIdentity(record).symbol),
  );
  const hardcodedKeys = new Set(input.hardcoded.map(identityKey));
  const matchedKeys = new Set<string>();

  for (const hardcoded of input.hardcoded) {
    const expected = normalizeIdentity(hardcoded);
    const candidates = databaseBySymbol.get(expected.symbol) ?? [];
    const exact = candidates.find(
      (candidate) => normalizeIdentity(candidate).market === expected.market,
    );

    if (!exact) {
      if (candidates.length > 0) {
        differences.push({
          code: "MARKET_MISMATCH",
          severity: "fail",
          symbol: expected.symbol,
          hardcoded_market: expected.market,
          database_market: normalizeIdentity(candidates[0]).market,
          message: "Hardcoded and database markets do not match.",
        });
      } else {
        differences.push({
          code: "MISSING_DATABASE_RECORD",
          severity: "fail",
          symbol: expected.symbol,
          hardcoded_market: expected.market,
          message: "Hardcoded Portfolio identity is missing from active database rows.",
        });
      }
      continue;
    }

    matchedKeys.add(identityKey(hardcoded));
    const actual = normalizeIdentity(exact);
    if (expected.name && actual.name && expected.name !== actual.name) {
      differences.push({
        code: "NAME_MISMATCH",
        severity: "warning",
        symbol: expected.symbol,
        hardcoded_market: expected.market,
        database_market: actual.market,
        message: "Portfolio names differ after trimming; identity still matches.",
      });
    }
  }

  for (const database of activeDatabase) {
    const actual = normalizeIdentity(database);
    const key = identityKey(database);
    const sameSymbolHasExactMatch = activeDatabase.some(
      (candidate) =>
        hardcodedKeys.has(identityKey(candidate)) &&
        normalizeIdentity(candidate).symbol === actual.symbol,
    );
    if (
      !hardcodedKeys.has(key) &&
      (!hardcodedSymbols.has(actual.symbol) || sameSymbolHasExactMatch)
    ) {
      differences.push({
        code: "UNEXPECTED_DATABASE_RECORD",
        severity: "fail",
        symbol: actual.symbol,
        database_market: actual.market,
        message: "Active database identity is not present in the hardcoded baseline.",
      });
    }
  }

  const status = statusFromDifferences(differences);
  const failureCount = differences.filter(
    (difference) => difference.severity === "fail",
  ).length;

  return {
    context: input.context,
    status,
    response_source: "hardcoded",
    identity_parity: failureCount === 0,
    metrics: {
      hardcoded_count: input.hardcoded.length,
      database_total_count: input.database.length,
      database_active_count: activeDatabase.length,
      matched_count: matchedKeys.size,
      warning_count: differences.length - failureCount,
      failure_count: failureCount,
    },
    differences,
  };
}
