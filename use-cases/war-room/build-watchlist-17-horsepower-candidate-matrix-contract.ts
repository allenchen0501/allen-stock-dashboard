/**
 * Watchlist 17 Horsepower Candidate Matrix Contract.
 *
 * Fixture-only integration between Watchlist Universe Tier metadata and the
 * 17 Horsepower technical scanner fields. It ranks candidates for observation
 * only; it does not fetch real data, switch production data, or generate orders.
 */

import { build17HorsepowerScannerContract } from "./build-17-horsepower-scanner-contract";
import { buildWatchlistUniverseTierContract } from "./build-watchlist-universe-tier-contract";
import type { WatchlistUniverseStock, WatchlistUniverseTier } from "./build-watchlist-universe-tier-contract";

export type WatchlistHorsepowerLevel = "主升段" | "多頭確認" | "多頭觀察" | "整理" | "弱勢";
export type WatchlistHorsepowerCandidateTag = "主升段" | "逢低候選" | "觀察" | "排除";

export interface WatchlistHorsepowerCandidate {
  symbol: string;
  nameZh: string;
  universeTier: WatchlistUniverseTier;
  themeTags: string[];
  horsepowerScore: number;
  previousHorsepowerScore: number;
  horsepowerChange: number;
  horsepowerLevel: WatchlistHorsepowerLevel;
  firstBullTurn: boolean;
  strongBullConfirm: boolean;
  pullbackSweetSpot: boolean;
  deteriorationAlert: boolean;
  bearTurn: boolean;
  candidateTag: WatchlistHorsepowerCandidateTag;
  candidateRank: number;
  riskNoteZh: string;
  actionLabelZh: string;
}

export interface Watchlist17HorsepowerCandidateMatrixContract {
  matrixVersion: "WATCHLIST_17_HORSEPOWER_CANDIDATE_MATRIX_V1";
  generatedAt: string;
  mode: "FIXTURE_ONLY_NO_NETWORK";
  decision: "OBSERVATION_ONLY_NOT_CONNECTED";
  liveFetchBoundary: {
    approvedProvider: "TWSE_TPEX";
    approvedLiveFetchSymbols: readonly ["3019"];
    approvedChannels: readonly ["tse_3019.tw"];
    defaultRuntimeFetchAllowed: false;
    productionDataSwitchAllowed: false;
  };
  sourceUniverse: {
    coreCount: number;
    extendedCount: number;
    totalCount: number;
  };
  sourceScanner: {
    scannerName: "17 Horsepower";
    totalLines: 17;
    fixtureOnly: true;
  };
  candidates: WatchlistHorsepowerCandidate[];
  summary: {
    mainTrendCount: number;
    pullbackCandidateCount: number;
    watchCount: number;
    excludedCount: number;
  };
  realNetworkUsed: false;
  liveFetchPerformed: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  apiRouteCreated: false;
  portfolioApiSwitched: false;
  brokerApiUsed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionDataSwitched: false;
  productionTradingReady: false;
  safetyLabels: string[];
}

export interface BuildWatchlist17HorsepowerCandidateMatrixInput {
  generatedAt?: string;
}

interface FixtureTechnicalSnapshot {
  symbol: string;
  horsepowerScore: number;
  previousHorsepowerScore: number;
  pullbackSweetSpot: boolean;
  deteriorationAlert: boolean;
  bearTurn: boolean;
}

const DEFAULT_GENERATED_AT = "2026-07-01T00:00:00.000Z";

