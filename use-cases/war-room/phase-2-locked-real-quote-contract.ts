/**
 * Phase 2 Locked Real Quote Interface Contract — INTERFACE ONLY, NOT CONNECTED
 *
 * TypeScript types + interfaces for the FUTURE staging read-only real quote dry-run.
 * This is a LOCKED INTERFACE: it defines the shapes only. No runtime connection, no
 * fetch, no Supabase client, no env reads, no DB writes, no API route, no broker, no
 * order. The default real data mode is "fixture"; shadow / real-readonly are NOT
 * enabled. Decision is NO_GO.
 *
 * See: docs/phase-2-implementation-pr-scope.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type RealDataMode = "fixture" | "shadow" | "real-readonly";

export type RealQuoteProviderId = "yahoo" | "twse" | "tpex" | "mixed-public" | "disabled";

export type RealQuoteProviderStatus = "DISABLED" | "PLANNED" | "SHADOW_ONLY" | "REAL_READONLY_LOCKED";

export type RealQuoteVerificationStatus =
  | "NOT_CONNECTED"
  | "DISABLED"
  | "FIXTURE_ONLY"
  | "SHADOW_ONLY"
  | "STALE"
  | "CONFLICT"
  | "MISSING";

// ---------------------------------------------------------------------------
// Read-only quote snapshot
// ---------------------------------------------------------------------------

export interface ReadonlyQuoteSnapshot {
  symbol: string;
  market: string;
  sourceName: string;
  sourceProvider: RealQuoteProviderId;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number | null;
  sourceTimestamp: string;
  receivedAt: string;
  isRealData: boolean;
  isStale: boolean;
  verificationStatus: RealQuoteVerificationStatus;
  operationalUseAllowed: false;
}

// ---------------------------------------------------------------------------
// Quote provider interface
// ---------------------------------------------------------------------------

export interface QuoteProvider {
  providerId: RealQuoteProviderId;
  providerName: string;
  status: RealQuoteProviderStatus;
  supports: string[];
  // Locked interface only. A future implementation must stay read-only; the disabled
  // provider returns a not-connected snapshot and never performs any network call.
  getQuote(symbol: string): Promise<ReadonlyQuoteSnapshot>;
}

// ---------------------------------------------------------------------------
// Shadow comparison
// ---------------------------------------------------------------------------

export interface ShadowQuoteComparison {
  symbol: string;
  fixtureQuote: ReadonlyQuoteSnapshot;
  realQuoteCandidate: ReadonlyQuoteSnapshot;
  priceDifference: number | null;
  priceDifferencePercent: number | null;
  timestampDifferenceSeconds: number | null;
  conflictDetected: boolean;
  staleDetected: boolean;
  missingRealQuote: boolean;
  downgradeReason: string;
  mapsToV67V68V69: true;
  operationalUseAllowed: false;
}

// ---------------------------------------------------------------------------
// Locked implementation contract
// ---------------------------------------------------------------------------

export interface Phase2LockedImplementationContract {
  contractVersion: "PHASE_2_LOCKED_INTERFACE";
  mode: "INTERFACE_ONLY_NOT_CONNECTED";
  generatedAt: string;
  decision: "NO_GO";

  defaultRealDataMode: "fixture";
  shadowModeAllowed: false;
  realReadonlyAllowed: false;

  realDataConnected: false;
  fetchPerformed: false;
  envReadPerformed: false;
  supabaseConnected: false;
  apiRouteCreated: false;
  portfolioApiSwitched: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionReady: false;

  providerCatalog: Array<{ providerId: RealQuoteProviderId; status: RealQuoteProviderStatus }>;
  sampleShadowComparison: ShadowQuoteComparison;
  validation: Phase2LockedImplementationValidation;

  safetyLabels: string[];
}

export interface Phase2LockedImplementationValidation {
  contractVersionLocked: boolean;
  modeInterfaceOnly: boolean;
  decisionNoGo: boolean;
  defaultModeFixture: boolean;
  shadowModeLocked: boolean;
  realReadonlyLocked: boolean;
  allConnectionFlagsFalse: boolean;
  disabledProviderIsDisabled: boolean;
  disabledSnapshotNotRealData: boolean;
  disabledSnapshotOperationalUseFalse: boolean;
  shadowComparisonOperationalUseFalse: boolean;
  shadowComparisonMapsToDowngrade: boolean;
  valid: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PHASE_2_LOCKED_IMPLEMENTATION_CONTRACT_VERSION = "PHASE_2_LOCKED_INTERFACE" as const;

export const PHASE_2_LOCKED_IMPLEMENTATION_SAFETY_LABELS = [
  "Phase 2 Implementation PR Scope",
  "PHASE_2_LOCKED_INTERFACE",
  "INTERFACE_ONLY_NOT_CONNECTED",
  "NO_GO",
  "fixture default",
  "shadow mode still locked",
  "real-readonly still locked",
  "DisabledRealQuoteProvider",
  "no fetch",
  "no env read",
  "no Supabase connection",
  "no real market data",
  "no API route",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
  "no券商下單 API（no order-execution source）",
  "not production ready",
] as const;
