export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

/** 可替換為記憶體、Redis 或 Vercel KV 的快取契約。 */
export interface ApiCache {
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  clearByPrefix(prefix: string): Promise<void>;
}
