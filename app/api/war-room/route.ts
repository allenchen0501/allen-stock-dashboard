import { NextResponse } from 'next/server';
import { buildWarRoomReadModelContract } from '@/use-cases/war-room/build-war-room-read-model-contract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/war-room
 *
 * V20 spec-only endpoint. Returns a mock_or_contract WarRoomIntelligenceSnapshot
 * shape only. Does NOT connect to Supabase, does NOT read env keys, does NOT
 * make external requests, does NOT write data, does NOT produce buy/sell
 * commands.
 *
 * Query param `mode` selects PREMARKET | INTRADAY | POSTMARKET | REALTIME_ALERT;
 * an invalid/missing mode falls back to PREMARKET (never throws).
 *
 * Cache is no-store so spec-only contract data is never mistaken for real-time
 * market data by a CDN or browser cache.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  const payload = buildWarRoomReadModelContract({ mode });

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
