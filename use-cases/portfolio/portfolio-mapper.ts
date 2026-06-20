import type {
  DataQualityIssue,
  DataQualityStatus,
} from "@/lib/data-quality";
import type { PortfolioStock } from "@/lib/types/database";

export type PortfolioPriceSourceRole =
  | "daily_prices"
  | "stock_snapshots"
  | "yahoo_fallback";

export interface PortfolioValuationContext {
  current_price: number | null;
  source_name: string | null;
  source_role: PortfolioPriceSourceRole | null;
  data_quality_status: DataQualityStatus | "unavailable";
  decision_ready: boolean;
  reference_only: boolean;
  data_quality_issues: DataQualityIssue[];
}

export interface PortfolioDomainModel {
  id: string;
  symbol: string;
  name: string;
  market: string;
  position_type: "long" | "short";
  is_active: boolean;
  cost_price: number;
  quantity: number;
  current_price: number | null;
  cost_basis: number;
  market_value: number | null;
  unrealized_profit_loss: number | null;
  return_rate: number | null;
  price_source: string | null;
  price_source_role: PortfolioPriceSourceRole | null;
  data_quality_status: DataQualityStatus | "unavailable";
  decision_ready: boolean;
  reference_only: boolean;
  data_quality_issues: DataQualityIssue[];
}

const EMPTY_VALUATION: PortfolioValuationContext = {
  current_price: null,
  source_name: null,
  source_role: null,
  data_quality_status: "unavailable",
  decision_ready: false,
  reference_only: false,
  data_quality_issues: [],
};

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Maps a database row to the Portfolio domain without inventing missing prices. */
export function mapPortfolioStock(
  stock: PortfolioStock,
  valuation: PortfolioValuationContext = EMPTY_VALUATION,
): PortfolioDomainModel {
  const costPrice = Number(stock.cost_price);
  const quantity = Number(stock.shares);
  const costBasis = round(costPrice * quantity);
  const currentPrice = valuation.current_price;
  const marketValue =
    currentPrice === null ? null : round(currentPrice * quantity);
  const unrealizedProfitLoss =
    currentPrice === null
      ? null
      : round(
          (stock.position_type === "short"
            ? costPrice - currentPrice
            : currentPrice - costPrice) * quantity,
        );
  const returnRate =
    unrealizedProfitLoss === null || costBasis <= 0
      ? null
      : round((unrealizedProfitLoss / costBasis) * 100);

  return {
    id: stock.id,
    symbol: stock.symbol,
    name: stock.name,
    market: stock.market,
    position_type: stock.position_type,
    is_active: stock.is_active,
    cost_price: costPrice,
    quantity,
    current_price: currentPrice,
    cost_basis: costBasis,
    market_value: marketValue,
    unrealized_profit_loss: unrealizedProfitLoss,
    return_rate: returnRate,
    price_source: valuation.source_name,
    price_source_role: valuation.source_role,
    data_quality_status: valuation.data_quality_status,
    decision_ready: valuation.decision_ready,
    reference_only: valuation.reference_only,
    data_quality_issues: [...valuation.data_quality_issues],
  };
}
