import { NextResponse } from "next/server";
import { YahooStockProvider } from "@/services/stocks";
import {
  resolvePortfolioModeFromEnvironment,
} from "@/use-cases/portfolio/portfolio-mode";
import {
  buildSwitchGuardMetadata,
  type PortfolioSwitchGuardMetadata,
} from "@/use-cases/portfolio/portfolio-switch-guard";
import type { PortfolioModeResolution } from "@/use-cases/portfolio/types";
import type { ApiMetadata, ApiResult, StockSnapshot } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stocksService = new YahooStockProvider();

type PortfolioApiMetadata = ApiMetadata & {
  portfolioMode: PortfolioSwitchGuardMetadata;
};

interface PortfolioApiSuccess {
  ok: true;
  data: StockSnapshot[];
  meta: PortfolioApiMetadata;
}

export async function GET() {
  const mode = resolvePortfolioModeFromEnvironment();

  try {
    // Hardcoded data is always loaded first in V3-5. Empty skeleton data can
    // therefore never replace the current API response.
    const result = await stocksService.getPortfolioSnapshots({
      allowFallback: false,
      forceRefresh: true,
    });

    const portfolioMode = createPortfolioSwitchMetadata(mode);

    if (!result.ok) {
      return NextResponse.json(
        {
          ...result,
          meta: {
            ...result.meta,
            portfolioMode,
          },
        },
        { status: failureStatus(result.error.code) },
      );
    }

    const response: PortfolioApiSuccess = {
      ok: true,
      data: result.data,
      meta: {
        ...result.meta,
        portfolioMode,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const portfolioMode = createPortfolioSwitchMetadata(mode);
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
        warnings: portfolioMode.warnings,
      },
    };

    return NextResponse.json(
      {
        ...failure,
        meta: {
          ...failure.meta,
          portfolioMode,
        },
      },
      { status: 500 },
    );
  }
}

function createPortfolioSwitchMetadata(
  mode: PortfolioModeResolution,
): PortfolioSwitchGuardMetadata {
  return buildSwitchGuardMetadata(mode);
}

function failureStatus(code: string): number {
  if (code === "BAD_REQUEST") return 400;
  if (code === "NOT_FOUND") return 404;
  if (code === "RATE_LIMITED") return 429;
  if (code === "TIMEOUT") return 504;
  return 502;
}
