import { NextResponse } from "next/server";
import { YahooStockProvider } from "@/services/stocks";
import type { ApiResult, StockSnapshot } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stocksService = new YahooStockProvider();

export async function GET() {
  try {
    const result = await stocksService.getPortfolioSnapshots({
      allowFallback: false,
      forceRefresh: true,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: failureStatus(result.error.code) });
    }

    const response: ApiResult<StockSnapshot[]> = {
      ok: true,
      data: result.data,
      meta: result.meta,
    };

    return NextResponse.json(response);
  } catch (error) {
    const failure: ApiResult<StockSnapshot[]> = {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: error instanceof Error ? error.message : "持股 API 發生未知錯誤",
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
