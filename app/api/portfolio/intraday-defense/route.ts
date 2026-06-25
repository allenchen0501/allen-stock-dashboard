/**
 * GET /api/portfolio/intraday-defense — V31 Intraday Defense Fixture API
 *
 * Returns a deterministic mock_or_contract / fixture-only Intraday Defense
 * payload (shaped from the V30 Intraday Holding Defense Runtime contract). It
 * does NOT read real holdings, does NOT read real-time quotes, does NOT connect
 * to Supabase, does NOT read env keys, does NOT make any external request, and
 * does NOT write data. generatedAt is a fixed deterministic string (no clock
 * read).
 */

import { NextResponse } from "next/server";
import { buildIntradayDefenseFixtureContract } from "@/use-cases/intraday-defense/build-intraday-defense-fixture-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXED_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export async function GET() {
  const payload = buildIntradayDefenseFixtureContract({ generatedAt: FIXED_GENERATED_AT });
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
