import { buildAllenWarRoomOperationalLayoutContract } from "@/use-cases/war-room/build-allen-war-room-operational-layout-contract";
import { buildAllenScoreScoringModelContract } from "@/use-cases/war-room/build-allen-score-scoring-model-contract";
import { buildAllenScoreDeterministicScoringEngineContract } from "@/use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract";
import { buildStructuredCandidateTradePlanContract } from "@/use-cases/war-room/build-structured-candidate-trade-plan-contract";
import { buildCandidatePriceLevelFixtureSourceContract } from "@/use-cases/war-room/build-candidate-price-level-fixture-source-contract";
import { buildDescriptorToRealQuoteMappingContract } from "@/use-cases/war-room/build-descriptor-to-real-quote-mapping-contract";
import { buildAuthorizedRealQuoteFieldCatalogContract } from "@/use-cases/war-room/build-authorized-real-quote-field-catalog-contract";
import { buildRealQuoteSourceConflictResolutionPolicyContract } from "@/use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract";
import { buildConflictToTradePlanVerificationContract } from "@/use-cases/war-room/build-conflict-to-trade-plan-verification-contract";
import { buildDowngradedTradePlanUiBehaviorContract } from "@/use-cases/war-room/build-downgraded-trade-plan-ui-behavior-contract";
import { buildUnifiedConnectionEvidenceLedgerContract } from "@/use-cases/war-room/build-unified-connection-evidence-ledger-contract";
import { buildEvidenceLedgerTransitionContract } from "@/use-cases/war-room/build-evidence-ledger-transition-contract";
import { buildLedgerIntegrityRollupContract } from "@/use-cases/war-room/build-ledger-integrity-rollup-contract";
import { DataVerificationBanner } from "@/components/war-room/data-verification-banner";
import { MarketSessionPanel } from "@/components/war-room/market-session-panel";
import { ActualPositionsTable } from "@/components/war-room/actual-positions-table";
import { FixedWatchlistTable } from "@/components/war-room/fixed-watchlist-table";
import { SystemCandidatesTable } from "@/components/war-room/system-candidates-table";
import { AllenScoreSummary } from "@/components/war-room/allen-score-summary";
import { DailyCandidatePools } from "@/components/war-room/daily-candidate-pools";

// ---------------------------------------------------------------------------
// Allen War Room Operational Layout — V60
//
// The operational home for Allen (owner and user, not developer). First screen of
// `/holdings`: status bar, today summary cards, session view, then the three core
// tables (Actual Positions / Fixed Watchlist / System Candidates) + risk
// blocklist. Data is deterministic fixture/mock from the V60 pure builder — it is
// labeled and is NOT operational data. No fetch, no Supabase, no env, no DB, no
// /api/portfolio switch, no buy/sell command, no auto order.
// ---------------------------------------------------------------------------

const TONE_CLASS: Record<string, string> = {
  bull: "text-positive",
  neutral: "text-slate-200",
  weak: "text-amber",
  risk: "text-negative",
  insufficient: "text-slate-400",
};

export function WarRoomOperationalLayout() {
  const layout = buildAllenWarRoomOperationalLayoutContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const allenScore = buildAllenScoreScoringModelContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const scoringEngine = buildAllenScoreDeterministicScoringEngineContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const tradePlan = buildStructuredCandidateTradePlanContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const fixtureSource = buildCandidatePriceLevelFixtureSourceContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const mappingMatrix = buildDescriptorToRealQuoteMappingContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const authorizedCatalog = buildAuthorizedRealQuoteFieldCatalogContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const conflictPolicy = buildRealQuoteSourceConflictResolutionPolicyContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const tradePlanVerification = buildConflictToTradePlanVerificationContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const downgradedUiBehavior = buildDowngradedTradePlanUiBehaviorContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const connectionEvidence = buildUnifiedConnectionEvidenceLedgerContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const evidenceTransition = buildEvidenceLedgerTransitionContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const ledgerRollup = buildLedgerIntegrityRollupContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const scoredCandidates = allenScore.dailyPools.flatMap((p) => p.candidates);

  return (
    <div className="space-y-5">
      {/* Header / Status bar */}
      <section className="panel-shell overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6">
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Allen War Room Operational Layout · /holdings
            </p>
            <h1 className="text-[18px] font-semibold tracking-wide text-slate-100">Allen 台股戰情室</h1>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <p>市場階段 market session：{layout.marketSession}</p>
            <p>角色 role：owner and user, not developer</p>
          </div>
        </div>
        <div className="border-t border-line/60 px-5 py-3 sm:px-6">
          <DataVerificationBanner state={layout.dataVerification} />
        </div>
      </section>

      {/* Today summary cards */}
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">今日總判斷 · Summary</p>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {layout.summaryCards.map((c) => (
            <div key={c.cardId} className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">{c.title}</p>
              <p className={`mt-1 text-[14px] font-semibold ${TONE_CLASS[c.tone] ?? "text-slate-200"}`}>{c.value}</p>
              <p className="mt-1 text-[9px] leading-4 text-slate-600">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      <AllenScoreSummary model={allenScore} engine={scoringEngine} />
      <MarketSessionPanel structures={layout.sessionStructures} />
      <ActualPositionsTable positions={layout.actualPositions} />
      <FixedWatchlistTable items={layout.fixedWatchlist} />
      <SystemCandidatesTable candidates={scoredCandidates} />
      <DailyCandidatePools
        pools={allenScore.dailyPools}
        tradePlan={tradePlan}
        fixtureSource={fixtureSource}
        realQuoteMappingReadiness={mappingMatrix.mappingItems[0]?.mappingReadiness}
        authorizedSourceCatalogMode={authorizedCatalog.sourceCatalogMode}
        conflictPolicyMode={conflictPolicy.policyMode}
        tradePlanVerificationMode={tradePlanVerification.matrixMode}
        uiBehavior={downgradedUiBehavior}
        connectionEvidenceDecision={connectionEvidence.decision}
        evidenceTransitionMode={evidenceTransition.decision}
        ledgerRollupMode={ledgerRollup.decision}
      />

      {/* Risk blocklist */}
      <section className="panel-shell overflow-hidden">
        <div className="border-b border-line/80 px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">禁碰股 / 高風險股 · Risk Blocklist</h2>
        </div>
        <div className="space-y-1 px-5 py-4 sm:px-6">
          {layout.riskBlocklist.map((r) => (
            <p key={r.stockId} className="text-[10px] text-slate-400">
              <span className="font-mono text-slate-200">{r.symbol} {r.name}</span> — {r.reason}（{r.dataVerificationStatus}）
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
