/**
 * GET /api/portfolio/first-authorized-source-dry-run — V40 First Authorized
 * Source Dry-Run API
 *
 * Returns a deterministic mock_or_contract / fixture-only First Authorized
 * Source Dry-Run payload (wrapping the V39 dry-run bundle). It does NOT read
 * real holdings, does NOT read real-time quotes, does NOT connect to Supabase,
 * does NOT read env keys, does NOT make any external request, connects to NO
 * data source, and does NOT write data. generatedAt is a fixed deterministic
 * string (no clock read).
 */

import { NextResponse } from "next/server";
import { buildFirstAuthorizedSourceDryRunApiContract } from "@/use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXED_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export async function GET() {
  const payload = buildFirstAuthorizedSourceDryRunApiContract({ generatedAt: FIXED_GENERATED_AT });
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
