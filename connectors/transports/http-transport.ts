export type ConnectorHttpEnvironment = Readonly<
  Record<string, string | undefined>
>;

export interface HttpTransportOptions {
  environment?: ConnectorHttpEnvironment;
  disabled?: boolean;
  defaultTimeoutMs?: number;
  fetcher?: typeof fetch;
}

export interface HttpTransportRequest {
  url: string;
  timeoutMs?: number;
  headers?: Readonly<Record<string, string>>;
}

export interface HttpTransportResult<T> {
  status: "disabled" | "success" | "failed";
  data: T | null;
  errorCode:
    | "CONNECTOR_DISABLED"
    | "INVALID_URL"
    | "TIMEOUT"
    | "RATE_LIMITED"
    | "HTTP_ERROR"
    | "INVALID_JSON"
    | "NETWORK_ERROR"
    | null;
  errorMessage: string | null;
  requestedAt: string;
  completedAt: string | null;
  httpStatus: number | null;
}

const OFFICIAL_HOSTS = new Set([
  "openapi.twse.com.tw",
  "www.tpex.org.tw",
]);

function isExplicitlyEnabled(environment: ConnectorHttpEnvironment): boolean {
  return environment.CONNECTOR_HTTP_ENABLED?.trim().toLowerCase() === "true";
}

/** Server-only, read-only JSON transport. Disabled unless explicitly enabled. */
export class ConnectorHttpTransport {
  private readonly environment: ConnectorHttpEnvironment;
  private readonly disabled: boolean;
  private readonly defaultTimeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(options: HttpTransportOptions = {}) {
    this.environment = options.environment ?? process.env;
    this.disabled = options.disabled ?? false;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  get enabled(): boolean {
    return (
      typeof window === "undefined" &&
      !this.disabled &&
      isExplicitlyEnabled(this.environment)
    );
  }

  async getJson<T>(request: HttpTransportRequest): Promise<HttpTransportResult<T>> {
    const requestedAt = new Date().toISOString();
    if (!this.enabled) {
      return {
        status: "disabled",
        data: null,
        errorCode: "CONNECTOR_DISABLED",
        errorMessage:
          "Official connector HTTP is disabled. Set CONNECTOR_HTTP_ENABLED=true on the server to enable it.",
        requestedAt,
        completedAt: null,
        httpStatus: null,
      };
    }

    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return this.failed(
        requestedAt,
        "INVALID_URL",
        "Connector URL is invalid.",
      );
    }
    if (url.protocol !== "https:" || !OFFICIAL_HOSTS.has(url.hostname)) {
      return this.failed(
        requestedAt,
        "INVALID_URL",
        "Connector URL is outside the official host allowlist.",
      );
    }

    const controller = new AbortController();
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetcher(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...request.headers,
        },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
      const completedAt = new Date().toISOString();
      if (!response.ok) {
        return {
          status: "failed",
          data: null,
          errorCode: response.status === 429 ? "RATE_LIMITED" : "HTTP_ERROR",
          errorMessage: `Official connector returned HTTP ${response.status}.`,
          requestedAt,
          completedAt,
          httpStatus: response.status,
        };
      }

      try {
        return {
          status: "success",
          data: (await response.json()) as T,
          errorCode: null,
          errorMessage: null,
          requestedAt,
          completedAt,
          httpStatus: response.status,
        };
      } catch {
        return {
          status: "failed",
          data: null,
          errorCode: "INVALID_JSON",
          errorMessage: "Official connector response was not valid JSON.",
          requestedAt,
          completedAt,
          httpStatus: response.status,
        };
      }
    } catch (error) {
      const timedOut =
        controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError");
      return this.failed(
        requestedAt,
        timedOut ? "TIMEOUT" : "NETWORK_ERROR",
        timedOut
          ? `Official connector exceeded ${timeoutMs} ms.`
          : "Official connector network request failed.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private failed(
    requestedAt: string,
    errorCode: Exclude<HttpTransportResult<never>["errorCode"], null>,
    errorMessage: string,
  ): HttpTransportResult<never> {
    return {
      status: "failed",
      data: null,
      errorCode,
      errorMessage,
      requestedAt,
      completedAt: new Date().toISOString(),
      httpStatus: null,
    };
  }
}
