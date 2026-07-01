/**
 * Watchlist Universe Tier Contract - fixture-only, deterministic metadata.
 *
 * This contract declares core and extended watchlist universe metadata for future
 * scanners. It is not a runtime and it does not approve any new live-fetch symbol.
 */

export type WatchlistMarketType = "listed" | "otc" | "unknown";
export type WatchlistUniverseTier = "core" | "extended";
export type WatchlistTrackingRole = "holding" | "watchlist" | "candidate" | "theme_watch" | "unknown";
export type WatchlistChannelStatus = "approved" | "not_approved" | "unresolved";

export interface WatchlistUniverseStock {
  symbol: string;
  nameZh: string;
  marketType: WatchlistMarketType;
  universeTier: WatchlistUniverseTier;
  trackingRole: WatchlistTrackingRole;
  themeTags: string[];
  scannerEligible: boolean;
  liveFetchApproved: boolean;
  approvedChannel: string | null;
  channelStatus: WatchlistChannelStatus;
  noteZh: string;
}

export interface WatchlistUniverseTierContract {
  universeVersion: "WATCHLIST_UNIVERSE_TIER_V1";
  generatedAt: string;
  mode: "FIXTURE_ONLY_NO_NETWORK";
  decision: "SPEC_ONLY_NOT_CONNECTED";
  liveFetchBoundary: {
    approvedProvider: "TWSE_TPEX";
    approvedLiveFetchSymbols: readonly ["3019"];
    approvedChannels: readonly ["tse_3019.tw"];
    defaultRuntimeFetchAllowed: false;
    productionDataSwitchAllowed: false;
    newLiveFetchSymbolAllowed: false;
    universeMetadataIsLiveFetchApproval: false;
  };
  coreUniverse: WatchlistUniverseStock[];
  extendedUniverse: WatchlistUniverseStock[];
  scannerUniversePlan: {
    enabledNow: false;
    fullMarketScanEnabled: false;
    descriptionZh: string;
    futureStages: string[];
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

export interface BuildWatchlistUniverseTierContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-07-01T00:00:00.000Z";

function stock(input: WatchlistUniverseStock): WatchlistUniverseStock {
  return input;
}

const CORE_UNIVERSE: WatchlistUniverseStock[] = [
  stock({
    symbol: "3019",
    nameZh: "亞光",
    marketType: "listed",
    universeTier: "core",
    trackingRole: "holding",
    themeTags: ["光學", "核心持股", "官方通道已核准"],
    scannerEligible: true,
    liveFetchApproved: true,
    approvedChannel: "tse_3019.tw",
    channelStatus: "approved",
    noteZh: "目前唯一核准 live fetch 的核心標的；通道固定為 tse_3019.tw。",
  }),
  stock({
    symbol: "4966",
    nameZh: "譜瑞-KY",
    marketType: "listed",
    universeTier: "core",
    trackingRole: "holding",
    themeTags: ["高速傳輸", "IC設計", "核心追蹤"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "核心 universe metadata；尚未核准 live fetch，僅供 fixture-only 研究使用。",
  }),
  stock({
    symbol: "5347",
    nameZh: "世界",
    marketType: "otc",
    universeTier: "core",
    trackingRole: "holding",
    themeTags: ["晶圓代工", "半導體", "核心追蹤"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "核心 universe metadata；尚未核准 live fetch，僅供 scanner fixture 參考。",
  }),
  stock({
    symbol: "4979",
    nameZh: "華星光",
    marketType: "otc",
    universeTier: "core",
    trackingRole: "holding",
    themeTags: ["光通訊", "矽光子", "核心追蹤"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "核心 universe metadata；不代表已開放 runtime fetch 或 production data switch。",
  }),
  stock({
    symbol: "2455",
    nameZh: "全新",
    marketType: "listed",
    universeTier: "core",
    trackingRole: "holding",
    themeTags: ["砷化鎵", "射頻", "核心追蹤"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "核心 universe metadata；目前仍維持非 live fetch 狀態。",
  }),
];

const EXTENDED_UNIVERSE: WatchlistUniverseStock[] = [
  stock({
    symbol: "3450",
    nameZh: "聯鈞",
    marketType: "listed",
    universeTier: "extended",
    trackingRole: "watchlist",
    themeTags: ["光通訊", "資料中心"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；不代表 live fetch approval。",
  }),
  stock({
    symbol: "3163",
    nameZh: "波若威",
    marketType: "otc",
    universeTier: "extended",
    trackingRole: "watchlist",
    themeTags: ["光通訊", "網通"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；僅供 fixture-only scanner 使用。",
  }),
  stock({
    symbol: "6442",
    nameZh: "光聖",
    marketType: "listed",
    universeTier: "extended",
    trackingRole: "watchlist",
    themeTags: ["光通訊", "矽光子"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；未核准 runtime fetch。",
  }),
  stock({
    symbol: "3363",
    nameZh: "上詮",
    marketType: "otc",
    universeTier: "extended",
    trackingRole: "watchlist",
    themeTags: ["光通訊", "連接器"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；通道尚未核准。",
  }),
  stock({
    symbol: "2383",
    nameZh: "台光電",
    marketType: "listed",
    universeTier: "extended",
    trackingRole: "theme_watch",
    themeTags: ["CCL", "AI伺服器", "PCB"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；供題材追蹤與 scanner fixture 使用。",
  }),
  stock({
    symbol: "2368",
    nameZh: "金像電",
    marketType: "listed",
    universeTier: "extended",
    trackingRole: "theme_watch",
    themeTags: ["PCB", "AI伺服器"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；不代表可即時抓價。",
  }),
  stock({
    symbol: "3491",
    nameZh: "昇達科",
    marketType: "otc",
    universeTier: "extended",
    trackingRole: "candidate",
    themeTags: ["衛星通訊", "微波通訊"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸候選 metadata；未核准 live fetch。",
  }),
  stock({
    symbol: "2313",
    nameZh: "華通",
    marketType: "listed",
    universeTier: "extended",
    trackingRole: "theme_watch",
    themeTags: ["PCB", "電子零組件"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；僅供研究分層。",
  }),
  stock({
    symbol: "2344",
    nameZh: "華邦電",
    marketType: "listed",
    universeTier: "extended",
    trackingRole: "candidate",
    themeTags: ["記憶體", "半導體"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸候選 metadata；不代表 production data switch。",
  }),
  stock({
    symbol: "6239",
    nameZh: "力成",
    marketType: "listed",
    universeTier: "extended",
    trackingRole: "theme_watch",
    themeTags: ["封測", "半導體"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；維持 fixture-only。",
  }),
  stock({
    symbol: "8299",
    nameZh: "群聯",
    marketType: "otc",
    universeTier: "extended",
    trackingRole: "candidate",
    themeTags: ["NAND控制晶片", "儲存"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸候選 metadata；尚未核准官方通道。",
  }),
  stock({
    symbol: "3105",
    nameZh: "穩懋",
    marketType: "otc",
    universeTier: "extended",
    trackingRole: "theme_watch",
    themeTags: ["砷化鎵", "射頻"],
    scannerEligible: true,
    liveFetchApproved: false,
    approvedChannel: null,
    channelStatus: "not_approved",
    noteZh: "延伸觀察名單 metadata；不新增 live fetch symbol。",
  }),
];

export function buildWatchlistUniverseTierContract(
  input: BuildWatchlistUniverseTierContractInput = {},
): WatchlistUniverseTierContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  return {
    universeVersion: "WATCHLIST_UNIVERSE_TIER_V1",
    generatedAt,
    mode: "FIXTURE_ONLY_NO_NETWORK",
    decision: "SPEC_ONLY_NOT_CONNECTED",
    liveFetchBoundary: {
      approvedProvider: "TWSE_TPEX",
      approvedLiveFetchSymbols: ["3019"],
      approvedChannels: ["tse_3019.tw"],
      defaultRuntimeFetchAllowed: false,
      productionDataSwitchAllowed: false,
      newLiveFetchSymbolAllowed: false,
      universeMetadataIsLiveFetchApproval: false,
    },
    coreUniverse: CORE_UNIVERSE,
    extendedUniverse: EXTENDED_UNIVERSE,
    scannerUniversePlan: {
      enabledNow: false,
      fullMarketScanEnabled: false,
      descriptionZh: "目前只建立 core / extended universe metadata；未來可供 17 Horsepower、柯三弟、走多回檔甜蜜點與候選排序研究使用。",
      futureStages: [
        "core + extended watchlist scanner",
        "industry theme scanner",
        "full-market scanner after explicit owner approval",
        "17 Horsepower scanner",
        "柯三弟 scanner",
        "走多回檔甜蜜點 scanner",
        "candidate ranking",
        "risk/reward reference",
        "manual user decision",
      ],
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
      "Watchlist Universe Tier",
      "fixture-only stock metadata",
      "approved live-fetch symbols remain 3019 only",
      "universe metadata is not live fetch approval",
      "no runtime fetch / no production data switch",
      "no broker API / no buy-sell command / no auto order",
      "user-visible UI must remain Traditional Chinese",
    ],
  };
}
