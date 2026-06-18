import type { DataSourceId, RequestContext } from "@/types/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequest<TBody = unknown> extends RequestContext {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: TBody;
  timeoutMs?: number;
}

export interface HttpResponse<T> {
  status: number;
  headers: Headers;
  data: T;
}

/**
 * 上游 API transport 契約。
 * Yahoo Finance、TWSE、Goodinfo adapter 可共用同一個實作並各自處理格式轉換。
 */
export interface ApiClient {
  request<TResponse, TBody = unknown>(request: HttpRequest<TBody>): Promise<HttpResponse<TResponse>>;
}

export interface ApiClientFactory {
  create(source: DataSourceId): ApiClient;
}
