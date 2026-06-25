import { buildRuntimePilotReadinessContract } from "@/use-cases/runtime-pilot/build-runtime-pilot-readiness-contract";
import type { RuntimePilotReadinessGate } from "@/use-cases/runtime-pilot/runtime-pilot-readiness-contract";

// ---------------------------------------------------------------------------
// Runtime Pilot Readiness — V34 UI (server component)
//
// Renders the V33 Runtime Pilot Readiness Checklist directly from the pure
// builder. It does NOT fetch any URL, does NOT import the route, does NOT
// connect to Supabase, does NOT read env keys, does NOT read a clock, and does
// NOT produce buy/sell commands. This is a spec-only / fixture-only readiness
// preview — it is NOT runtime state.
// ---------------------------------------------------------------------------

const FIXED_GENERATED_AT = "2026-06-23T00:00:00.000Z";

const GATE_LABEL: Record<string, string> = {
  SOURCE_AUTHORIZATION: "資料源授權",
  SOURCE_LEGAL_STATUS: "資料源合法狀態",
  RATE_LIMIT_POLICY: "速率限制政策",
  MARKET_SESSION_HANDLING: "市場時段處理",
  TIMESTAMP_NORMALIZATION: "時間戳正規化",
  STALE_GUARD: "stale guard",
  SOURCE_CONFLICT_THRESHOLD: "來源衝突門檻",
  FALLBACK_DOWNGRADE: "fallback 降級",
  NO_DANGER_GUARD: "no-DANGER guard",
  DRY_RUN_MODE: "dry-run 模式",
  NO_WRITE_GUARD: "no-write guard",
  AUDIT_LOG_SHAPE: "audit log 結構",
  ROLLBACK_PLAN: "rollback 計畫",
  KILL_SWITCH: "kill switch",
  ALERT_SAFETY: "警報安全",
  BUY_SELL_COMMAND_BLOCK: "買賣指令封鎖",
  NOT_TRADE_ADVICE: "非投資建議",
  PRODUCTION_WRITE_BLOCKED: "production 寫入封鎖",
};

function severityTone(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "text-negative bg-negative/10 border-negative/20";
    case "HIGH":
      return "text-amber bg-amber/10 border-amber/20";
    case "MEDIUM":
      return "text-sky-400 bg-sky-400/10 border-sky-400/20";
    default:
      return "text-slate-400 bg-slate-700/30 border-slate-600";
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "PASS":
      return "text-positive bg-positive/10 border-positive/20";
    case "WARNING":
      return "text-amber bg-amber/10 border-amber/20";
    case "FAIL":
    case "BLOCKED":
      return "text-negative bg-negative/10 border-negative/20";
    default:
      return "text-slate-400 bg-slate-700/30 border-slate-600";
  }
}

