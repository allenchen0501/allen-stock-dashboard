import type { PortfolioIdentityRecord } from "../types";

export const HARDCODED_FIXTURE_VERSION = "v3-4.8-hardcoded-1";

/** Deterministic identity-only copy of the current hardcoded Portfolio. */
export const HARDCODED_PORTFOLIO_FIXTURE = [
  { symbol: "3019", market: "TWSE", name: "亞洲光學" },
  { symbol: "4966", market: "TWSE", name: "譜瑞-KY" },
  { symbol: "5347", market: "TPEx", name: "世界" },
  { symbol: "2455", market: "TWSE", name: "全新" },
  { symbol: "4979", market: "TPEx", name: "華星光" },
] as const satisfies readonly PortfolioIdentityRecord[];
