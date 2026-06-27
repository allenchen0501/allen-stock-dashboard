/**
 * Allen War Room Operational Layout Contract Builder — V60
 *
 * Pure builder. Returns a deterministic operational layout bundle for the Allen
 * War Room (`/holdings`). The data layer is still fixture/mock safe mode: every
 * row is labeled, no real quotes are connected, and PnL is NEVER computed for
 * positions without known shares + average cost.
 *
 * Known user-confirmed but INCOMPLETE actual positions (4966 譜瑞, 2743 山富):
 * Allen has said he entered, but shares/cost are not in the repo, so they are
 * shown as "持股資料待補" with pnlComputable = false — no fabricated PnL / size.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; no buy/sell commands; no auto orders
 */

import {
  ALLEN_WAR_ROOM_SAFETY_LABELS,
} from "./allen-war-room-data-taxonomy-contract";
import type {
  AllenWarRoomOperationalLayoutBundle,
  WarRoomActualPosition,
  WarRoomRiskBlocklistItem,
  WarRoomSessionStructure,
  WarRoomSummaryCard,
  WarRoomSystemCandidate,
  WarRoomWatchlistItem,
} from "./allen-war-room-data-taxonomy-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const FX = "fixture／mock：目前非真實資料，不可作為操作依據";

export interface BuildAllenWarRoomOperationalLayoutContractInput {
  generatedAt?: string;
}

/** Incomplete actual position: entered but shares/cost unknown → no PnL. */
function incompletePosition(stockId: string, symbol: string, name: string, entrySource: string): WarRoomActualPosition {
  return {
    stockId,
    symbol,
    name,
    category: "ACTUAL_POSITION",
    positionStatus: "data_incomplete",
    positionSource: "user_confirmed",
    sharesKnown: false,
    shares: null,
    averageCostKnown: false,
    averageCost: null,
    entrySource,
    latestPriceValid: false,
    latestPrice: null,
    pnlComputable: false,
    marketValue: null,
    unrealizedPnl: null,
    unrealizedPnlPct: null,
    defenseLine: null,
    stopLossZone: null,
    addOnZone: null,
    targetZone: null,
    riskReward: null,
    todayAction: "DATA_INSUFFICIENT",
    dataVerificationStatus: "INSUFFICIENT_DATA",
    dataNote: "持股資料待補：真實報價未接入，不可計算損益（等待 broker / user input / Supabase staging data）。",
  };
}

function watchlistItem(
  stockId: string,
  symbol: string,
  name: string,
  trend: string,
  technicalStatus: string,
  keySupport: string,
  keyResistance: string,
  accumulationZone: string,
  watchCondition: string,
  todayStatus: string,
  nearEntry: boolean,
): WarRoomWatchlistItem {
  return {
    stockId,
    symbol,
    name,
    category: "FIXED_WATCHLIST",
    isPosition: false,
    latestPriceValid: false,
    latestPrice: null,
    trend,
    technicalStatus,
    keySupport,
    keyResistance,
    accumulationZone,
    watchCondition,
    todayStatus,
    nearEntry,
    dataVerificationStatus: "FIXTURE_ONLY",
    dataNote: `追蹤股不等於持股；${FX}`,
  };
}

function candidate(
  stockId: string,
  symbol: string,
  name: string,
  candidateReason: string,
  technicalCondition: string,
  riskRewardStatus: string,
  lowEntryZone: string,
  confirmCondition: string,
  invalidationCondition: string,
  todayAction: WarRoomSystemCandidate["todayAction"],
): WarRoomSystemCandidate {
  return {
    stockId,
    symbol,
    name,
    category: "SYSTEM_CANDIDATE",
    isPosition: false,
    candidateReason,
    technicalCondition,
    riskRewardStatus,
    lowEntryZone,
    confirmCondition,
    invalidationCondition,
    todayAction,
    dataVerificationStatus: "FIXTURE_ONLY",
    dataNote: `系統候選股不等於持股；${FX}`,
  };
}

