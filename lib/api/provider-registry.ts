import type {
  DataProvider,
  DataSourceId,
  IndexDataProvider,
  MarketDataProvider,
  StockDataProvider,
} from "@/types/api";

export type ProviderAdapter = DataProvider &
  Partial<StockDataProvider & MarketDataProvider & IndexDataProvider>;

/** 集中管理 adapter，service 不需要知道資料來源的建構方式。 */
export interface ProviderRegistry {
  register(provider: ProviderAdapter): void;
  unregister(id: DataSourceId): void;
  get(id: DataSourceId): ProviderAdapter | undefined;
  getStockProvider(preferred?: DataSourceId): StockDataProvider;
  getMarketProvider(preferred?: DataSourceId): MarketDataProvider;
  getIndexProvider(preferred?: DataSourceId): IndexDataProvider;
  list(): ProviderAdapter[];
}
