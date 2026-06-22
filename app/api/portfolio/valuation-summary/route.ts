import { NextResponse } from "next/server";
import { buildPortfolioValuationSummaryContract } from "@/use-cases/portfolio/build-valuation-summary-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/portfolio/valuation-summary
 *
 * V16 spec-only endpoint. Returns mock_or_contract data only.
 * Does NOT connect to Supabase, does NOT read env keys, does NOT make
 * external requests, does NOT produce buy/sell commands.
 *
 * Cache is explicitly set to no-store so spec-only mock data is never
 * mistaken for real-time market data by a CDN or browser cache.
 */
export async function GET() {
  const response = buildPortfolioValuationSummaryContract();

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
