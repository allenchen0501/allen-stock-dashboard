import type { QuoteFixtureCase } from "../types";
import type { YahooRawQuote } from "../yahoo-connector";

export interface YahooQuoteFixtureCase extends QuoteFixtureCase<YahooRawQuote> {
  officialReferencePrice: number | null;
  expectedDifferenceRatio: number | null;
}

export const YAHOO_QUOTE_FIXTURES = {
  officialDifferenceHalfPercent: {
    scenario: "official_difference_0_5_percent",
    expectedStatus: "PASS",
    officialReferencePrice: 100,
    expectedDifferenceRatio: 0.005,
    raw: {
      symbol: "FIXTURE-US-001",
      regular_market_price: 100.5,
      regular_market_volume: 1_000_000,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "US",
      currency: "USD",
    },
  },
  officialDifferenceOnePointFivePercent: {
    scenario: "official_difference_1_5_percent",
    expectedStatus: "FAIL",
    officialReferencePrice: 100,
    expectedDifferenceRatio: 0.015,
    raw: {
      symbol: "FIXTURE-US-002",
      regular_market_price: 101.5,
      regular_market_volume: 900_000,
      record_date: "2026-06-21",
      record_time: "13:30:00",
      market: "US",
      currency: "USD",
    },
  },
  missingData: {
    scenario: "missing_data",
    expectedStatus: "FAIL",
    officialReferencePrice: null,
    expectedDifferenceRatio: null,
    raw: {
      symbol: "FIXTURE-US-003",
      regular_market_price: null,
      regular_market_volume: null,
      record_date: "",
      record_time: "",
      market: "US",
      currency: "USD",
    },
  },
  delayedData: {
    scenario: "delayed_data",
    expectedStatus: "WARNING",
    officialReferencePrice: 70,
    expectedDifferenceRatio: 0,
    raw: {
      symbol: "FIXTURE-GLOBAL-004",
      regular_market_price: 70,
      regular_market_volume: 700_000,
      record_date: "2026-06-19",
      record_time: "13:30:00",
      market: "GLOBAL",
      currency: "USD",
    },
  },
} as const satisfies Record<string, YahooQuoteFixtureCase>;