/**
 * Builds a deterministic Allen War Room operational layout bundle. All timestamps
 * come from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildAllenWarRoomOperationalLayoutContract(
  input: BuildAllenWarRoomOperationalLayoutContractInput = {},
): AllenWarRoomOperationalLayoutBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const actualPositions: WarRoomActualPosition[] = [
    incompletePosition("4966", "4966", "譜瑞-KY", "user_confirmed：已表示已進場零股"),
    incompletePosition("2743", "2743", "山富", "user_confirmed：表示庫存新增"),
  ];

  const fixedWatchlist: WarRoomWatchlistItem[] = [
    watchlistItem("3019", "3019", "亞光", "整理待轉強", "均線糾結", "前低支撐區", "前高壓力區", "回測月線承接區", "站回關鍵均線並帶量", "等待轉強", false),
    watchlistItem("4966", "4966", "譜瑞-KY", "中期偏多整理", "高檔盤整", "季線支撐區", "前高壓力區", "回測季線承接區", "回測不破季線", "觀察回測", true),
    watchlistItem("5347", "5347", "世界", "趨勢偏多", "多頭排列", "短均支撐區", "前高壓力區", "回測短均承接區", "量價同步轉強", "偏多觀察", true),
    watchlistItem("4979", "4979", "華星光", "波動偏大", "區間震盪", "區間下緣", "區間上緣", "區間下緣承接區", "突破區間上緣", "區間觀察", false),
    watchlistItem("2455", "2455", "全新", "中期偏多", "回測整理", "季線支撐區", "前高壓力區", "回測季線承接區", "守住季線轉強", "等待回測", false),
  ];

  const systemCandidates: WarRoomSystemCandidate[] = [
    candidate("0000", "0000", "候選 sample A", "技術面轉多／KDJ 低檔翻揚", "MACD 翻紅、站回關鍵均線", "風報比佳", "回測承接區（fixture）", "帶量站穩關鍵均線", "跌破承接區即失效", "WATCH_PULLBACK"),
    candidate("0001", "0001", "候選 sample B", "主升段型態／法人低檔建倉", "量價結構轉強", "可逢低布局", "回測月線承接區（fixture）", "回測不破月線並轉強", "量能背離即失效", "ADD_ON_CONFIRMATION"),
    candidate("0002", "0002", "候選 sample C", "走多風報比佳", "回測承接區明確", "風報比佳", "支撐帶（fixture）", "確認低檔不破", "跌破支撐帶即失效", "WAIT"),
  ];

  const riskBlocklist: WarRoomRiskBlocklistItem[] = [
    {
      stockId: "9999",
      symbol: "9999",
      name: "禁碰 sample X",
      category: "RISK_BLOCKLIST",
      isPosition: false,
      reason: "破線／量能失控／追高風險（fixture）",
      dataVerificationStatus: "FIXTURE_ONLY",
      dataNote: FX,
    },
    {
      stockId: "9998",
      symbol: "9998",
      name: "禁碰 sample Y",
      category: "RISK_BLOCKLIST",
      isPosition: false,
      reason: "資料延遲／來源衝突／風報比不足（fixture）",
      dataVerificationStatus: "CONFLICT",
      dataNote: FX,
    },
  ];

  const summaryCards: WarRoomSummaryCard[] = [
    { cardId: "market-direction", title: "今日市場方向", value: "資料不足", tone: "insufficient", note: `${FX}` },
    { cardId: "position-risk", title: "實際持股風險", value: "資料不足", tone: "insufficient", note: "持股資料待補，無法評估防守線。" },
    { cardId: "today-operable", title: "今日可操作", value: "觀望", tone: "neutral", note: "真實報價未接入，僅供結構預覽。" },
    { cardId: "system-alert", title: "系統警報", value: "資料延遲", tone: "risk", note: "fixture／mock 來源，非即時警報。" },
  ];

  const sessionStructures: WarRoomSessionStructure[] = [
    {
      session: "PRE_MARKET",
      title: "盤前模式",
      sections: [
        { sectionId: "pre-prevclose", title: "昨日收盤有效價", items: ["昨日收盤有效價（fixture，未驗證）"] },
        { sectionId: "pre-openrisk", title: "今日開盤風險", items: ["跳空風險", "國際盤風險提示（fixture）"] },
        { sectionId: "pre-defense", title: "預設防守策略", items: ["防守線待真實成本接入後計算"] },
        { sectionId: "pre-lowbuy", title: "可低接觀察股", items: ["僅顯示追蹤／候選結構，不等於持股"] },
        { sectionId: "pre-avoid", title: "禁追 / 禁碰股", items: ["參見禁碰股清單（fixture）"] },
      ],
    },
    {
      session: "INTRADAY",
      title: "盤中模式",
      sections: [
        { sectionId: "intra-price", title: "即時價 / 開高低 / 成交量", items: ["真實即時價未接入（fixture）"] },
        { sectionId: "intra-drop", title: "是否急跌 / 破防守線", items: ["待真實報價與成本接入"] },
        { sectionId: "intra-accum", title: "是否接近承接區", items: ["追蹤／候選承接區（fixture）"] },
        { sectionId: "intra-alert", title: "即時警報 / 資料延遲", items: ["目前為 fixture／mock，非即時警報"] },
      ],
    },
    {
      session: "AFTER_CLOSE",
      title: "收盤後模式",
      sections: [
        { sectionId: "post-close", title: "收盤價 / 漲跌幅 / 成交量", items: ["收盤有效價未接入（fixture）"] },
        { sectionId: "post-kbar", title: "K 線狀態", items: ["K 線結構（fixture）"] },
        { sectionId: "post-next", title: "隔日策略", items: ["續抱 / 減碼 / 等回測（待真實資料）"] },
        { sectionId: "post-watch", title: "隔日觀察清單", items: ["追蹤／候選清單（不等於持股）"] },
      ],
    },
  ];

  return {
    contractVersion: "V60",
    layoutName: "Allen War Room Operational Layout",
    page: "/holdings",
    primaryUserRole: "owner_operator",
    generatedAt,
    decision: "READY_FOR_UI_REVIEW",

    marketSession: "DATA_UNAVAILABLE",
    dataVerification: {
      dataDate: "fixture",
      dataTime: "fixture",
      dataSource: "fixture / mock_or_contract",
      verificationStatus: "FIXTURE_ONLY",
      isFixtureOrMock: true,
      notOperationalDataWarning: "目前非真實資料，不可作為操作依據",
    },
    summaryCards,
    actualPositions,
    fixedWatchlist,
    systemCandidates,
    riskBlocklist,
    sessionStructures,

    userIsDeveloper: false,
    actualPositionsDefinitionLocked: true,
    watchlistDefinitionLocked: true,
    systemCandidatesDefinitionLocked: true,
    actualPositionRequiresEntryRecord: true,
    actualPositionRequiresSharesAndCostForPnl: true,
    watchlistIsNotPosition: true,
    systemCandidateIsNotPosition: true,
    mockDataMustBeLabeled: true,
    fixtureDataMustBeLabeled: true,
    operationalLayoutDefined: true,
    engineeringSafetyMovedAwayFromPrimaryView: true,
    productionTradingReady: false,

    realDataConnected: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,

    safetyLabels: [...ALLEN_WAR_ROOM_SAFETY_LABELS],
  };
}
