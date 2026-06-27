import type { AllenScoreScoringModelBundle } from "@/use-cases/war-room/allen-score-scoring-model-contract";

// ---------------------------------------------------------------------------
// Allen Score Summary — V61
//
// Presentational summary of the Allen Score 100 scoring model: total 100 =
// Technical 30 + Fundamental 25 + Chip 25 + ETF Flow 10 + Market Sentiment 10,
// and the daily grade thresholds (A >= 80 / B 70-79 / C 60-69 / Avoid < 60).
// fixture/mock score is not operational data. No fetch, no Supabase, no env, no DB.
// ---------------------------------------------------------------------------

export function AllenScoreSummary({ model }: { model: AllenScoreScoringModelBundle }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Allen Score 100 · Scoring Model
        </p>
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          {model.scoringModelName} · 評分模型摘要
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-amber">
          fixture/mock score 不可作為正式操作依據（fixture/mock score is not operational data）。
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          系統候選股不等於持股 · 可逢低布局不等於已買進
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3 sm:px-6 xl:grid-cols-5">
        {model.categories.map((c) => (
          <div key={c.categoryId} className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">{c.name}</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-100">
              {c.weight}
              <span className="ml-0.5 text-[10px] text-slate-500">分</span>
            </p>
            <p className="mt-1 text-[9px] leading-4 text-slate-600">{c.subFactors.join(" · ")}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-line/60 px-5 py-3 sm:px-6">
        <p className="text-[10px] text-slate-400">
          總分 totalScore = <span className="font-mono text-slate-200">{model.totalScore}</span>
          （權重合計 scoreWeightsSum = <span className="font-mono text-slate-200">{model.scoreWeightsSum}</span>）
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
          <span>A 級主升段池：≥ {model.aGradeThreshold}</span>
          <span>B 級觀察池：{model.bGradeMin}–{model.bGradeMax}</span>
          <span>C 級等待池：{model.cGradeMin}–{model.cGradeMax}</span>
          <span>禁碰池：&lt; {model.avoidBelow}</span>
        </div>
      </div>
    </section>
  );
}
