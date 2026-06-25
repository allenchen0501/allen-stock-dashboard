"use client";

import { useEffect, useState } from "react";
import type {
  HoldingDefenseTrackerItem,
  HoldingDefenseTrackerResponse,
} from "@/use-cases/holding-defense/holding-defense-tracker-contract";

// ---------------------------------------------------------------------------
// Holding Defense Tracker — V29 UI Integration
//
// Reads ONLY the internal /api/portfolio/holding-defense contract endpoint
// (V27 fixture-only API). Does NOT import the builder, does NOT import the
// route, does NOT fetch any external URL, does NOT connect to Supabase, does
// NOT read env keys, and does NOT produce buy/sell commands. The payload is a
// fixture-only read model: this UI never upgrades dataQualityStatus and never
// emits precise prices when priceVerified is false.
// ---------------------------------------------------------------------------

type Zone = HoldingDefenseTrackerItem["defenseZone"];

const STATE_LABEL: Record<string, string> = {
  NORMAL_OBSERVATION: "正常觀察",
  DEFENSE_ZONE_NEAR: "接近防守區",
  DEFENSE_ZONE_BROKEN: "防守區破壞觀察",
  PROFIT_PROTECTION_ACTIVE: "獲利保護觀察",
  RISK_REDUCTION_ACTIVE: "風險降低觀察",
  DATA_INSUFFICIENT: "資料不足",
  PRICE_NOT_VERIFIED: "價格未驗證",
  SOURCE_CONFLICT: "來源衝突",
  STALE_DATA: "資料過舊",
};

function alertTone(level: string): string {
  switch (level) {
    case "INFO":
      return "text-slate-400 bg-slate-700/30 border-slate-700";
    case "WATCH":
      return "text-sky-400 bg-sky-400/10 border-sky-400/20";
    case "WARNING":
      return "text-amber bg-amber/10 border-amber/20";
    case "DANGER":
      return "text-negative bg-negative/10 border-negative/20";
    default:
      return "text-slate-500 bg-white/[0.03] border-line";
  }
}

function qualityTone(status: string): string {
  switch (status) {
    case "PASS":
      return "text-positive bg-positive/10 border-positive/20";
    case "WARNING":
      return "text-amber bg-amber/10 border-amber/20";
    case "FAIL":
    case "DANGER":
      return "text-negative bg-negative/10 border-negative/20";
    default:
      return "text-slate-400 bg-slate-700/30 border-slate-600";
  }
}

