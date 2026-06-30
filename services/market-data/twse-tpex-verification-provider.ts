/**
 * TWSE / TPEx Verification Provider — APPROVED LIMITED LIVE FETCH DRY-RUN
 *
 * This is the ONLY approved provider file that may perform a limited, read-only,
 * shadow-only live fetch dry-run, under explicit owner approval:
 *
 *   「我同意進行 limited live fetch dry-run implementation，僅限 approved provider、
 *     shadow-only、default fixture、不切 /api/portfolio、不下單、不自動交易。」
 *
 * Hard limits of this dry-run (see docs/limited-live-fetch-dry-run-implementation.md):
 *   - First symbol 3019 only; channel tse_3019.tw only. Any other symbol falls back.
 *   - GET only; timeout=3000ms; maxRetries=0; one symbol per dry-run.
 *   - no cookies; no credentials; no auth header.
 *   - no POST / PUT / PATCH / DELETE; public endpoint only.
 *   - response schema validation + field allowlist required.
 *   - any failure (timeout, non-2xx, JSON parse error, schema/field error) →
 *     fallback to the disabled scaffold candidate.
 *
 * The default path (`getReadonlyQuoteCandidate` with dryRunLiveFetch=false) performs
 * NO network call — the app NEVER live-fetches by default. Live fetch only happens when
 * a caller explicitly opts in (manual smoke script). This is shadow-only and is NOT
 * operational: operationalUseAllowed=false, buySellCommandGenerated=false,
 * autoOrderRequested=false. isConnected only means the source fetch succeeded; it does
 * NOT mean operational or production ready. No env read, no Supabase, no createClient,
 * no DB write, no API route, no /api/portfolio switch, no broker API, no order.
 */

import type {
  PublicQuoteProvider,
  PublicReadonlyQuoteCandidate,
  PublicReadonlyQuoteCandidateOptions,
  PublicQuoteVerificationStatus,
} from "./public-quote-provider.types";

const SCAFFOLD = "(scaffold-only / not connected)";

/**
 * Resolve the clock for `receivedAt`. Returns the injected `now()` when a deterministic
 * clock is provided (tests only); otherwise the real clock. Default runtime behavior is
 * unchanged — no caller passes `now`, so this returns `new Date()`.
 */
function resolveNow(now?: () => Date): Date {
  return now ? now() : new Date();
}

// ---------------------------------------------------------------------------
// Limited live fetch dry-run constants (approved scope)
// ---------------------------------------------------------------------------

/** The single approved listed symbol for this dry-run. */
export const LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019";
/** The single approved channel for this dry-run. */
export const LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw";
/** Public read-only endpoint base (TWSE official MIS getStockInfo). */
export const LIMITED_LIVE_FETCH_ENDPOINT_BASE = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp";
/** Network limits: GET only, timeout=3000ms, maxRetries=0. */
export const LIMITED_LIVE_FETCH_TIMEOUT_MS = 3000;
export const LIMITED_LIVE_FETCH_MAX_RETRIES = 0; // maxRetries=0 — single attempt, no retry loop.

export const LIMITED_LIVE_FETCH_PROVIDER_NAME =
  "TWSE / TPEx verification provider (limited live fetch dry-run, shadow-only)";

/**
 * Response field allowlist — the parser reads ONLY these fields from the upstream
 * payload. Anything else in the response is ignored.
 *   c=symbol code, z=last price, o=open, h=high, l=low, y=previous close,
 *   v=accumulated volume, tlong=source timestamp (ms).
 */
export const LIMITED_LIVE_FETCH_ALLOWED_RESPONSE_FIELDS = [
  "c",
  "z",
  "o",
  "h",
  "l",
  "y",
  "v",
  "tlong",
] as const;

// ---------------------------------------------------------------------------
// Scaffold candidate (default + fallback)
// ---------------------------------------------------------------------------

/**
 * Scaffold-only verification candidate (default + fallback). No network.
 * `receivedAt` stays the scaffold placeholder by default; when a deterministic clock is
 * injected (tests only) it becomes that clock's ISO string, so fallback candidates can
 * be snapshot-tested. Default behavior (no `now`) is unchanged.
 */
export function buildTwseTpexScaffoldCandidate(
  symbol: string,
  now?: () => Date,
): PublicReadonlyQuoteCandidate {
  return {
    symbol,
    market: "TW",
    providerId: "mixed-public",
    providerName: "TWSE / TPEx verification provider (scaffold-only, not connected)",
    price: null,
    open: null,
    high: null,
    low: null,
    previousClose: null,
    volume: null,
    sourceTimestamp: SCAFFOLD,
    receivedAt: now ? now().toISOString() : SCAFFOLD,
    isRealData: false,
    isConnected: false,
    isDisabled: true,
    verificationStatus: "SCAFFOLD_ONLY",
    operationalUseAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };
}

// ---------------------------------------------------------------------------
// Response parsing (field allowlist + schema validation)
// ---------------------------------------------------------------------------

/** Parse a string into a finite number, or null. Rejects "-" / "" / non-numeric. */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "-") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validate + parse the upstream JSON using the field allowlist. On any missing /
 * malformed field, returns the disabled scaffold candidate (never throws).
 */
