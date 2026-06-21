import type { QuoteFixtureCase } from "../types";
import type { TpexRawQuote } from "../tpex-connector";

export const TPEX_QUOTE_FIXTURES = {
  normalPrice: {
    scenario: "normal_price",
    expectedStatus: "PASS",
    raw: {
      symbol: "FIXTURE-TPEX-001",
      stock_name: "Fixture OTC Equity",
      closing_price: 50,
      trade_volume: 500_000,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "TPEx",
    },
  },
  missingSymbol: {
    scenario: "missing_symbol",
    expectedStatus: "FAIL",
    raw: {
      symbol: "",
      closing_price: 40,
      trade_volume: 300_000,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "TPEx",
    },
  },
  wrongMarket: {
    scenario: "wrong_market",
    expectedStatus: "FAIL",
    raw: {
      symbol: "FIXTURE-TPEX-003",
      closing_price: 30,
      trade_volume: 200_000,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "TWSE",
    },
  },
  staleDate: {
    scenario: "stale_date",
    expectedStatus: "WARNING",
    raw: {
      symbol: "FIXTURE-TPEX-004",
      closing_price: 20,
      trade_volume: 100_000,
      record_date: "2026-06-19",
      record_time: "13:30:00",
      market: "TPEx",
    },
  },
} as const satisfies Record<string, QuoteFixtureCase<TpexRawQuote>>;
