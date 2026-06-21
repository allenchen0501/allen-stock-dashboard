import type { QuoteFixtureCase } from "../types";
import type { TwseRawQuote } from "../twse-connector";

export const TWSE_QUOTE_FIXTURES = {
  normalPrice: {
    scenario: "normal_price",
    expectedStatus: "PASS",
    raw: {
      symbol: "FIXTURE-TWSE-001",
      stock_name: "Fixture Listed Equity",
      closing_price: 100,
      trade_volume: 1_000_000,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "TWSE",
    },
  },
  missingPrice: {
    scenario: "missing_price",
    expectedStatus: "FAIL",
    raw: {
      symbol: "FIXTURE-TWSE-002",
      closing_price: null,
      trade_volume: 800_000,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "TWSE",
    },
  },
  staleDate: {
    scenario: "stale_date",
    expectedStatus: "WARNING",
    raw: {
      symbol: "FIXTURE-TWSE-003",
      closing_price: 80,
      trade_volume: 600_000,
      record_date: "2026-06-19",
      record_time: "13:30:00",
      market: "TWSE",
    },
  },
  abnormalVolume: {
    scenario: "abnormal_volume",
    expectedStatus: "FAIL",
    raw: {
      symbol: "FIXTURE-TWSE-004",
      closing_price: 60,
      trade_volume: -1,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "TWSE",
    },
  },
} as const satisfies Record<string, QuoteFixtureCase<TwseRawQuote>>;
