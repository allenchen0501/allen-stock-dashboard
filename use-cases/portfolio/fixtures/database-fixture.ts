import type { DatabasePortfolioShadowRecord } from "../types";

export type DatabaseFixtureScenario =
  | "exact_match"
  | "name_mismatch"
  | "market_mismatch"
  | "duplicate"
  | "inactive_leakage"
  | "missing_symbol"
  | "extra_symbol";

export const DATABASE_FIXTURE_EXPECTATIONS = {
  exact_match: "PASS",
  name_mismatch: "WARNING",
  market_mismatch: "FAIL",
  duplicate: "FAIL",
  inactive_leakage: "FAIL",
  missing_symbol: "FAIL",
  extra_symbol: "FAIL",
} as const satisfies Record<DatabaseFixtureScenario, "PASS" | "WARNING" | "FAIL">;

const EXACT_MATCH_FIXTURE = [
  { id: "fixture-db-3019", symbol: "3019", market: "TWSE", name: "亞洲光學", is_active: true },
  { id: "fixture-db-4966", symbol: "4966", market: "TWSE", name: "譜瑞-KY", is_active: true },
  { id: "fixture-db-5347", symbol: "5347", market: "TPEx", name: "世界", is_active: true },
  { id: "fixture-db-2455", symbol: "2455", market: "TWSE", name: "全新", is_active: true },
  { id: "fixture-db-4979", symbol: "4979", market: "TPEx", name: "華星光", is_active: true },
] as const satisfies readonly DatabasePortfolioShadowRecord[];

export const DATABASE_PORTFOLIO_FIXTURES = {
  exact_match: EXACT_MATCH_FIXTURE,
  name_mismatch: EXACT_MATCH_FIXTURE.map((record) =>
    record.symbol === "4966"
      ? { ...record, name: "名稱待人工確認" }
      : { ...record },
  ),
  market_mismatch: EXACT_MATCH_FIXTURE.map((record) =>
    record.symbol === "5347"
      ? { ...record, market: "TWSE" }
      : { ...record },
  ),
  duplicate: [
    ...EXACT_MATCH_FIXTURE.map((record) => ({ ...record })),
    { ...EXACT_MATCH_FIXTURE[0], id: "fixture-db-3019-duplicate" },
  ],
  inactive_leakage: EXACT_MATCH_FIXTURE.map((record) =>
    record.symbol === "4979"
      ? { ...record, is_active: false }
      : { ...record },
  ),
  missing_symbol: EXACT_MATCH_FIXTURE.filter(
    (record) => record.symbol !== "2455",
  ).map((record) => ({ ...record })),
  extra_symbol: [
    ...EXACT_MATCH_FIXTURE.map((record) => ({ ...record })),
    {
      id: "fixture-db-extra",
      symbol: "EXTRA",
      market: "TWSE",
      name: "額外測試標的",
      is_active: true,
    },
  ],
} as const satisfies Record<
  DatabaseFixtureScenario,
  readonly DatabasePortfolioShadowRecord[]
>;

export function getDatabasePortfolioFixture(
  scenario: DatabaseFixtureScenario,
): DatabasePortfolioShadowRecord[] {
  return DATABASE_PORTFOLIO_FIXTURES[scenario].map((record) => ({ ...record }));
}
