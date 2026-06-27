import type { AllenScoreCandidate } from "@/use-cases/war-room/allen-score-scoring-model-contract";

// ---------------------------------------------------------------------------
// System Candidates Table — V61 (Allen Score)
//
// System-screened opportunities ranked by Allen Score 100. Shows 總分 +
// 五大分項（技術 / 基本 / 籌碼 / ETF / 情緒）. 系統候選股不等於持股
// (system candidate is not position). fixture/mock score is not operational data.
// Never shown in actual position PnL / asset level. No fetch, no Supabase, no env,
// no DB.
// ---------------------------------------------------------------------------

const GRADE_LABEL: Record<string, string> = {
  A_MAIN_UPTREND: "A 級",
  B_OBSERVE: "B 級",
  C_WAIT: "C 級",
  AVOID: "禁碰",
};

export function SystemCandidatesTable({ candidates }: { candidates: AllenScoreCandidate[] }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          系統機會池 · System Candidates（Allen Score）
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-amber">系統候選股不等於持股（system candidate is not position）。</p>
        <p className="mt-1 text-[10px] text-slate-500">fixture/mock score 不可作為正式操作依據。</p>
        <p className="mt-1 text-[9px] text-slate-600">Allen Score = 技術 + 基本 + 籌碼 + ETF + 情緒（totalScore equals sub-score sum，deterministic scoring engine）。</p>
        <p className="mt-1 text-[9px] text-slate-600">結構化承接區 / 失效防守區 / 目標觀察區詳見每日候選池（Structured Trade Plan，fixture/mock，觀察策略，不是買賣指令）。</p>
      </div>
      <div className="overflow-x-auto px-2 py-3 sm:px-4">
        <table className="w-full min-w-[960px] border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-line text-left text-slate-500">
              <th className="px-2 py-1.5">股票</th>
              <th className="px-2 py-1.5">分級</th>
              <th className="px-2 py-1.5">Allen Score</th>
              <th className="px-2 py-1.5">技術 30</th>
              <th className="px-2 py-1.5">基本 25</th>
              <th className="px-2 py-1.5">籌碼 25</th>
              <th className="px-2 py-1.5">ETF 10</th>
              <th className="px-2 py-1.5">情緒 10</th>
              <th className="px-2 py-1.5">候選原因</th>
              <th className="px-2 py-1.5">今日建議</th>
              <th className="px-2 py-1.5">驗證狀態</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-300">
            {candidates.map((c) => (
              <tr key={c.stockId} className="border-b border-line/40 last:border-0">
                <td className="px-2 py-1.5 text-slate-100">{c.symbol} {c.name}</td>
                <td className="px-2 py-1.5">{GRADE_LABEL[c.grade] ?? c.grade}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-100">{c.allenScore}</td>
                <td className="px-2 py-1.5">{c.technicalScore}</td>
                <td className="px-2 py-1.5">{c.fundamentalScore}</td>
                <td className="px-2 py-1.5">{c.chipScore}</td>
                <td className="px-2 py-1.5">{c.etfFlowScore}</td>
                <td className="px-2 py-1.5">{c.marketSentimentScore}</td>
                <td className="px-2 py-1.5">{c.candidateReason}</td>
                <td className="px-2 py-1.5 text-amber">{c.suggestedAction}</td>
                <td className="px-2 py-1.5">{c.verificationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
