import { NextResponse } from "next/server";
import { YahooMarketProvider } from "@/services/market";
import type { ApiResult, MarketIndex, MarketSnapshot } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MarketRouteData {
  taiwanWeighted: MarketIndex;
  nasdaq: MarketIndex;
  sox: MarketIndex;
  snapshot: MarketSnapshot;
}

const marketService = new YahooMarketProvider();

export async function GET() {
  try {
    const result = await marketService.getSnapshot("GLOBAL", {
      allowFallback: false,
      forceRefresh: true,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: failureStatus(result.error.code) });
    }

    const taiwanWeighted = result.data.indices.find((index) => index.symbol === "^TWII");
    const nasdaq = result.data.indices.find((index) => index.symbol === "^IXIC");
    const sox = result.data.indices.find((index) => index.symbol === "^SOX");

    if (!taiwanWeighted || !nasdaq || !sox) {
      const missing = [
        !taiwanWeighted && "^TWII",
        !nasdaq && "^IXIC",
        !sox && "^SOX",
      ].filter(Boolean).join(", ");

      const failure: ApiResult<MarketRouteData> = {
        ok: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: `Yahoo Finance 缺少必要指數：${missing}`,
          source: "yahoo-finance",
          retryable: true,
        },
        meta: result.meta,
      };

      return NextResponse.json(failure, { status: 502 });
    }

    const response: ApiResult<MarketRouteData> = {
      ok: true,
      data: {
        taiwanWeighted,
        nasdaq,
        sox,
        snapshot: result.data,
      },
      meta: result.meta,
    };

    return NextResponse.json(response);
  } catch (error) {
    const failure: ApiResult<MarketRouteData> = {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: error instanceof Error ? error.message : "市場 API 發生未知錯誤",
        source: "yahoo-finance",
        retryable: true,
      },
      meta: {
        source: "yahoo-finance",
        fetchedAt: new Date().toISOString(),
        cached: false,
      },
    };

    return NextResponse.json(failure, { status: 500 });
  }
}

function failureStatus(code: string): number {
  if (code === "BAD_REQUEST") return 400;
  if (code === "NOT_FOUND") return 404;
  if (code === "RATE_LIMITED") return 429;
  if (code === "TIMEOUT") return 504;
  return 502;
}
