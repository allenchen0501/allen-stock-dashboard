/**
 * 3019 Approved Live Quote Manual-Refresh MVP — boundary contract + response mapper.
 *
 * This is the FIRST owner-approved read-only real-quote MVP. It is limited to the single
 * approved symbol 3019 (亞光), the approved provider TWSE_TPEX, and the approved channel
 * tse_3019.tw, and is reached ONLY by an explicit user manual refresh — the War Room page
 * never auto-fetches a real quote on load.
 *
 * 定位（read-only real-quote MVP）：
 *   - 只限 3019、只限 TWSE_TPEX approved provider、只限 approved channel tse_3019.tw。
 *   - 只做手動刷新（manual_refresh_only）；預設頁面載入不打真實行情。
 *   - manual refresh 不是自動交易、不是 broker action、不是買賣指令、不是自動下單。
 *   - 不切 /api/portfolio、不接 Supabase、不寫 DB、不接 broker、不代表 production data switch。
 *
 * PURE / FETCH-FREE:
 *   This module performs NO fetch, NO real network, NO Supabase, NO env read, NO DB write,
 *   NO broker API, NO buy/sell command, NO auto order. The actual (approved, read-only)
 *   live fetch happens ONLY in the API route via the existing approved provider; this
 *   module only (a) declares the fixture/boundary contract and (b) maps a candidate that
 *   the route already fetched into the read-only response shape. If a quote value is not
 *   available it is `null` — prices are never fabricated.
 *
 * See: docs/approved-live-quote-3019-manual-refresh-mvp.md
 */

import type { PublicReadonlyQuoteCandidate } from "../../services/market-data/public-quote-provider.types";

// ---------------------------------------------------------------------------
// Approved scope constants (single approved symbol / provider / channel)
// ---------------------------------------------------------------------------

export const APPROVED_LIVE_QUOTE_SYMBOL = "3019" as const;
export const APPROVED_LIVE_QUOTE_NAME_ZH = "亞光" as const;
export const APPROVED_LIVE_QUOTE_PROVIDER = "TWSE_TPEX" as const;
export const APPROVED_LIVE_QUOTE_CHANNEL = "tse_3019.tw" as const;

export type Approved3019DataStatus =
  | "live_verified"
  | "fallback"
  | "timeout"
  | "source_error"
  | "not_available";

// ---------------------------------------------------------------------------
// Read-only response shape (manual refresh)
// ---------------------------------------------------------------------------

export interface Approved3019Quote {
  price: number | null;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  change: number | null;
  changePercent: number | null;
  sourceTimestamp: string | null;
  fetchedAt: string;
}

export interface Approved3019LiveQuoteResponse {
  mvpVersion: "V1";
  symbol: "3019";
  nameZh: "亞光";
  sourceProvider: "TWSE_TPEX";
  approvedChannel: "tse_3019.tw";
  fetchMode: "manual_refresh_only";
  dryRunLiveFetch: true;
  quote: Approved3019Quote;
  dataStatus: Approved3019DataStatus;
  uiStatusZh: string;
  sourceNoteZh: string;
  safetyNoteZh: string;
  requestPerformed: boolean;
  supabaseConnected: false;
  productionWritePerformed: false;
  brokerConnected: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  notTradeAdvice: true;
  notEntrySignal: true;
}

// ---------------------------------------------------------------------------
// Fixture / boundary contract (spec-only, no fetch)
// ---------------------------------------------------------------------------

export interface Approved3019LiveQuoteMvpContract {
  mvpVersion: "V1";
  generatedAt: string;
  approvedProvider: "TWSE_TPEX";
  approvedLiveFetchSymbols: readonly ["3019"];
  approvedChannels: readonly ["tse_3019.tw"];
  manualRefreshOnly: true;
  defaultPageLoadFetchAllowed: false;
  nonApprovedSymbolRejected: true;
  portfolioApiSwitched: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  brokerConnected: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionDataSwitchAllowed: false;
  uiSectionTitleZh: "3019 核准真實報價";
  safetyLabelsZh: readonly ["非買賣建議", "非進場訊號", "非自動下單", "手動刷新不等於交易"];
}

export interface BuildApproved3019LiveQuoteMvpContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-07-02T00:00:00.000Z";

/**
 * Builds the fixture-only boundary contract. Reads no clock / env / network; every field
 * is a fixed boundary declaration proving the MVP stays inside the approved scope.
 */
export function buildApproved3019LiveQuoteMvpContract(
  input: BuildApproved3019LiveQuoteMvpContractInput = {},
): Approved3019LiveQuoteMvpContract {
  return {
    mvpVersion: "V1",
    generatedAt: input.generatedAt ?? DEFAULT_GENERATED_AT,
    approvedProvider: "TWSE_TPEX",
    approvedLiveFetchSymbols: ["3019"],
    approvedChannels: ["tse_3019.tw"],
    manualRefreshOnly: true,
    defaultPageLoadFetchAllowed: false,
    nonApprovedSymbolRejected: true,
    portfolioApiSwitched: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    brokerConnected: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionDataSwitchAllowed: false,
    uiSectionTitleZh: "3019 核准真實報價",
    safetyLabelsZh: ["非買賣建議", "非進場訊號", "非自動下單", "手動刷新不等於交易"],
  };
}

// ---------------------------------------------------------------------------
// Read-only response mapping (pure — candidate is already fetched by the route)
// ---------------------------------------------------------------------------