const FIXTURE_TECHNICAL_SNAPSHOTS: FixtureTechnicalSnapshot[] = [
  { symbol: "3019", horsepowerScore: 17, previousHorsepowerScore: 15, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "4966", horsepowerScore: 14, previousHorsepowerScore: 11, pullbackSweetSpot: true, deteriorationAlert: false, bearTurn: false },
  { symbol: "5347", horsepowerScore: 11, previousHorsepowerScore: 10, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "4979", horsepowerScore: 8, previousHorsepowerScore: 12, pullbackSweetSpot: false, deteriorationAlert: true, bearTurn: true },
  { symbol: "2455", horsepowerScore: 13, previousHorsepowerScore: 13, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "3450", horsepowerScore: 16, previousHorsepowerScore: 14, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "3163", horsepowerScore: 15, previousHorsepowerScore: 12, pullbackSweetSpot: true, deteriorationAlert: false, bearTurn: false },
  { symbol: "6442", horsepowerScore: 14, previousHorsepowerScore: 11, pullbackSweetSpot: true, deteriorationAlert: false, bearTurn: false },
  { symbol: "3363", horsepowerScore: 12, previousHorsepowerScore: 9, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "2383", horsepowerScore: 17, previousHorsepowerScore: 16, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "2368", horsepowerScore: 13, previousHorsepowerScore: 14, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "3491", horsepowerScore: 10, previousHorsepowerScore: 8, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "2313", horsepowerScore: 9, previousHorsepowerScore: 11, pullbackSweetSpot: false, deteriorationAlert: true, bearTurn: true },
  { symbol: "2344", horsepowerScore: 7, previousHorsepowerScore: 9, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: true },
  { symbol: "6239", horsepowerScore: 11, previousHorsepowerScore: 13, pullbackSweetSpot: false, deteriorationAlert: true, bearTurn: false },
  { symbol: "8299", horsepowerScore: 15, previousHorsepowerScore: 10, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: false },
  { symbol: "3105", horsepowerScore: 6, previousHorsepowerScore: 7, pullbackSweetSpot: false, deteriorationAlert: false, bearTurn: true },
];

function snapshotFor(symbol: string): FixtureTechnicalSnapshot {
  const snapshot = FIXTURE_TECHNICAL_SNAPSHOTS.find((item) => item.symbol === symbol);
  if (snapshot == null) {
    return {
      symbol,
      horsepowerScore: 0,
      previousHorsepowerScore: 0,
      pullbackSweetSpot: false,
      deteriorationAlert: true,
      bearTurn: true,
    };
  }
  return snapshot;
}

function levelFor(score: number): WatchlistHorsepowerLevel {
  if (score >= 16) return "主升段";
  if (score >= 13) return "多頭確認";
  if (score >= 10) return "多頭觀察";
  if (score >= 6) return "整理";
  return "弱勢";
}

function tagFor(snapshot: FixtureTechnicalSnapshot): WatchlistHorsepowerCandidateTag {
  if (snapshot.deteriorationAlert || snapshot.bearTurn || snapshot.horsepowerScore <= 9) return "排除";
  if (snapshot.horsepowerScore >= 16) return "主升段";
  if (snapshot.horsepowerScore >= 13 && snapshot.horsepowerScore <= 15 && snapshot.pullbackSweetSpot) return "逢低候選";
  return "觀察";
}

function priorityFor(tag: WatchlistHorsepowerCandidateTag): number {
  if (tag === "主升段") return 1;
  if (tag === "逢低候選") return 2;
  if (tag === "觀察") return 3;
  return 4;
}

function actionLabelFor(tag: WatchlistHorsepowerCandidateTag): string {
  if (tag === "主升段") return "觀察用：強勢候選，等待人工確認";
  if (tag === "逢低候選") return "觀察用：回檔候選，等待支撐確認";
  if (tag === "觀察") return "觀察用：列入追蹤，等待更多證據";
  return "觀察用：暫列排除，等待結構修復";
}

function riskNoteFor(tag: WatchlistHorsepowerCandidateTag): string {
  if (tag === "主升段") return "風險提醒：強勢延續仍需確認量價、支撐與資料品質。";
  if (tag === "逢低候選") return "風險提醒：回檔型態仍需確認支撐、量縮與停損邊界。";
  if (tag === "觀察") return "風險提醒：結構尚未完整，只能列為研究追蹤。";
  return "風險提醒：結構偏弱或轉壞，暫不納入主要候選。";
}

