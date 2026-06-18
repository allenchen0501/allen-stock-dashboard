export type Trend = "up" | "down" | "flat";
export type Signal = "bull" | "neutral" | "bear";

export interface MarketIndex {
  name: string;
  value: string;
  change: number;
  trend: Trend;
}

export interface Holding {
  symbol: string;
  name: string;
  price: number;
  change: number;
  pnl: number;
  weight: number;
  score: number;
  signal: "續抱" | "加碼" | "減碼";
  spark: number[];
}

export interface RiskRewardItem {
  rank: number;
  symbol: string;
  name: string;
  entry: number;
  target: number;
  stop: number;
  ratio: number;
  score: number;
}

export interface BreakoutCandidate {
  symbol: string;
  name: string;
  price: number;
  change: number;
  stage: string;
  score: number;
  volume: number;
  spark: number[];
}

export interface AvoidStock {
  rank: number;
  symbol: string;
  name: string;
  reason: string;
  risk: "極高" | "高";
  change: number;
}