function decisionTone(decision: string): string {
  switch (decision) {
    case "GO_DRY_RUN":
      return "text-positive bg-positive/10 border-positive/20";
    case "READY_FOR_REVIEW":
      return "text-sky-400 bg-sky-400/10 border-sky-400/20";
    default:
      return "text-amber bg-amber/10 border-amber/20";
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

function GateCard({ gate }: { gate: RuntimePilotReadinessGate }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-white/[0.012] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-100">
            {GATE_LABEL[gate.gateId] ?? gate.gateLabel}
          </p>
          <p className="font-mono text-[8px] text-slate-600">
            {gate.gateId} · {gate.featureArea}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge value={gate.severity} tone={severityTone(gate.severity)} />
          <Badge value={gate.status} tone={statusTone(gate.status)} />
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] ${
              gate.passed ? "bg-positive/10 text-positive" : "bg-amber/10 text-amber"
            }`}
          >
            passed={String(gate.passed)}
          </span>
        </div>
      </div>

      {gate.blockingReason && (
        <p className="text-[9px] leading-5 text-negative">blockingReason：{gate.blockingReason}</p>
      )}
      {gate.warningReason && (
        <p className="text-[9px] leading-5 text-amber">warningReason：{gate.warningReason}</p>
      )}

      {gate.requiredEvidence.length > 0 && (
        <p className="text-[8px] text-slate-500">
          requiredEvidence：{gate.requiredEvidence.join("、")}
        </p>
      )}
      {gate.missingEvidence.length > 0 && (
        <p className="text-[8px] text-amber">missingEvidence：{gate.missingEvidence.join("、")}</p>
      )}
      {gate.nextRequiredAction && (
        <p className="text-[9px] leading-5 text-slate-400">
          nextRequiredAction：{gate.nextRequiredAction}
        </p>
      )}
      {gate.ownerHint && (
        <p className="text-[8px] text-slate-600">ownerHint：{gate.ownerHint}</p>
      )}
    </div>
  );
}

export function RuntimePilotReadiness() {
  const data = buildRuntimePilotReadinessContract({ generatedAt: FIXED_GENERATED_AT });
  const ds = data.decisionSummary;
  const audit = data.auditLogShape;
  const rollback = data.rollbackPlanShape;
  const kill = data.killSwitchShape;

  const criticalGates = data.gates.filter((g) => g.severity === "CRITICAL");
  const missingEvidenceGates = data.gates.filter((g) => g.missingEvidence.length > 0);
  const nextActionGates = data.gates.filter((g) => g.nextRequiredAction != null);

  return (
    <section className="panel-shell overflow-hidden">
      {/* Header */}
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Runtime Pilot Readiness · spec-only / fixture-only
            </p>
            <h2 className="text-[16px] font-semibold tracking-wide text-slate-100">
              Runtime Pilot Readiness
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge value={ds.decision} tone={decisionTone(ds.decision)} />
            <span className="font-mono text-[8px] text-slate-600">
              contractVersion={data.contractVersion} · {data.sourceMode}
            </span>
          </div>
        </div>
        {/* Spec-only warning banner */}
        <p className="mt-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[9px] leading-5 text-amber">
          readiness preview 不是 runtime 狀態；fixture data 不是即時資料；不自動下單；不產生買賣指令；不替代投資判斷。
          V34 不接真資料；V34 不建立 runtime；V34 不寫資料。
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {/* Decision summary */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Decision Summary
          </p>
          <div className="mb-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[10px] leading-5 text-amber">
            decision = {ds.decision}（{ds.decisionReason}）
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <Pill label="criticalGateCount" value={String(ds.criticalGateCount)} />
            <Pill label="criticalGatePassedCount" value={String(ds.criticalGatePassedCount)} />
            <Pill label="blockedGateCount" value={String(ds.blockedGateCount)} />
            <Pill label="notReviewedGateCount" value={String(ds.notReviewedGateCount)} />
            <Pill label="warningGateCount" value={String(ds.warningGateCount)} />
            <Pill
              label="allCriticalGatesPassed"
              value={String(ds.allCriticalGatesPassed)}
              tone={ds.allCriticalGatesPassed ? "text-positive" : "text-amber"}
            />
            <Pill label="dryRunModeRequired" value={String(ds.dryRunModeRequired)} />
            <Pill label="noWriteModeRequired" value={String(ds.noWriteModeRequired)} />
            <Pill
              label="productionWriteAllowed"
              value={String(ds.productionWriteAllowed)}
              tone="text-negative"
            />
            <Pill
              label="buySellCommandGenerationBlocked"
              value={String(ds.buySellCommandGenerationBlocked)}
            />
            <Pill label="notTradeAdviceAlwaysTrue" value={String(ds.notTradeAdviceAlwaysTrue)} />
            <Pill label="GO/NO-GO" value={ds.decision} tone={decisionTone(ds.decision).split(" ")[0]} />
          </div>
          <p className="mt-2 text-[9px] leading-5 text-amber">
            GO_DRY_RUN 不是 production；GO_DRY_RUN 不代表可寫資料；GO_DRY_RUN 不代表產生買賣指令；
            NO_GO 代表不得啟動 Runtime Pilot；production write 一律 BLOCKED。
          </p>
        </div>

        {/* Critical gates summary */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Critical Gates ({criticalGates.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {criticalGates.map((g) => (
              <GateCard key={`crit-${g.gateId}`} gate={g} />
            ))}
          </div>
        </div>

        {/* All readiness gates */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            All Readiness Gates ({data.gates.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {data.gates.map((g) => (
              <GateCard key={g.gateId} gate={g} />
            ))}
          </div>
        </div>

        {/* Missing evidence */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Missing Evidence ({missingEvidenceGates.length})
          </p>
          {missingEvidenceGates.length === 0 ? (
            <p className="text-[10px] text-slate-600">無缺漏證據。</p>
          ) : (
            <ul className="space-y-0.5 text-[9px] text-amber">
              {missingEvidenceGates.map((g) => (
                <li key={`miss-${g.gateId}`}>
                  · {g.gateId}：{g.missingEvidence.join("、")}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Next required actions */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Next Required Actions ({nextActionGates.length})
          </p>
          {nextActionGates.length === 0 ? (
            <p className="text-[10px] text-slate-600">無待辦行動。</p>
          ) : (
            <ul className="space-y-0.5 text-[9px] text-slate-400">
              {nextActionGates.map((g) => (
                <li key={`act-${g.gateId}`}>
                  · {g.gateId}：{g.nextRequiredAction}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Audit / rollback / kill switch preview */}
        <div className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-line bg-white/[0.012] p-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Audit Log Shape
            </p>
            <div className="flex flex-col gap-0.5 font-mono text-[8px] text-slate-500">
              <span>auditId：{audit.auditId}</span>
              <span>generatedAt：{audit.generatedAt}</span>
              <span>sourceId：{String(audit.sourceId)}</span>
              <span>stockId：{String(audit.stockId)}</span>
              <span>gateId：{audit.gateId}</span>
              <span>beforeStatus：{String(audit.beforeStatus)}</span>
              <span>afterStatus：{audit.afterStatus}</span>
              <span>decision：{audit.decision}</span>
              <span>reason：{audit.reason}</span>
              <span>requestPerformed：{String(audit.requestPerformed)}</span>
              <span>supabaseConnected：{String(audit.supabaseConnected)}</span>
              <span>productionWritePerformed：{String(audit.productionWritePerformed)}</span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white/[0.012] p-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Rollback Plan Shape
            </p>
            <div className="flex flex-col gap-0.5 font-mono text-[8px] text-slate-500">
              <span>rollbackId：{rollback.rollbackId}</span>
              <span>rollbackReason：{rollback.rollbackReason}</span>
              <span>affectedFeature：{rollback.affectedFeature}</span>
              <span>rollbackTrigger：{rollback.rollbackTrigger}</span>
              <span>rollbackOwner：{rollback.rollbackOwner}</span>
              <span>rollbackStatus：{rollback.rollbackStatus}</span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white/[0.012] p-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Kill Switch Shape
            </p>
            <div className="flex flex-col gap-0.5 font-mono text-[8px] text-slate-500">
              <span>killSwitchId：{kill.killSwitchId}</span>
              <span>enabled：{String(kill.enabled)}</span>
              <span>reason：{kill.reason}</span>
              <span>affectedRuntime：{kill.affectedRuntime}</span>
              <span>activatedAt：{String(kill.activatedAt)}</span>
              <span>deactivatedAt：{String(kill.deactivatedAt)}</span>
              <span>owner：{kill.owner}</span>
              <span>requiresManualReview：{String(kill.requiresManualReview)}</span>
            </div>
          </div>
        </div>

        {/* Safety labels footer */}
        <div className="rounded-xl border border-line bg-slate-900/40 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Safety Boundary
          </p>
          <div className="grid gap-x-6 gap-y-0.5 text-[10px] leading-5 text-slate-500 sm:grid-cols-2">
            <span>· 不自動下單；不產生買賣指令；不替代投資判斷。</span>
            <span>· Runtime Pilot Readiness UI 不是自動交易系統。</span>
            <span>· fixture data 不是即時資料；readiness preview 不是 runtime 狀態。</span>
            <span>· V34 不接真資料；V34 不建立 runtime；V34 不寫資料。</span>
            <span>· GO_DRY_RUN 不是 production。</span>
            <span>· GO_DRY_RUN 不代表可寫資料。</span>
            <span>· GO_DRY_RUN 不代表產生買賣指令。</span>
            <span>· production write 一律 BLOCKED。</span>
            <span>· fallback-only data 不得觸發 DANGER。</span>
            <span>· stale data 不得觸發 DANGER。</span>
            <span>· source conflict 不得觸發 DANGER。</span>
            <span>· priceVerified = false 時不得輸出精準價位。</span>
            <span>· 資料不足就顯示資料不足。</span>
          </div>
        </div>
      </div>
    </section>
  );
}
