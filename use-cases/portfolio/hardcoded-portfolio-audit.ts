export const HARDCODED_PORTFOLIO_AUDIT = {
  symbols: ["3019", "4966", "5347", "2455", "4979"],
  location: "services/stocks/providers/yahoo-stock-provider.ts",
  constantName: "ALLEN_PORTFOLIO_STOCKS",
  currentStatus: "retained_in_v3_4",
  v3_4Action: "build_migration_path_only",
  apiSwitchVersion: "V3-5",
  notes: [
    "V3-4 does not delete or modify the hardcoded portfolio.",
    "Yahoo Finance remains an intraday helper or fallback, not a portfolio-list source.",
    "V3-5 may switch /api/portfolio only after database parity and rollback checks pass.",
  ],
} as const;

export type HardcodedPortfolioSymbol =
  (typeof HARDCODED_PORTFOLIO_AUDIT.symbols)[number];