function Badge({ value, tone }: { value: string; tone: string }) {
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${tone}`}>
      {value}
    </span>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-white/[0.015] px-3 py-2">
      <span className="text-[8px] uppercase tracking-[0.15em] text-slate-600">{label}</span>
      <span className={`break-all font-mono text-[10px] font-semibold ${tone ?? "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

// One labelled price zone. When the zone is null or precise price is not
// allowed, shows the safe placeholder instead of a price.
function ZoneLine({ label, zone }: { label: string; zone: Zone }) {
  const showPrice = zone != null && zone.isPrecisePriceAllowed && zone.low != null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-line/40 py-1 last:border-0">
      <div className="flex items-center justify-between gap-2 text-[9px]">
        <span className="text-slate-600">{label}</span>
        <span className="font-mono text-slate-400">
          {showPrice
            ? `${zone!.low}${zone!.high != null && zone!.high !== zone!.low ? `–${zone!.high}` : ""}`
            : "資料不足 / 未允許精準價位"}
        </span>
      </div>
      {zone != null && (
        <div className="flex flex-wrap gap-2 font-mono text-[8px] text-slate-600">
          <span>priceVerified={String(zone.priceVerified)}</span>
          <span>{zone.priceVerificationStatus}</span>
          {zone.priceSource && <span>src：{zone.priceSource}</span>}
          {zone.priceCheckedAt && <span>checkedAt：{zone.priceCheckedAt.slice(0, 19)}</span>}
          {zone.safetyLabel && <span className="text-amber">{zone.safetyLabel}</span>}
        </div>
      )}
    </div>
  );
}

function TrackerCard({ item }: { item: HoldingDefenseTrackerItem }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-white/[0.012] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">{item.stockId}</span>
            <span className="text-[12px] font-semibold text-slate-100">{item.stockName}</span>
          </div>
          <p className="mt-0.5 font-mono text-[8px] text-slate-600">{item.trackerId}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-300">
            {STATE_LABEL[item.trackerState] ?? item.trackerState}
            <span className="ml-1 font-mono text-[8px] text-slate-600">{item.trackerState}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge value={item.alertLevel} tone={alertTone(item.alertLevel)} />
          <Badge value={item.dataQualityStatus} tone={qualityTone(item.dataQualityStatus)} />
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] ${
              item.priceVerified ? "bg-positive/10 text-positive" : "bg-amber/10 text-amber"
            }`}
          >
            {item.priceVerificationStatus}
          </span>
        </div>
      </div>

      {/* Holding context */}
      <div className="flex flex-wrap gap-2 text-[9px] text-slate-500">
        <span>holdingState：{item.holdingState}</span>
        {item.holdingActionState && <span className="text-amber">{item.holdingActionState}</span>}
        <span>成本 costBasis：{item.costBasis ?? "資料不足"}</span>
        <span>現價 currentPrice：{item.currentPrice ?? "資料不足"}</span>
        <span>
          未實現損益：
          {item.unrealizedProfitLoss ?? "資料不足"}（
          {item.unrealizedProfitLossPercent != null
            ? `${item.unrealizedProfitLossPercent}%`
            : "資料不足"}
          ）
        </span>
        <span>峰值：{item.peakUnrealizedProfitLossPercent ?? "資料不足"}%</span>
        <span>回落：{item.drawdownFromPeakPercent ?? "資料不足"}%</span>
      </div>

      {item.holdingImpact && (
        <p className="text-[9px] leading-5 text-slate-400">holdingImpact：{item.holdingImpact}</p>
      )}

      {/* Price zones — labels encode the negation/safety meaning */}
      <div className="rounded-lg border border-line/60 bg-white/[0.008] p-2">
        <ZoneLine label="防守區，是防守觀察不是自動出場" zone={item.defenseZone} />
        <ZoneLine label="策略失效觀察價，不是自動停損價" zone={item.invalidLevel} />
        <ZoneLine label="獲利保護觀察區，不是賣出價" zone={item.profitProtectionZone} />
        <ZoneLine label="takeProfitZone 不是賣出價" zone={item.takeProfitZone} />
        <ZoneLine label="風險降低觀察區，不是賣出指令" zone={item.riskReduceZone} />
        <ZoneLine label="出場觀察區，不是賣出價" zone={item.exitObservationZone} />
      </div>

      {/* Trend / break context */}
      {item.trendBreakWarning && (
        <p className="text-[9px] leading-5 text-amber">⚠ trendBreakWarning：{item.trendBreakWarning}</p>
      )}
      {item.shortAttackRisk && (
        <p className="text-[9px] leading-5 text-slate-500">shortAttackRisk：{item.shortAttackRisk}</p>
      )}
      <div className="flex flex-wrap gap-2 text-[8px] text-slate-600">
        {item.supportBreakStatus && <span>support：{item.supportBreakStatus}</span>}
        {item.maBreakStatus && <span>ma：{item.maBreakStatus}</span>}
        {item.volumeBreakdownStatus && <span>volume：{item.volumeBreakdownStatus}</span>}
      </div>
      {item.riskReduceObservation && (
        <p className="text-[9px] leading-5 text-slate-500">{item.riskReduceObservation}</p>
      )}
      {item.waitForReclaimCondition && (
        <p className="text-[9px] leading-5 text-slate-500">等待：{item.waitForReclaimCondition}</p>
      )}
      {item.nextObservation && (
        <p className="text-[9px] leading-5 text-slate-400">下一步觀察：{item.nextObservation}</p>
      )}

      {item.missingDataFields.length > 0 && (
        <p className="text-[8px] text-slate-600">缺漏欄位：{item.missingDataFields.join("、")}</p>
      )}
      {item.requiredVerification.length > 0 && (
        <p className="text-[8px] text-slate-600">需驗證：{item.requiredVerification.join("、")}</p>
      )}
      {item.warnings.length > 0 && (
        <ul className="space-y-0.5 text-[8px] text-amber">
          {item.warnings.map((w, i) => (
            <li key={i}>· {w}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1">
        {item.notExitSignal && (
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">notExitSignal</span>
        )}
        {item.notTradeAdvice && (
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">notTradeAdvice</span>
        )}
        <span className="rounded bg-white/[0.02] px-1.5 py-0.5 text-[8px] text-slate-600">
          highConfidenceConclusionAllowed={String(item.highConfidenceConclusionAllowed)}
        </span>
      </div>
    </div>
  );
}

export function HoldingDefenseTracker() {
  const [payload, setPayload] = useState<HoldingDefenseTrackerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Only the internal contract endpoint is ever fetched here.
    fetch("/api/portfolio/holding-defense")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setPayload(json as HoldingDefenseTrackerResponse);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = payload?.summary;

  return (
    <section className="panel-shell overflow-hidden">
      {/* Header */}
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Holding Defense Tracker · /api/portfolio/holding-defense
            </p>
            <h2 className="text-[16px] font-semibold tracking-wide text-slate-100">持股防守追蹤</h2>
          </div>
          <span className="rounded-full border border-amber/20 bg-amber/[0.06] px-2.5 py-1 text-[8px] font-semibold text-amber">
            fixture only · 非即時資料 · not trade advice
          </span>
        </div>
        {/* Fixture-only warning banner */}
        <p className="mt-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[9px] leading-5 text-amber">
          fixture data 不是即時資料；fixture data 不是投資建議；不自動下單；不產生買賣指令；不替代投資判斷。
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {loading && (
          <p className="py-8 text-center text-[11px] text-slate-500">
            Holding Defense Tracker loading fixture data...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-negative/20 bg-negative/[0.05] p-4">
            <p className="text-[11px] font-semibold text-negative">
              Holding Defense Tracker fixture data unavailable
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              已套用安全 fallback，不顯示任何假資料。fixture data 不是即時資料、不是投資建議。錯誤：{error}
            </p>
          </div>
        )}

        {!loading && !error && payload && summary && (
          <>
            {/* Summary cards */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                追蹤摘要 (Summary)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <Pill label="totalHoldings" value={String(summary.totalHoldings)} />
                <Pill label="正常觀察" value={String(summary.normalObservationCount)} />
                <Pill label="接近防守區" value={String(summary.defenseZoneNearCount)} />
                <Pill label="防守區破壞" value={String(summary.defenseZoneBrokenCount)} />
                <Pill label="獲利保護" value={String(summary.profitProtectionActiveCount)} />
                <Pill label="風險降低" value={String(summary.riskReductionActiveCount)} />
                <Pill label="資料不足" value={String(summary.dataInsufficientCount)} />
                <Pill label="價格未驗證" value={String(summary.priceNotVerifiedCount)} />
                <Pill label="來源衝突" value={String(summary.sourceConflictCount)} />
                <Pill label="資料過舊" value={String(summary.staleDataCount)} />
                <Pill
                  label="highConfidence"
                  value={String(summary.highConfidenceConclusionAllowed)}
                  tone={summary.highConfidenceConclusionAllowed ? "text-positive" : "text-amber"}
                />
                <Pill
                  label="sourceMode"
                  value={payload.sourceMode}
                />
              </div>
              {!summary.highConfidenceConclusionAllowed && (
                <p className="mt-2 text-[10px] text-amber">
                  目前不可輸出高信心結論（資料不足就顯示資料不足）。
                </p>
              )}
            </div>

            {/* Tracker item cards */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                持股防守追蹤卡 ({payload.items.length})
              </p>
              {payload.items.length === 0 ? (
                <p className="text-[10px] text-slate-600">
                  contract-only 空狀態：尚無 fixture data。
                </p>
              ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                  {payload.items.map((item, i) => (
                    <TrackerCard key={item.trackerId ?? i} item={item} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Safety labels footer — always shown */}
        <div className="rounded-xl border border-line bg-slate-900/40 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Safety Boundary
          </p>
          <div className="grid gap-x-6 gap-y-0.5 text-[10px] leading-5 text-slate-500 sm:grid-cols-2">
            <span>· 不自動下單；不產生買賣指令；不替代投資判斷。</span>
            <span>· Holding Defense Tracker UI 不是自動交易系統。</span>
            <span>· fixture data 不是即時資料；fixture data 不是投資建議。</span>
            <span>· 防守區是防守觀察，不是自動出場。</span>
            <span>· 策略失效觀察價不是自動停損價。</span>
            <span>· takeProfitZone 不是賣出價。</span>
            <span>· 出場觀察區不是賣出價。</span>
            <span>· 風險降低觀察不是賣出指令。</span>
            <span>· priceVerified = false 時不得輸出精準價位。</span>
            <span>· fallback-only data 不得觸發 DANGER。</span>
            <span>· stale data 不得觸發 DANGER。</span>
            <span>· source conflict 時降級為 WARNING / DATA_INSUFFICIENT。</span>
            <span>· 資料不足就顯示資料不足。</span>
          </div>
        </div>
      </div>
    </section>
  );
}
