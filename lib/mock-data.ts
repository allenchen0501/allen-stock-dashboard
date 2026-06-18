import type {
  AvoidStock,
  BreakoutCandidate,
  Holding,
  MarketIndex,
  RiskRewardItem,
} from "@/types/market";

export const marketIndices: MarketIndex[] = [
  { name: "加權指數", value: "22,504.72", change: 0.84, trend: "up" },
  { name: "櫃買指數", value: "267.41", change: 1.12, trend: "up" },
  { name: "NASDAQ", value: "19,630.20", change: -0.16, trend: "down" },
  { name: "SOX", value: "5,237.08", change: 0.63, trend: "up" },
  { name: "台指期", value: "22,538", change: 0.91, trend: "up" },
];

export const holdings: Holding[] = [
  { symbol: "2330", name: "台積電", price: 1045, change: 1.46, pnl: 18.7, weight: 28, score: 92, signal: "續抱", spark: [35, 38, 37, 43, 44, 48, 47, 54, 58, 61, 66] },
  { symbol: "2454", name: "聯發科", price: 1485, change: 2.06, pnl: 12.4, weight: 18, score: 88, signal: "加碼", spark: [30, 34, 38, 36, 43, 41, 48, 52, 51, 57, 62] },
  { symbol: "2382", name: "廣達", price: 302.5, change: -0.82, pnl: 8.1, weight: 15, score: 79, signal: "續抱", spark: [44, 47, 43, 48, 50, 46, 49, 48, 53, 51, 50] },
  { symbol: "3661", name: "世芯-KY", price: 3270, change: 3.15, pnl: 21.6, weight: 12, score: 91, signal: "續抱", spark: [28, 31, 34, 39, 36, 43, 48, 52, 56, 62, 68] },
  { symbol: "3017", name: "奇鋐", price: 728, change: -1.09, pnl: -2.3, weight: 9, score: 68, signal: "減碼", spark: [58, 56, 60, 55, 52, 54, 49, 51, 47, 45, 43] },
];

export const riskRewards: RiskRewardItem[] = [
  { rank: 1, symbol: "3231", name: "緯創", entry: 121.5, target: 148, stop: 115, ratio: 4.08, score: 89 },
  { rank: 2, symbol: "2345", name: "智邦", entry: 742, target: 835, stop: 716, ratio: 3.58, score: 87 },
  { rank: 3, symbol: "1519", name: "華城", entry: 635, target: 710, stop: 613, ratio: 3.41, score: 84 },
  { rank: 4, symbol: "3443", name: "創意", entry: 1180, target: 1325, stop: 1136, ratio: 3.3, score: 82 },
  { rank: 5, symbol: "6274", name: "台燿", entry: 174.5, target: 193, stop: 168.5, ratio: 3.08, score: 80 },
];

export const breakoutCandidates: BreakoutCandidate[] = [
  { symbol: "2376", name: "技嘉", price: 286.5, change: 4.18, stage: "突破盤整", score: 93, volume: 2.8, spark: [36, 38, 37, 39, 42, 41, 45, 49, 55, 64, 72] },
  { symbol: "3037", name: "欣興", price: 164.5, change: 3.46, stage: "量價齊揚", score: 90, volume: 3.2, spark: [31, 34, 36, 35, 39, 44, 48, 47, 56, 61, 68] },
  { symbol: "6669", name: "緯穎", price: 2310, change: 2.9, stage: "沿五日線", score: 88, volume: 1.7, spark: [38, 41, 39, 45, 47, 51, 54, 53, 59, 63, 66] },
  { symbol: "3653", name: "健策", price: 1395, change: 5.28, stage: "創高攻擊", score: 95, volume: 2.4, spark: [29, 32, 35, 39, 43, 41, 49, 54, 61, 68, 76] },
];

export const avoidStocks: AvoidStock[] = [
  { rank: 1, symbol: "2409", name: "友達", reason: "跌破季線・外資連賣", risk: "極高", change: -3.82 },
  { rank: 2, symbol: "2603", name: "長榮", reason: "籌碼鬆動・爆量長黑", risk: "極高", change: -4.16 },
  { rank: 3, symbol: "2615", name: "萬海", reason: "MACD 死叉・破月線", risk: "高", change: -2.94 },
  { rank: 4, symbol: "2884", name: "玉山金", reason: "漲多背離・動能轉弱", risk: "高", change: -1.47 },
  { rank: 5, symbol: "2002", name: "中鋼", reason: "產業逆風・空頭排列", risk: "高", change: -1.16 },
];

export const marketSpark = [31, 34, 32, 37, 39, 38, 45, 43, 48, 52, 50, 57, 59, 64, 62, 68, 72];
