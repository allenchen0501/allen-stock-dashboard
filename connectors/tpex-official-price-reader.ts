import type {
  ConnectorError,
  ConnectorRequestOptions,
  ConnectorResponse,
  NormalizedQuoteRecord,
} from "./types";
import { ConnectorHttpTransport } from "./transports/http-transport";

export const TPEX_OFFICIAL_PRICE_ENDPOINT =
  "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes";

type OfficialPayloadRow = Record<string, unknown>;

function isObject(value: unknown): value is OfficialPayloadRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowsFromPayload(payload: unknown): OfficialPayloadRow[] {
  if (Array.isArray(payload)) return payload.filter(isObject);
  if (!isObject(payload)) return [];
  for (const key of ["data", "result", "records"]) {
    if (Array.isArray(payload[key])) return payload[key].filter(isObject);
  }
  return [];
}

function pick(row: OfficialPayloadRow, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.replaceAll(",", "").trim();
  if (!normalized || normalized === "--") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isoDate(value: unknown): string {
  const raw = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 7) {
    const year = Number(digits.slice(0, 3)) + 1911;
    return `${year}-${digits.slice(3, 5)}-${digits.slice(5, 7)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return "";
}

function normalizeRow(row: OfficialPayloadRow): NormalizedQuoteRecord {
  return {
    symbol: text(
      pick(row, ["SecuritiesCompanyCode", "Code", "code", "證券代號"]),
    ),
    market: "TPEx",
    price: numberValue(pick(row, ["Close", "ClosingPrice", "close", "收盤價"])),
    volume: numberValue(
      pick(row, ["TradingShares", "TradeVolume", "volume", "成交股數"]),
    ),
    currency: "TWD",
    record_date: isoDate(
      pick(row, ["Date", "date", "TradeDate", "資料日期"]),
    ),
    record_time: text(
      pick(row, ["Time", "time", "TradeTime", "資料時間"]),
    ),
    source_name: "tpex-openapi",
    source_type: "official_exchange",
    source_confidence: 100,
    data_frequency: "daily_close",
    is_model_inference: false,
  };
}

/** Server-only official OTC-equity reader. It never persists data. */
export class TpexOfficialPriceReader {
  readonly sourceName = "tpex-openapi" as const;
  readonly timeoutMs = 10_000;

  constructor(
    private readonly transport = new ConnectorHttpTransport({
      defaultTimeoutMs: 10_000,
    }),
  ) {}

  async read(
    options: ConnectorRequestOptions = { symbols: [] },
  ): Promise<ConnectorResponse<NormalizedQuoteRecord>> {
    const transport = await this.transport.getJson<unknown>({
      url: TPEX_OFFICIAL_PRICE_ENDPOINT,
      timeoutMs: options.timeoutMs ?? this.timeoutMs,
    });
    if (transport.status !== "success" || transport.data === null) {
      return this.failureResponse(options, transport);
    }

    const requestedSymbols = new Set(
      options.symbols.map((symbol) => symbol.trim()).filter(Boolean),
    );
    const records = rowsFromPayload(transport.data)
      .map(normalizeRow)
      .filter(
        (record) =>
          requestedSymbols.size === 0 || requestedSymbols.has(record.symbol),
      );

    return {
      sourceName: this.sourceName,
      status: records.length > 0 ? "success" : "failed",
      records,
      warnings:
        records.length > 0
          ? []
          : ["TPEx payload contained no matching normalized records."],
      errors:
        records.length > 0
          ? []
          : [this.error("NORMALIZATION_FAILED", "No TPEx rows were normalized.")],
      requestedAt: transport.requestedAt,
      completedAt: transport.completedAt,
      fromFixture: false,
    };
  }

  private failureResponse(
    options: ConnectorRequestOptions,
    transport: Awaited<ReturnType<ConnectorHttpTransport["getJson"]>>,
  ): ConnectorResponse<NormalizedQuoteRecord> {
    const disabled = transport.status === "disabled";
    return {
      sourceName: this.sourceName,
      status: disabled ? "disabled" : "failed",
      records: [],
      warnings: disabled
        ? ["TPEx HTTP reader is disabled; fixture mode remains active."]
        : [],
      errors: [
        this.error(
          disabled ? "CONNECTOR_DISABLED" : "UPSTREAM_UNAVAILABLE",
          transport.errorMessage ?? "TPEx official read failed.",
        ),
      ],
      requestedAt: transport.requestedAt ?? options.requestedAt ?? null,
      completedAt: transport.completedAt,
      fromFixture: false,
    };
  }

  private error(
    code: ConnectorError["code"],
    message: string,
  ): ConnectorError {
    return {
      code,
      message,
      retryable: code === "UPSTREAM_UNAVAILABLE",
      sourceName: this.sourceName,
    };
  }
}
