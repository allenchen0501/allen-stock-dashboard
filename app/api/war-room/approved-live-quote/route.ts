import { NextResponse } from 'next/server';
import {
  APPROVED_LIVE_QUOTE_SYMBOL,
  buildApproved3019RejectionResponse,
  mapApproved3019LiveQuoteResponse,
} from '@/use-cases/war-room/build-approved-live-quote-3019-mvp-contract';
import { getTwseTpexLimitedLiveFetchCandidate } from '@/services/market-data/twse-tpex-verification-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/war-room/approved-live-quote?symbol=3019&mode=manual
 *
 * 3019 Approved Live Quote Manual-Refresh MVP — read-only.
 *
 * The ONLY approved read-only real-quote path. It is reached ONLY by an explicit user
 * manual refresh (the War Room page never auto-fetches on load), and only ever fetches
 * the single approved symbol 3019 through the approved TWSE_TPEX channel tse_3019.tw via
 * the existing approved provider (GET only, timeout 3000ms, maxRetries 0). Any other
 * symbol / mode is rejected without a fetch. Any failure (timeout / source error / bad
 * response) falls back safely — prices are NEVER fabricated (null instead).
 *
 * Read-only: does NOT switch /api/portfolio, does NOT connect Supabase, does NOT read env
 * secrets, does NOT write data, does NOT connect a broker, does NOT produce buy/sell
 * commands, and does NOT place any auto order. Cache is no-store.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') ?? APPROVED_LIVE_QUOTE_SYMBOL;
  // Manual refresh only: `mode` must be EXPLICITLY "manual". A missing/absent mode is NOT
  // defaulted to manual — it is rejected without a fetch, so only a deliberate manual
  // refresh ever reaches the approved provider.
  const mode = searchParams.get('mode');

  // Reject any non-approved symbol WITHOUT any fetch.
  // approved live-fetch symbols remain exactly ["3019"].
  if (symbol !== APPROVED_LIVE_QUOTE_SYMBOL) {
    return NextResponse.json(
      buildApproved3019RejectionResponse({
        reasonZh: '非核准代號：僅核准 3019（亞光），已拒絕且未進行任何真實行情請求。',
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Reject any non-manual mode (including a missing mode) WITHOUT any fetch.
  if (mode !== 'manual') {
    return NextResponse.json(
      buildApproved3019RejectionResponse({
        reasonZh: '僅允許手動刷新（mode=manual），已拒絕且未進行任何真實行情請求。',
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Approved read-only live fetch for 3019 only (via the approved provider). The provider
  // never throws, but we still guard so a source error maps to a safe fallback response.
  try {
    const candidate = await getTwseTpexLimitedLiveFetchCandidate(APPROVED_LIVE_QUOTE_SYMBOL);
    return NextResponse.json(mapApproved3019LiveQuoteResponse(candidate), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(mapApproved3019LiveQuoteResponse(null, { sourceError: true }), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
