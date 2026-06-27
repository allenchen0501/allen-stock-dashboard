import type { AllenScoreDailyPool } from "@/use-cases/war-room/allen-score-scoring-model-contract";

// ---------------------------------------------------------------------------
// Daily Candidate Pools — V61
//
// Allen Score daily grade pools: A 級主升段池 / B 級觀察池 / C 級等待池 / 禁碰池.
// Each candidate shows 候選原因 / 技術觸發 / 承接區 / 確認條件 / 失效條件 /
// 風報比 / 今日建議 / 資料來源 / 資料時間 / 驗證狀態, plus the Allen Score total
// and 5 sub-scores. 系統候選股不等於持股、可逢低布局不等於已買進,
// fixture/mock score is not operational data. No fetch, no Supabase, no env, no DB.
// ---------------------------------------------------------------------------

const GRADE_TONE: Record<string, string> = {
  A_MAIN_UPTREND: "text-positive",
  B_OBSERVE: "text-slate-200",
  C_WAIT: "text-amber",
  AVOID: "text-negative",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[10px] leading-4 text-slate-400">
      <span className="text-slate-500">{label}：</span>
      <span className="text-slate-300">{value}</span>
    </p>
  );
}

export function DailyCandidatePools({ pools }: { pools: AllenScoreDailyPool[] }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          每日候選池 · Daily Candidate Pools
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-amber">
          系統候選股不等於持股 · 可逢低布局不等於已買進。
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          fixture/mock score 不可作為正式操作依據（fixture/mock score is not operational data）。
        </p>
        <p className="mt-1 text-[9px] text-slate-600">
          每檔總分 = 五大分項加總，分級依分數決定（deterministic scoring engine：grade must match score、pool must match grade）。
        </p>
      </div>

      <div className="space-y-5 px-5 py-4 sm:px-6">
        {pools.map((pool) => (
          <div key={pool.poolId}>
            <p className={`mb-2 text-[12px] font-semibold ${GRADE_TONE[pool.grade] ?? "text-slate-200"}`}>
              {pool.title}
              <span className="ml-2 text-[9px] text-slate-500">{pool.candidates.length} 檔</span>
            </p>

            {pool.candidates.length === 0 ? (
              <p className="text-[10px] text-slate-600">（今日無候選，fixture）</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {pool.candidates.map((c) => (
                  <div key={c.stockId} className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-mono text-[12px] text-slate-100">
                        {c.symbol} {c.name}
                      </p>
                      <p className="text-[13px] font-semibold text-slate-100">
                        Allen Score <span className="font-mono">{c.allenScore}</span>
                      </p>
                    </div>

                    <p className="mt-1 text-[9px] text-slate-500">
                      技術 {c.technicalScore} · 基本 {c.fundamentalScore} · 籌碼 {c.chipScore} · ETF {c.etfFlowScore} · 情緒 {c.marketSentimentScore}
                    </p>

                    <div className="mt-2 space-y-0.5">
                      <Field label="候選原因" value={c.candidateReason} />
                      <Field label="技術觸發" value={c.technicalTriggers.join("、")} />
                      <Field label="承接區" value={c.pullbackBuyZone} />
                      <Field label="確認條件" value={c.confirmationCondition} />
                      <Field label="失效條件" value={c.invalidationCondition} />
                      <Field label="風報比" value={c.riskRewardRatio} />
                      <Field label="今日建議" value={c.suggestedAction} />
                      <Field label="資料來源" value={c.dataSource} />
                      <Field label="資料時間" value={c.dataTimestamp} />
                      <Field label="驗證狀態" value={c.verificationStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
