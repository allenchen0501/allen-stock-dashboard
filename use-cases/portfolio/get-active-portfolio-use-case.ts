import type { DataQualityRecordInput, QuoteFreshnessOptions } from "@/lib/data-quality";
import type { PortfolioStock } from "@/lib/types/database";
import type { PortfolioRepository } from "@/repositories/portfolio-repository";
import {
  mapPortfolioStock,
  type PortfolioDomainModel,
  type PortfolioPriceSourceRole,
  type PortfolioValuationContext,
} from "./portfolio-mapper";
import { validatePortfolioQuote } from "./portfolio-validation";

export interface PortfolioQuoteCandidate {
  primary: DataQualityRecordInput;
  secondary?: DataQualityRecordInput;
}

/** Future port for daily_prices, stock_snapshots, or a Yahoo fallback adapter. */
export interface PortfolioPriceSource {
  readonly role: PortfolioPriceSourceRole;
  getQuote(stock: PortfolioStock): Promise<PortfolioQuoteCandidate | null>;
}

export interface GetActivePortfolioOptions {
  freshness?: QuoteFreshnessOptions;
}

export type PortfolioFallbackReason =
  | "repository_error"
  | "empty_portfolio"
  | "inactive_record"
  | "validation_failed";

export interface ActivePortfolioExecutionResult {
  data: PortfolioDomainModel[];
  source: "supabase" | "hardcoded";
  fallback_applied: boolean;
  fallback_reason: PortfolioFallbackReason | null;
  validation_passed: boolean;
  warnings: string[];
}

export type HardcodedPortfolioFallback = () => Promise<PortfolioDomainModel[]>;

interface PortfolioLoadResult {
  data: PortfolioDomainModel[];
  inactiveRecordDetected: boolean;
}

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error("GetActivePortfolioUseCase is server-only.");
  }
}

function passesSupabaseValidation(
  portfolio: readonly PortfolioDomainModel[],
): boolean {
  return portfolio.every(
    (stock) =>
      stock.is_active &&
      stock.symbol.trim().length > 0 &&
      stock.market.trim().length > 0 &&
      Number.isFinite(stock.cost_price) &&
      stock.cost_price >= 0 &&
      Number.isFinite(stock.quantity) &&
      stock.quantity > 0 &&
      stock.data_quality_status === "valid" &&
      stock.decision_ready &&
      !stock.reference_only,
  );
}

export class GetActivePortfolioUseCase {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly priceSource?: PortfolioPriceSource,
  ) {}

  async execute(
    options: GetActivePortfolioOptions = {},
  ): Promise<PortfolioDomainModel[]> {
    assertServerRuntime();
    return (await this.loadActivePortfolio(options)).data;
  }

  /**
   * Safe V3-5 composition contract. Empty, inactive, invalid, suspicious,
   * stale, unavailable, or repository failures must retain hardcoded data.
   */
  async executeWithHardcodedFallback(
    hardcodedFallback: HardcodedPortfolioFallback,
    options: GetActivePortfolioOptions = {},
  ): Promise<ActivePortfolioExecutionResult> {
    assertServerRuntime();

    try {
      const result = await this.loadActivePortfolio(options);
      if (result.inactiveRecordDetected) {
        return this.fallback(
          hardcodedFallback,
          "inactive_record",
          "Supabase returned an inactive Portfolio record.",
        );
      }
      if (result.data.length === 0) {
        return this.fallback(
          hardcodedFallback,
          "empty_portfolio",
          "Supabase active Portfolio is empty.",
        );
      }
      if (!passesSupabaseValidation(result.data)) {
        return this.fallback(
          hardcodedFallback,
          "validation_failed",
          "Supabase Portfolio did not pass Data Quality validation.",
        );
      }

      return {
        data: result.data,
        source: "supabase",
        fallback_applied: false,
        fallback_reason: null,
        validation_passed: true,
        warnings: [],
      };
    } catch (error) {
      return this.fallback(
        hardcodedFallback,
        "repository_error",
        error instanceof Error
          ? `Supabase Portfolio failed: ${error.message}`
          : "Supabase Portfolio failed with an unknown error.",
      );
    }
  }

  private async loadActivePortfolio(
    options: GetActivePortfolioOptions,
  ): Promise<PortfolioLoadResult> {
    const stocks = await this.portfolioRepository.getActivePortfolioStocks();
    const activeStocks = stocks.filter((stock) => stock.is_active);

    const data = await Promise.all(
      activeStocks.map(async (stock) => {
        if (!this.priceSource) return mapPortfolioStock(stock);

        const candidate = await this.priceSource.getQuote(stock);
        if (!candidate) return mapPortfolioStock(stock);

        const validation = validatePortfolioQuote(
          candidate.primary,
          candidate.secondary,
          options.freshness,
        );
        const currentPrice =
          validation.canUseAsReference &&
          typeof candidate.primary.value === "number"
            ? candidate.primary.value
            : null;
        const valuation: PortfolioValuationContext = {
          current_price: currentPrice,
          source_name: candidate.primary.source_name ?? null,
          source_role: this.priceSource.role,
          data_quality_status: validation.result.status,
          decision_ready: validation.canEnterDecision,
          reference_only: validation.result.status === "stale",
          data_quality_issues: validation.result.issues,
        };

        return mapPortfolioStock(stock, valuation);
      }),
    );

    return {
      data,
      inactiveRecordDetected: activeStocks.length !== stocks.length,
    };
  }

  private async fallback(
    hardcodedFallback: HardcodedPortfolioFallback,
    reason: PortfolioFallbackReason,
    warning: string,
  ): Promise<ActivePortfolioExecutionResult> {
    return {
      data: await hardcodedFallback(),
      source: "hardcoded",
      fallback_applied: true,
      fallback_reason: reason,
      validation_passed: false,
      warnings: [warning],
    };
  }
}
