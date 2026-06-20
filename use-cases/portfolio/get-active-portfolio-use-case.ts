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

export class GetActivePortfolioUseCase {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly priceSource?: PortfolioPriceSource,
  ) {}

  async execute(
    options: GetActivePortfolioOptions = {},
  ): Promise<PortfolioDomainModel[]> {
    const stocks = await this.portfolioRepository.getActivePortfolioStocks();
    const activeStocks = stocks.filter((stock) => stock.is_active);

    return Promise.all(
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
  }
}
