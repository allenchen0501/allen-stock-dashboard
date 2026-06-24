/**
 * GET /api/portfolio/holding-defense — V27 Holding Defense Tracker API Contract
 *
 * Returns a deterministic mock_or_contract / fixture-only Holding Defense
 * Tracker payload. It does NOT read real holdings, does NOT read real-time
 * quotes, does NOT connect to Supabase, does NOT read env keys, does NOT make
 * any external request, and does NOT write data. generatedAt is a fixed
 * deterministic string (no clock read).
 */

import { NextResponse } from "next/server";
import { buildHoldingDefenseTrackerContract } from "@/use-cases/holding-defense/build-holding-defense-tracker-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXED_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export async function GET() {
  const payload = buildHoldingDefenseTrackerContract({ generatedAt: FIXED_GENERATED_AT });
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
