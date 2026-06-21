export type OfficialRuntimeMarket = "TWSE" | "TPEx";

export interface OfficialRuntimeSymbol {
  symbol: string;
  market: OfficialRuntimeMarket;
}

export const OFFICIAL_RUNTIME_SYMBOL_WHITELIST = [
  { symbol: "2330", market: "TWSE" },
  { symbol: "2455", market: "TWSE" },
  { symbol: "4979", market: "TPEx" },
  { symbol: "5347", market: "TPEx" },
] as const satisfies readonly OfficialRuntimeSymbol[];

export const DEFAULT_OFFICIAL_RUNTIME_SYMBOLS =
  OFFICIAL_RUNTIME_SYMBOL_WHITELIST.map((item) => item.symbol);

const WHITELIST_BY_SYMBOL = new Map<string, OfficialRuntimeSymbol>(
  OFFICIAL_RUNTIME_SYMBOL_WHITELIST.map((item) => [item.symbol, item]),
);

export interface RuntimeSymbolResolution {
  allowed: OfficialRuntimeSymbol[];
  rejected: string[];
}

export function resolveOfficialRuntimeSymbols(
  requestedSymbols: readonly string[],
): RuntimeSymbolResolution {
  const normalized = requestedSymbols.map((symbol) => symbol.trim()).filter(Boolean);
  const unique = [...new Set(normalized)];
  const rejected = unique.filter((symbol) => !WHITELIST_BY_SYMBOL.has(symbol));
  const allowed = unique.flatMap((symbol) => {
    const item = WHITELIST_BY_SYMBOL.get(symbol);
    return item ? [{ ...item }] : [];
  });

  if (normalized.length !== unique.length) rejected.push("DUPLICATE_SYMBOL");
  if (unique.length > OFFICIAL_RUNTIME_SYMBOL_WHITELIST.length) {
    rejected.push("TOO_MANY_SYMBOLS");
  }

  return { allowed, rejected: [...new Set(rejected)] };
}