export function parseLimitedLiveFetchResponse(
  symbol: string,
  json: unknown,
  now?: () => Date,
): PublicReadonlyQuoteCandidate {
  const root = json as { msgArray?: unknown } | null | undefined;
  const arr = root && Array.isArray(root.msgArray) ? root.msgArray : null;
  if (!arr || arr.length === 0) return buildTwseTpexScaffoldCandidate(symbol, now);

  const rawEntry = arr[0] as Record<string, unknown>;
  // Field allowlist: copy ONLY permitted fields out of the upstream entry.
  const picked: Record<string, string> = {};
  for (const field of LIMITED_LIVE_FETCH_ALLOWED_RESPONSE_FIELDS) {
    const v = rawEntry[field];
    if (typeof v === "string") picked[field] = v;
  }

  // Schema validation: must be the approved symbol with a usable price + timestamp.
  if (picked.c !== LIMITED_LIVE_FETCH_APPROVED_SYMBOL) {
    return buildTwseTpexScaffoldCandidate(symbol, now);
  }
  const price = toFiniteNumber(picked.z);
  const tlong = toFiniteNumber(picked.tlong);
  if (price === null || tlong === null) return buildTwseTpexScaffoldCandidate(symbol, now);

  const verificationStatus: PublicQuoteVerificationStatus = "LIVE_FETCH_DRY_RUN";
  return {
    symbol: LIMITED_LIVE_FETCH_APPROVED_SYMBOL,
    market: "TW",
    providerId: "mixed-public",
    providerName: LIMITED_LIVE_FETCH_PROVIDER_NAME,
    price,
    open: toFiniteNumber(picked.o),
    high: toFiniteNumber(picked.h),
    low: toFiniteNumber(picked.l),
    previousClose: toFiniteNumber(picked.y),
    volume: toFiniteNumber(picked.v),
    sourceTimestamp: new Date(tlong).toISOString(),
    // receivedAt: injected deterministic clock if provided, else the real clock.
    receivedAt: resolveNow(now).toISOString(),
    isRealData: true,
    isConnected: true, // fetch succeeded — NOT operational, NOT production ready.
    isDisabled: false,
    verificationStatus,
    operationalUseAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };
}

// ---------------------------------------------------------------------------
// Limited live fetch dry-run (approved scope only)
// ---------------------------------------------------------------------------

/**
 * Perform the limited live fetch dry-run for the approved symbol only.
 * GET only, timeout=3000ms, maxRetries=0, no cookies/credentials/auth header.
 * NEVER throws — any failure resolves to the disabled scaffold candidate.
 */
export async function getTwseTpexLimitedLiveFetchCandidate(
  symbol: string,
  options?: PublicReadonlyQuoteCandidateOptions,
): Promise<PublicReadonlyQuoteCandidate> {
  // Optional deterministic clock (tests only). Default is the real clock.
  const now = options?.now;
  // Restrict to the single approved symbol + channel. Anything else falls back.
  if (symbol !== LIMITED_LIVE_FETCH_APPROVED_SYMBOL) {
    return buildTwseTpexScaffoldCandidate(symbol, now);
  }
  const channel = LIMITED_LIVE_FETCH_APPROVED_CHANNEL;
  if (channel !== `tse_${LIMITED_LIVE_FETCH_APPROVED_SYMBOL}.tw`) {
    return buildTwseTpexScaffoldCandidate(symbol, now);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITED_LIVE_FETCH_TIMEOUT_MS);
  try {
    const url = `${LIMITED_LIVE_FETCH_ENDPOINT_BASE}?ex_ch=${channel}&json=1&delay=0`;
    // GET only — no POST / PUT / PATCH / DELETE; no cookies; no credentials; no auth header.
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
      credentials: "omit",
    });
    if (!response.ok) return buildTwseTpexScaffoldCandidate(symbol, now);
    const json = (await response.json()) as unknown;
    return parseLimitedLiveFetchResponse(symbol, json, now);
  } catch {
    // timeout / network error / JSON parse error → fallback disabled scaffold candidate.
    return buildTwseTpexScaffoldCandidate(symbol, now);
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Provider scaffold
// ---------------------------------------------------------------------------

/**
 * Builds the TWSE / TPEx verification provider. runtimeStatus is NOT_CONNECTED.
 * getReadonlyQuoteCandidate defaults to dryRunLiveFetch=false → scaffold candidate
 * WITHOUT any network call. Only an explicit opt-in (dryRunLiveFetch=true) for the
 * approved symbol delegates to the limited live fetch dry-run.
 */
export function buildTwseTpexVerificationProviderScaffold(): PublicQuoteProvider {
  return {
    providerId: "mixed-public",
    providerName: "TWSE / TPEx verification provider (scaffold-only, not connected)",
    runtimeStatus: "NOT_CONNECTED",
    capabilities: ["OFFICIAL_VERIFICATION_CANDIDATE", "NO_ORDER", "NO_BROKER", "NO_WRITE"],
    getReadonlyQuoteCandidate(
      symbol: string,
      options?: PublicReadonlyQuoteCandidateOptions,
    ): Promise<PublicReadonlyQuoteCandidate> {
      const dryRunLiveFetch = options?.dryRunLiveFetch === true;
      if (!dryRunLiveFetch) {
        // DEFAULT (dryRunLiveFetch=false): scaffold only — no network call.
        return Promise.resolve(buildTwseTpexScaffoldCandidate(symbol, options?.now));
      }
      if (symbol !== LIMITED_LIVE_FETCH_APPROVED_SYMBOL) {
        return Promise.resolve(buildTwseTpexScaffoldCandidate(symbol, options?.now));
      }
      return getTwseTpexLimitedLiveFetchCandidate(symbol, options);
    },
  };
}
