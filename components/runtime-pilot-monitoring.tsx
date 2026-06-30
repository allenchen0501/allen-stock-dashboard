'use client';

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { RuntimePilotDryRunApiResponse } from "@/use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract";

// ---------------------------------------------------------------------------
// Runtime Pilot Monitoring — V37 UI Integration
//
// Reads ONLY the internal /api/portfolio/runtime-pilot-dry-run contract endpoint
// (V36 fixture-only API). Does NOT import the builder, does NOT import the
// route, does NOT fetch any external URL, does NOT connect to Supabase, does
// NOT read env keys, and does NOT produce buy/sell commands. The payload is a
// fixture-only dry-run monitoring preview — it is NOT runtime state, never
// writes, and never auto-orders.
// ---------------------------------------------------------------------------

function tone(value: unknown): string {
  if (value === false) return "text-positive";
  if (value === true) return "text-amber";
  return "text-slate-200";
}

function KV({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line/40 py-0.5 text-[9px] last:border-0">
      <span className="font-mono text-slate-600">{label}</span>
      <span className={`break-all font-mono ${tone(value)}`}>{String(value)}</span>
    </div>
  );
}

function Pill({ label, value, tone: t }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-white/[0.015] px-3 py-2">
      <span className="text-[8px] uppercase tracking-[0.15em] text-slate-600">{label}</span>
      <span className={`break-all font-mono text-[10px] font-semibold ${t ?? "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.012] p-3">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      {children}
    </div>
  );
}

export function RuntimePilotMonitoring() {
  const [payload, setPayload] = useState<RuntimePilotDryRunApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Only the internal contract endpoint is ever fetched here.
    fetch("/api/portfolio/runtime-pilot-dry-run")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setPayload(json as RuntimePilotDryRunApiResponse);
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

  const s = payload?.summary;
  const b = payload?.dryRunBundle;

  return (
    <section className="panel-shell overflow-hidden">
      {/* Header */}
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Runtime Pilot Monitoring · /api/portfolio/runtime-pilot-dry-run
            </p>
            <h2 className="text-[16px] font-semibold tracking-wide text-slate-100">
              Runtime 試運行監控（Runtime Pilot Monitoring）
            </h2>
          </div>
          <span className="rounded-full border border-amber/20 bg-amber/[0.06] px-2.5 py-1 text-[8px] font-semibold text-amber">
            fixture only · 非即時資料 · not trade advice
          </span>
        </div>
        {/* Fixture-only warning banner */}
        <p className="mt-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[9px] leading-5 text-amber">
          fixture data 不是即時資料；monitoring preview 不是 runtime 狀態；不自動下單；不產生買賣指令；不替代投資判斷。
          V37 不接真資料；V37 不建立 runtime；V37 不寫資料。
        </p>
        <p className="mt-1 font-mono text-[8px] text-slate-600">
          lifecycle 從 DRY_RUN_NOT_ALLOWED 到 DRY_RUN_COMPLETED_WITH_NO_WRITE；runtimeMode = dry_run_spec；
          readinessDecision 預設 NO_GO。
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {loading && (
          <p className="py-8 text-center text-[11px] text-slate-500">
            Runtime Pilot Monitoring loading fixture data...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-negative/20 bg-negative/[0.05] p-4">
            <p className="text-[11px] font-semibold text-negative">
              Runtime Pilot Monitoring fixture data unavailable
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              已套用安全 fallback，不顯示任何假資料。fixture data 不是即時資料、不是投資建議、monitoring preview 不是 runtime 狀態。錯誤：{error}
            </p>
          </div>
        )}

        {!loading && !error && payload && s && b && (
          <>
            {/* Dry-run summary cards */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Dry-Run Summary
              </p>
              <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <Pill label="apiContractVersion" value={payload.apiContractVersion} />
                <Pill label="responseSource" value={payload.responseSource} />
                <Pill label="sourceMode" value={payload.sourceMode} />
                <Pill label="runtimeMode" value={payload.runtimeMode} />
                <Pill label="fixtureVersion" value={payload.fixtureVersion} />
                <Pill label="contractVersion" value={b.contractVersion} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <Pill label="lifecycleState" value={s.lifecycleState} tone="text-amber" />
                <Pill label="readinessDecision" value={s.readinessDecision} tone="text-amber" />
                <Pill label="dryRunAllowed" value={String(s.dryRunAllowed)} tone="text-positive" />
                <Pill label="priceVerified" value={String(s.priceVerified)} />
                <Pill label="highConfidenceConclusionAllowed" value={String(s.highConfidenceConclusionAllowed)} />
                <Pill label="precisePriceZoneAllowed" value={String(s.precisePriceZoneAllowed)} />
                <Pill label="buySellCommandGenerated" value={String(s.buySellCommandGenerated)} tone="text-positive" />
                <Pill label="autoOrderRequested" value={String(s.autoOrderRequested)} tone="text-positive" />
                <Pill label="productionWriteRequested" value={String(s.productionWriteRequested)} tone="text-positive" />
                <Pill label="writeAttempted" value={String(s.writeAttempted)} tone="text-positive" />
                <Pill label="databaseWritePerformed" value={String(s.databaseWritePerformed)} tone="text-positive" />
                <Pill label="externalOrderPerformed" value={String(s.externalOrderPerformed)} tone="text-positive" />
                <Pill label="productionWritePerformed" value={String(s.productionWritePerformed)} tone="text-positive" />
                <Pill label="supabaseConnected" value={String(s.supabaseConnected)} tone="text-positive" />
                <Pill label="killSwitchEnabled" value={String(s.killSwitchEnabled)} />
                <Pill label="dryRunCanContinue" value={String(s.dryRunCanContinue)} />
                <Pill label="rollbackRequired" value={String(s.rollbackRequired)} />
                <Pill label="noWriteProofStatus" value={s.noWriteProofStatus} />
              </div>
            </div>

            {/* Nested dry-run bundle sections */}
            <div className="grid gap-3 xl:grid-cols-2">
              <Section title="Source Descriptor">
                <KV label="sourceDescriptorId" value={b.sourceDescriptor.sourceDescriptorId} />
                <KV label="sourceAuthorizationStatus" value={b.sourceDescriptor.sourceAuthorizationStatus} />
                <KV label="sourcePriority" value={b.sourceDescriptor.sourcePriority} />
                <KV label="sourceTimestamp" value={b.sourceDescriptor.sourceTimestamp} />
                <KV label="sourceFreshnessWindowSeconds" value={b.sourceDescriptor.sourceFreshnessWindowSeconds} />
                <KV label="sourceLegalStatusReviewed" value={b.sourceDescriptor.sourceLegalStatusReviewed} />
                <KV label="sourceRateLimitReviewed" value={b.sourceDescriptor.sourceRateLimitReviewed} />
                <KV label="sourceProvenanceRecorded" value={b.sourceDescriptor.sourceProvenanceRecorded} />
                <KV label="requestPerformed" value={b.sourceDescriptor.requestPerformed} />
              </Section>

              <Section title="Quote Snapshot">
                <KV label="snapshotId" value={b.quoteSnapshot.snapshotId} />
                <KV label="stockId" value={b.quoteSnapshot.stockId} />
                <KV label="stockName" value={b.quoteSnapshot.stockName} />
                <KV label="currentPrice" value={b.quoteSnapshot.currentPrice} />
                <KV label="previousClose" value={b.quoteSnapshot.previousClose} />
                <KV label="intradayHigh" value={b.quoteSnapshot.intradayHigh} />
                <KV label="intradayLow" value={b.quoteSnapshot.intradayLow} />
                <KV label="volumeRatio" value={b.quoteSnapshot.volumeRatio} />
                <KV label="marketSessionStatus" value={b.quoteSnapshot.marketSessionStatus} />
                <KV label="sourceDescriptorId" value={b.quoteSnapshot.sourceDescriptorId} />
                <KV label="priceVerified" value={b.quoteSnapshot.priceVerified} />
                <KV label="requestPerformed" value={b.quoteSnapshot.requestPerformed} />
              </Section>

              <Section title="Price Verification">
                <KV label="priceVerified" value={b.priceVerification.priceVerified} />
                <KV label="priceVerificationStatus" value={b.priceVerification.priceVerificationStatus} />
                <KV label="freshnessStatus" value={b.priceVerification.freshnessStatus} />
                <KV label="sourceConflictStatus" value={b.priceVerification.sourceConflictStatus} />
                <KV label="dataQualityStatus" value={b.priceVerification.dataQualityStatus} />
                <KV label="highConfidenceConclusionAllowed" value={b.priceVerification.highConfidenceConclusionAllowed} />
                <KV label="requiredVerification" value={b.priceVerification.requiredVerification.join("、")} />
                <KV label="missingDataFields" value={b.priceVerification.missingDataFields.join("、")} />
                <KV label="precisePriceZoneAllowed" value={b.priceVerification.precisePriceZoneAllowed} />
                <KV label="noDangerGuardApplied" value={b.priceVerification.noDangerGuardApplied} />
              </Section>

              <Section title="Alert Projection">
                <KV label="alertProjectionId" value={b.alertProjection.alertProjectionId} />
                <KV label="projectedState" value={b.alertProjection.projectedState} />
                <KV label="projectedAlertLevel" value={b.alertProjection.projectedAlertLevel} />
                <KV label="triggerType" value={b.alertProjection.triggerType} />
                <KV label="noDangerGuardApplied" value={b.alertProjection.noDangerGuardApplied} />
                <KV label="downgradeReason" value={b.alertProjection.downgradeReason} />
                <KV label="notExitSignal" value={b.alertProjection.notExitSignal} />
                <KV label="notTradeAdvice" value={b.alertProjection.notTradeAdvice} />
                <KV label="buySellCommandGenerated" value={b.alertProjection.buySellCommandGenerated} />
                <KV label="autoOrderRequested" value={b.alertProjection.autoOrderRequested} />
                <KV label="productionWriteRequested" value={b.alertProjection.productionWriteRequested} />
              </Section>

              <Section title="Audit Event">
                <KV label="auditEventId" value={b.auditEvent.auditEventId} />
                <KV label="generatedAt" value={b.auditEvent.generatedAt} />
                <KV label="noWriteProofId" value={b.auditEvent.noWriteProofId} />
                <KV label="killSwitchChecked" value={b.auditEvent.killSwitchChecked} />
                <KV label="rollbackRequired" value={b.auditEvent.rollbackRequired} />
                <KV label="requestPerformed" value={b.auditEvent.requestPerformed} />
                <KV label="supabaseConnected" value={b.auditEvent.supabaseConnected} />
                <KV label="productionWritePerformed" value={b.auditEvent.productionWritePerformed} />
                <KV label="buySellCommandGenerated" value={b.auditEvent.buySellCommandGenerated} />
                <KV label="autoOrderRequested" value={b.auditEvent.autoOrderRequested} />
              </Section>

              <Section title="No-Write Proof">
                <KV label="proofId" value={b.noWriteProof.proofId} />
                <KV label="writeAttempted" value={b.noWriteProof.writeAttempted} />
                <KV label="productionWritePerformed" value={b.noWriteProof.productionWritePerformed} />
                <KV label="databaseWritePerformed" value={b.noWriteProof.databaseWritePerformed} />
                <KV label="externalOrderPerformed" value={b.noWriteProof.externalOrderPerformed} />
                <KV label="supabaseConnected" value={b.noWriteProof.supabaseConnected} />
                <KV label="blockedWriteOperations" value={b.noWriteProof.blockedWriteOperations.join("、")} />
                <KV label="evidenceLabels" value={b.noWriteProof.evidenceLabels.join("、")} />
                <KV label="proofStatus" value={b.noWriteProof.proofStatus} />
              </Section>

              <Section title="Kill Switch">
                <KV label="killSwitchId" value={b.killSwitch.killSwitchId} />
                <KV label="enabled" value={b.killSwitch.enabled} />
                <KV label="checkedAt" value={b.killSwitch.checkedAt} />
                <KV label="affectedRuntime" value={b.killSwitch.affectedRuntime} />
                <KV label="stopReason" value={b.killSwitch.stopReason} />
                <KV label="requiresManualReview" value={b.killSwitch.requiresManualReview} />
                <KV label="dryRunCanContinue" value={b.killSwitch.dryRunCanContinue} />
              </Section>

              <Section title="Rollback">
                <KV label="rollbackId" value={b.rollback.rollbackId} />
                <KV label="rollbackRequired" value={b.rollback.rollbackRequired} />
                <KV label="rollbackReason" value={b.rollback.rollbackReason} />
                <KV label="rollbackTrigger" value={b.rollback.rollbackTrigger} />
                <KV label="affectedFeature" value={b.rollback.affectedFeature} />
                <KV label="rollbackStatus" value={b.rollback.rollbackStatus} />
                <KV label="manualReviewRequired" value={b.rollback.manualReviewRequired} />
              </Section>
            </div>
          </>
        )}

        {/* Safety labels footer — always shown */}
        <div className="rounded-xl border border-line bg-slate-900/40 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            No-Write / No-Trade Guard / Safety Boundary
          </p>
          <div className="grid gap-x-6 gap-y-0.5 text-[10px] leading-5 text-slate-500 sm:grid-cols-2">
            <span>· 不自動下單；不產生買賣指令；不替代投資判斷。</span>
            <span>· Runtime Pilot Monitoring UI 不是自動交易系統。</span>
            <span>· fixture data 不是即時資料；monitoring preview 不是 runtime 狀態。</span>
            <span>· production write 一律 BLOCKED。</span>
            <span>· Dry-run monitoring 不是 production。</span>
            <span>· Dry-run monitoring 不代表可寫資料。</span>
            <span>· Dry-run monitoring 不代表產生買賣指令。</span>
            <span>· buySellCommandGenerated 必須 false；autoOrderRequested 必須 false。</span>
            <span>· priceVerified = false 時不得輸出精準價位。</span>
            <span>· fallback-only data 不得觸發 DANGER。</span>
            <span>· stale data 不得觸發 DANGER。</span>
            <span>· source conflict 不得觸發 DANGER。</span>
            <span>· 資料不足就顯示資料不足。</span>
          </div>
        </div>
      </div>
    </section>
  );
}