const SOURCE_NOTE_ZH =
  "資料來源：TWSE_TPEX（核准頻道 tse_3019.tw）；僅在使用者手動刷新時取得，預設頁面載入不抓真實行情。";
const SAFETY_NOTE_ZH =
  "非買賣建議、非進場訊號、非自動下單；手動刷新不等於交易，不代表 production 資料切換。";

/** dataStatus code → 繁體中文顯示文字（所有狀態皆為繁中）。 */
export function approved3019UiStatusZh(status: Approved3019DataStatus): string {
  switch (status) {
    case "live_verified":
      return "真實報價已驗證";
    case "fallback":
      return "已降級為備援（fixture／未連線），顯示資料不足";
    case "timeout":
      return "連線逾時，顯示資料不足";
    case "source_error":
      return "資料來源錯誤，顯示資料不足";
    case "not_available":
      return "資料不足";
    default:
      return "資料不足";
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** True only for a real ISO-8601 timestamp (rejects the scaffold placeholder string). */
function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.includes("T") && !Number.isNaN(Date.parse(value));
}

function nullQuote(fetchedAt: string): Approved3019Quote {
  return {
    price: null,
    previousClose: null,
    open: null,
    high: null,
    low: null,
    volume: null,
    change: null,
    changePercent: null,
    sourceTimestamp: null,
    fetchedAt,
  };
}

function baseResponse(
  dataStatus: Approved3019DataStatus,
  quote: Approved3019Quote,
  requestPerformed: boolean,
): Approved3019LiveQuoteResponse {
  return {
    mvpVersion: "V1",
    symbol: "3019",
    nameZh: "亞光",
    sourceProvider: "TWSE_TPEX",
    approvedChannel: "tse_3019.tw",
    fetchMode: "manual_refresh_only",
    dryRunLiveFetch: true,
    quote,
    dataStatus,
    uiStatusZh: approved3019UiStatusZh(dataStatus),
    sourceNoteZh: SOURCE_NOTE_ZH,
    safetyNoteZh: SAFETY_NOTE_ZH,
    requestPerformed,
    supabaseConnected: false,
    productionWritePerformed: false,
    brokerConnected: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    notTradeAdvice: true,
    notEntrySignal: true,
  };
}

export interface MapApproved3019ResponseOptions {
  now?: () => Date;
  /** Set when the provider call threw (network/source error) → source_error, null quote. */
  sourceError?: boolean;
  /** Set when the fetch aborted on timeout → timeout, null quote. */
  timedOut?: boolean;
}

/**
 * Maps a candidate that the API route ALREADY fetched (via the approved provider) into the
 * read-only manual-refresh response. Pure: no fetch, no clock read unless `now` is injected
 * (defaults to the real clock only for `fetchedAt`). A missing / unusable price is `null` —
 * prices and timestamps are never fabricated.
 */
export function mapApproved3019LiveQuoteResponse(
  candidate: PublicReadonlyQuoteCandidate | null,
  options: MapApproved3019ResponseOptions = {},
): Approved3019LiveQuoteResponse {
  const fetchedAt = (options.now ? options.now() : new Date()).toISOString();

  if (options.timedOut) return baseResponse("timeout", nullQuote(fetchedAt), true);
  if (options.sourceError || candidate == null) {
    return baseResponse("source_error", nullQuote(fetchedAt), true);
  }

  // A connected, real candidate is required before ANY numeric value is surfaced.
  const connectedReal = candidate.isConnected === true && candidate.isRealData === true;
  const price = connectedReal ? candidate.price : null;
  const previousClose = connectedReal ? candidate.previousClose : null;
  const change = price !== null && previousClose !== null ? round2(price - previousClose) : null;
  const changePercent =
    change !== null && previousClose !== null && previousClose !== 0
      ? round2((change / previousClose) * 100)
      : null;

  const quote: Approved3019Quote = {
    price,
    previousClose,
    open: connectedReal ? candidate.open : null,
    high: connectedReal ? candidate.high : null,
    low: connectedReal ? candidate.low : null,
    volume: connectedReal ? candidate.volume : null,
    change,
    changePercent,
    sourceTimestamp: connectedReal && isIsoTimestamp(candidate.sourceTimestamp)
      ? candidate.sourceTimestamp
      : null,
    fetchedAt: isIsoTimestamp(candidate.receivedAt) ? candidate.receivedAt : fetchedAt,
  };

  let dataStatus: Approved3019DataStatus;
  if (connectedReal && price !== null) dataStatus = "live_verified";
  else if (connectedReal && price === null) dataStatus = "not_available";
  else dataStatus = "fallback";

  return baseResponse(dataStatus, quote, true);
}

/**
 * Response for a rejected (non-approved) symbol/mode request. No fetch was performed, so
 * requestPerformed=false and every quote value is null. Approved symbols remain ["3019"].
 * An optional `reasonZh` explains WHY the request was rejected (non-approved symbol vs
 * manual-mode-required) without fabricating any price.
 */
export function buildApproved3019RejectionResponse(
  options: { now?: () => Date; reasonZh?: string } = {},
): Approved3019LiveQuoteResponse {
  const fetchedAt = (options.now ? options.now() : new Date()).toISOString();
  const resp = baseResponse("not_available", nullQuote(fetchedAt), false);
  if (options.reasonZh) {
    return { ...resp, uiStatusZh: options.reasonZh, sourceNoteZh: options.reasonZh };
  }
  return resp;
}
