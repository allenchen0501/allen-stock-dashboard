/**
 * GET /api/portfolio/shadow-runner-dry-run — V51 Shadow Runner Dry-run API Route
 *
 * Returns the deterministic mock_or_contract / fixture-only responsePayload from
 * the V50 Shadow Runner Dry-run API Contract builder. It does NOT read real
 * holdings, does NOT read real-time quotes, does NOT connect to Supabase, does
 * NOT read env keys, does NOT make any external request, does NOT write data,
 * and does NOT switch /api/portfolio. generatedAt is a fixed deterministic
 * string (no clock read).
 *
 * sourceMode stays fixture; responseSource stays mock_or_contract;
 * PORTFOLIO_SOURCE_MODE stays hardcoded. The V50 contract flags remain false
 * even though this V51 route file exists.
 */

import { NextResponse } from "next/server";
import { buildShadowRunnerDryRunApiContract } from "@/use-cases/deployment/build-shadow-runner-dry-run-api-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXED_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export async function GET() {
  const contract = buildShadowRunnerDryRunApiContract({ generatedAt: FIXED_GENERATED_AT });
  const responsePayload = contract.responsePayload;
  return NextResponse.json(responsePayload, { status: 200, headers: { "Cache-Control": "no-store" } });
}
