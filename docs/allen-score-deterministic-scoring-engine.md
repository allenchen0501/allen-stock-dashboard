# Allen Score Deterministic Scoring Engine & Grade Consistency

本文件定義 V62 Allen Score Deterministic Scoring Engine：把 V61 目前手填的 candidate allenScore / grade / pool assignment，升級成 deterministic pure scoring engine，確保五大分項加總、總分、grade、candidate pool 完全一致。

本版仍是 deterministic pure function + contract + validator + UI structure。fixture/mock score is not operational data。system candidate is not position；可逢低布局不等於已買進；no fake PnL；pnlComputable false。no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order。V62 不是 real-data mapping、不是 Supabase connection、不是 production trading readiness。

---

## A. Pure Functions

`use-cases/war-room/allen-score-scoring-engine.ts` 匯出四個純函式：

1. scoreCandidate(subScores)
2. gradeCandidate(totalScore)
3. assignCandidatePool(grade)
4. buildCandidateScoringBreakdown(candidate)

純函式無副作用、無 I/O、不連線、不讀 env、不 fetch、不讀時鐘、不寫資料。

---

## B. scoreCandidate(subScores)

接受五大分項：technicalScore、fundamentalScore、chipScore、etfFlowScore、marketSentimentScore，回傳 totalScore。

規則：

- totalScore equals sub-score sum（totalScore 必須等於五大分項加總）。
- 分項不得超過權重：technicalScore <= 30、fundamentalScore <= 25、chipScore <= 25、etfFlowScore <= 10、marketSentimentScore <= 10。
- 分項不得小於 0。
- totalScore 不得小於 0 或大於 100。
- 超出範圍時 scoreCandidate 會 reject（throw RangeError）；`validateSubScores` 會回傳違規清單（flags invalid sub-score ranges）。

---

## C. gradeCandidate(totalScore)

- A >= 80（totalScore >= 80 => A）
- B 70–79（70 <= totalScore <= 79 => B）
- C 60–69（60 <= totalScore <= 69 => C）
- AVOID < 60（totalScore < 60 => AVOID）

grade must match score：grade 必須由分數決定，不得手填。

---

## D. assignCandidatePool(grade)

pool must match grade：

- A => A_GRADE_MAIN_UPTREND
- B => B_GRADE_WATCHLIST
- C => C_GRADE_WAITING
- AVOID => RISK_BLOCKLIST

---

## E. buildCandidateScoringBreakdown(candidate)

對單一 candidate 重新計算：computedTotal（= scoreCandidate）、reportedTotal（candidate.allenScore）、totalMatches、engineGrade（= gradeCandidate）、assignedPool（= assignCandidatePool）。isPosition 與 pnlComputable 直接帶過（system candidate is not position、pnlComputable false）。

---

## F. Consistency Gate

V62 contract / builder 檢查：

- every candidate total equals sub-score sum。
- every candidate grade matches score（grade must match score）。
- every candidate pool matches grade（pool must match grade）。
- A pool contains only A grade and score >= 80。
- B pool contains only B grade and score 70–79。
- C pool contains only C grade and score 60–69。
- risk blocklist contains only AVOID and score < 60。
- no candidate can be both position and system candidate。
- pnlComputable remains false for all system candidates（pnlComputable false）。
- system candidates do not have shares or cost basis（no fake PnL）。
- fixture/mock warning remains visible（fixture/mock score is not operational data）。

全部一致 → decision = READY_FOR_UI_REVIEW，否則 NO_GO。永遠不輸出 production go-live 結論。

---

## G. Safety Boundary

- realDataConnected = false
- supabaseConnected = false
- envReadPerformed = false
- databaseWritePerformed = false
- portfolioApiSwitched = false
- buySellCommandGenerated = false
- autoOrderRequested = false
- productionTradingReady = false
- system candidate is not position；no fake PnL；pnlComputable false。
- fixture/mock score is not operational data。
- no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order。

---

## H. Future

未來真實資料接入後，scoreCandidate 才以真實技術 / 基本 / 籌碼 / ETF / 情緒分項計算；在 fixture/mock 標示移除前，分數不可作為正式操作依據、候選股不可當持股、可逢低布局不等於已買進。