function toCandidate(stock: WatchlistUniverseStock): WatchlistHorsepowerCandidate {
  const snapshot = snapshotFor(stock.symbol);
  const horsepowerChange = snapshot.horsepowerScore - snapshot.previousHorsepowerScore;
  const firstBullTurn = snapshot.previousHorsepowerScore <= 12 && snapshot.horsepowerScore >= 13;
  const strongBullConfirm = snapshot.horsepowerScore >= 16;
  const candidateTag = tagFor(snapshot);

  return {
    symbol: stock.symbol,
    nameZh: stock.nameZh,
    universeTier: stock.universeTier,
    themeTags: [...stock.themeTags],
    horsepowerScore: snapshot.horsepowerScore,
    previousHorsepowerScore: snapshot.previousHorsepowerScore,
    horsepowerChange,
    horsepowerLevel: levelFor(snapshot.horsepowerScore),
    firstBullTurn,
    strongBullConfirm,
    pullbackSweetSpot: snapshot.pullbackSweetSpot,
    deteriorationAlert: snapshot.deteriorationAlert,
    bearTurn: snapshot.bearTurn,
    candidateTag,
    candidateRank: 0,
    riskNoteZh: riskNoteFor(candidateTag),
    actionLabelZh: actionLabelFor(candidateTag),
  };
}

function sortCandidates(a: WatchlistHorsepowerCandidate, b: WatchlistHorsepowerCandidate): number {
  const priorityDiff = priorityFor(a.candidateTag) - priorityFor(b.candidateTag);
  if (priorityDiff !== 0) return priorityDiff;
  if (b.horsepowerScore !== a.horsepowerScore) return b.horsepowerScore - a.horsepowerScore;
  if (b.horsepowerChange !== a.horsepowerChange) return b.horsepowerChange - a.horsepowerChange;
  if (Number(b.pullbackSweetSpot) !== Number(a.pullbackSweetSpot)) {
    return Number(b.pullbackSweetSpot) - Number(a.pullbackSweetSpot);
  }
  return a.symbol.localeCompare(b.symbol);
}

export function buildWatchlist17HorsepowerCandidateMatrixContract(
  input: BuildWatchlist17HorsepowerCandidateMatrixInput = {},
): Watchlist17HorsepowerCandidateMatrixContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const universe = buildWatchlistUniverseTierContract({ generatedAt });
  const scanner = build17HorsepowerScannerContract({ generatedAt });
  const sourceStocks = [...universe.coreUniverse, ...universe.extendedUniverse];

  const candidates = sourceStocks
    .map(toCandidate)
    .sort(sortCandidates)
    .map((candidate, index) => ({
      ...candidate,
      candidateRank: index + 1,
    }));

  return {
    matrixVersion: "WATCHLIST_17_HORSEPOWER_CANDIDATE_MATRIX_V1",
    generatedAt,
    mode: "FIXTURE_ONLY_NO_NETWORK",
    decision: "OBSERVATION_ONLY_NOT_CONNECTED",
    liveFetchBoundary: {
      approvedProvider: universe.liveFetchBoundary.approvedProvider,
      approvedLiveFetchSymbols: universe.liveFetchBoundary.approvedLiveFetchSymbols,
      approvedChannels: universe.liveFetchBoundary.approvedChannels,
      defaultRuntimeFetchAllowed: universe.liveFetchBoundary.defaultRuntimeFetchAllowed,
      productionDataSwitchAllowed: universe.liveFetchBoundary.productionDataSwitchAllowed,
    },
    sourceUniverse: {
      coreCount: universe.coreUniverse.length,
      extendedCount: universe.extendedUniverse.length,
      totalCount: sourceStocks.length,
    },
    sourceScanner: {
      scannerName: "17 Horsepower",
      totalLines: scanner.totalLines,
      fixtureOnly: true,
    },
    candidates,
    summary: {
      mainTrendCount: candidates.filter((c) => c.candidateTag === "主升段").length,
      pullbackCandidateCount: candidates.filter((c) => c.candidateTag === "逢低候選").length,
      watchCount: candidates.filter((c) => c.candidateTag === "觀察").length,
      excludedCount: candidates.filter((c) => c.candidateTag === "排除").length,
    },
    realNetworkUsed: false,
    liveFetchPerformed: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    apiRouteCreated: false,
    portfolioApiSwitched: false,
    brokerApiUsed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionDataSwitched: false,
    productionTradingReady: false,
    safetyLabels: [
      "Watchlist 17 Horsepower Candidate Matrix",
      "fixture-only observation matrix",
      "candidates are observation-only",
      "ranking is not buy/sell instruction",
      "approved live-fetch symbols remain 3019 only",
      "no runtime fetch / no production data switch",
      "no broker API / no order command / no auto order",
    ],
  };
}
