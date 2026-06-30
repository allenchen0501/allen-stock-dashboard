/**
 * Public Quote Provider Types — SCAFFOLD ONLY, NOT CONNECTED
 *
 * Type definitions for the future read-only shadow runtime. SCAFFOLD ONLY: no live
 * fetch, no env reads, no Supabase, no DB writes, no API route, no order, no broker.
 * Every provider is scaffold-only / not connected; candidates are never real data and
 * never operational. The contract decision is NO_GO; default real data mode is fixture.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type PublicQuoteProviderId = "yahoo" | "twse" | "tpex" | "mixed-public" | "disabled";

export type PublicQuoteProviderRuntimeStatus =
  | "SCAFFOLD_ONLY"
  | "DISABLED"
  | "NOT_CONNECTED"
  | "SHADOW_RUNTIME_LOCKED";

export type PublicQuoteProviderCapability =
  | "READONLY_QUOTE_CANDIDATE"
  | "OFFICIAL_VERIFICATION_CANDIDATE"
  | "NO_ORDER"
  | "NO_BROKER"
  | "NO_WRITE";

export type PublicQuoteVerificationStatus =
  | "SCAFFOLD_ONLY"
  | "NOT_CONNECTED"
  | "DISABLED"
  // Limited live fetch dry-run only: source fetch succeeded (shadow-only, NOT operational).
  | "LIVE_FETCH_DRY_RUN";

// ---------------------------------------------------------------------------
// Read-only quote candidate
// ---------------------------------------------------------------------------

export interface PublicReadonlyQuoteCandidate {
  symbol: string;
  market: string;
  providerId: PublicQuoteProviderId;
  providerName: string;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number | null;
  sourceTimestamp: string;
  receivedAt: string;
  isRealData: boolean;
  isConnected: boolean;
  isDisabled: boolean;
  verificationStatus: PublicQuoteVerificationStatus;
  operationalUseAllowed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
}

// ---------------------------------------------------------------------------
// Read-only candidate options
// ---------------------------------------------------------------------------

/**
 * Options for getReadonlyQuoteCandidate / the limited live fetch dry-run.
 * Both fields are optional and default to the existing runtime behavior:
 *   - dryRunLiveFetch defaults to false (scaffold-only, no network call).
 *   - now defaults to the real clock (`new Date()`); inject a deterministic clock
 *     ONLY in tests to make `receivedAt` reproducible. It does not change scope.
 */
export type PublicReadonlyQuoteCandidateOptions = {
  dryRunLiveFetch?: boolean;
  now?: () => Date;
};

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface PublicQuoteProvider {
  providerId: PublicQuoteProviderId;
  providerName: string;
  runtimeStatus: PublicQuoteProviderRuntimeStatus;
  capabilities: PublicQuoteProviderCapability[];
  // Scaffold interface. The default path performs NO network call. An approved
  // provider may opt into a limited read-only live fetch dry-run ONLY when the caller
  // explicitly passes { dryRunLiveFetch: true } (shadow-only, default fixture). An
  // optional { now } clock makes receivedAt deterministic in tests only.
  getReadonlyQuoteCandidate(
    symbol: string,
    options?: PublicReadonlyQuoteCandidateOptions,
  ): Promise<PublicReadonlyQuoteCandidate>;
}

// ---------------------------------------------------------------------------
// Shadow runtime comparison
// ---------------------------------------------------------------------------

export interface ShadowRuntimeComparison {
  symbol: string;
  fixtureQuote: PublicReadonlyQuoteCandidate;
  realQuoteCandidate: PublicReadonlyQuoteCandidate;
  runtimeStatus: "SCAFFOLD_ONLY_NOT_CONNECTED";
  decision: "NO_GO";
  liveFetchPerformed: false;
  envReadPerformed: false;
  supabaseConnected: false;
  apiRouteCreated: false;
  portfolioApiSwitched: false;
  operationalUseAllowed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionReady: false;
  mapsToV67V68V69: true;
  downgradeReason: string;
}

// ---------------------------------------------------------------------------
// Staging shadow runtime contract
// ---------------------------------------------------------------------------

export interface StagingShadowRuntimeContract {
  contractVersion: "STAGING_SHADOW_RUNTIME_SCAFFOLD";
  mode: "SCAFFOLD_ONLY_NOT_CONNECTED";
  generatedAt: string;
  decision: "NO_GO";

  defaultRealDataMode: "fixture";
  shadowRuntimeAllowed: false;
  liveFetchAllowed: false;
  envReadAllowed: false;
  supabaseConnectionAllowed: false;
  apiRouteAllowed: false;
  portfolioApiSwitchAllowed: false;
  productionReady: false;
  serviceRoleForbidden: true;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  brokerApiAllowed: false;

  providerCatalog: Array<{ providerId: PublicQuoteProviderId; runtimeStatus: PublicQuoteProviderRuntimeStatus }>;
  sampleComparison: ShadowRuntimeComparison;
  validation: StagingShadowRuntimeValidation;

  safetyLabels: string[];
}

export interface StagingShadowRuntimeValidation {
  contractVersionScaffold: boolean;
  modeScaffoldNotConnected: boolean;
  decisionNoGo: boolean;
  defaultModeFixture: boolean;
  shadowRuntimeLocked: boolean;
  liveFetchLocked: boolean;
  envReadLocked: boolean;
  supabaseConnectionLocked: boolean;
  apiRouteLocked: boolean;
  portfolioApiSwitchLocked: boolean;
  productionNotReady: boolean;
  serviceRoleForbidden: boolean;
  brokerApiLocked: boolean;
  noBuySellCommand: boolean;
  noAutoOrder: boolean;
  providersScaffoldOnly: boolean;
  comparisonNonOperational: boolean;
  comparisonMapsToDowngrade: boolean;
  valid: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STAGING_SHADOW_RUNTIME_CONTRACT_VERSION = "STAGING_SHADOW_RUNTIME_SCAFFOLD" as const;

export const STAGING_SHADOW_RUNTIME_SAFETY_LABELS = [
  "Staging Shadow Runtime Scaffold",
  "SCAFFOLD_ONLY_NOT_CONNECTED",
  "NO_GO",
  "no live fetch",
  "no env read",
  "no Supabase connection",
  "no API route",
  "no /api/portfolio switch",
  "no real market data",
  "no DB write",
  "no broker API",
  "no buy/sell command",
  "no auto order",
  "not production ready",
  "service role forbidden",
  "default remains fixture",
  "kill switch remains off",
  "shadow runtime still non-operational",
] as const;
