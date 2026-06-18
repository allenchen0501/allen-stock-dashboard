import type { DataSourceId } from "@/types/api";

export interface ProviderConfig {
  id: DataSourceId;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  timeoutMs: number;
  maxRetries: number;
  requestsPerMinute?: number;
  defaultHeaders?: Record<string, string>;
}

export interface ApiConfig {
  defaultProvider: DataSourceId;
  fallbackOrder: DataSourceId[];
  cacheTtlMs: number;
  providers: Partial<Record<DataSourceId, ProviderConfig>>;
}

/** 由環境變數載入設定的契約；避免 service 直接依賴 process.env。 */
export interface ApiConfigLoader {
  load(): ApiConfig;
}
