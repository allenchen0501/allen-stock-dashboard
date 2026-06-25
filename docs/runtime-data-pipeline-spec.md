# Runtime Data Pipeline Spec

本文件定義 Allen Stock Dashboard 的 **Runtime Data Pipeline Spec**（未來資料接入前的治理規格）。
V28 定義 source priority、source policy、price verification pipeline、stale guard、source conflict
downgrade、fallback-only downgrade、data quality gate、runtime readiness gate、request boundary、
no-write guard，以及「fallback / stale 不得觸發 DANGER」治理，作為 V29 Runtime Pilot 的前置規格。

**本階段（V28）是 spec-only / contract-only。雖然名稱有 Runtime，但本輪只定義未來 runtime data
pipeline 的規格與 contract，不建立 runtime。新增文件、use-case contract、checker、README、package.json。
不接真資料、不建立 runtime adapter、不建立 quote polling / scheduler / webhook / crawler、
不連 Supabase、不讀 env、不新增 API route、不新增 UI、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Dynamic Opportunity Pool & Price Verification Spec](./dynamic-opportunity-price-verification-spec.md)、
[Holding Defense Tracker API Contract](./holding-defense-tracker-api-contract.md)、
[Position Strategy Plan Spec](./position-strategy-plan-spec.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Runtime Data Pipeline Spec。
- V28 目標是定義未來資料接入前的治理規格。
- 本階段是 spec-only / contract-only。
- 不接真資料。
- 不建立 runtime adapter。
- 不建立 quote polling。
- 不建立 scheduler。
- 不建立 webhook。
- 不建立 crawler。
- 不連 Supabase。
- 不讀 env key。
- 不新增 API route。
- 不新增 UI。
- 不寫資料。
- 不產生買賣指令。
- 不自動下單。

---

## B. Relationship to Previous Versions

- V24 定義 Position Strategy Plan。
- V25 定義 Dynamic Opportunity Pool 與 Price Verification 規則。
- V26 用 fixture 把 Position Strategy Plans 串進 War Room。
- V27 建立 Holding Defense Tracker API Contract。
- V28 定義 runtime data pipeline governance。
- V28 不建立 runtime。
- V29 才會做 Runtime Pilot。
- V30 才會做 Intraday Holding Defense Runtime。

---

## C. Core Philosophy

資料接入不是越多越好，而是要可驗證、可降級、可追溯。

Runtime Data Pipeline 的核心是：

- source priority
- source provenance
- price freshness
- source confidence
- source conflict detection
- stale guard
- fallback-only downgrade
- data quality status
- priceVerified
- highConfidenceConclusionAllowed
- no production write unless explicitly allowed
- no DANGER from stale or fallback-only data
- no precise price zone when priceVerified = false

系統必須先判斷資料品質，再讓 Position Strategy Plan / Holding Defense Tracker / War Room 使用資料。

---

## D. Source Priority

正式資料源優先順序（對應 contract 的 `RuntimeSourcePriority`）：

1. Official / licensed exchange feed → `OFFICIAL_OR_LICENSED`
2. Broker API / authorized quote provider → `BROKER_OR_AUTHORIZED`
3. Validated secondary source → `VALIDATED_SECONDARY`
4. Fallback cache → `FALLBACK_CACHE`
5. Manual verified source → `MANUAL_VERIFIED`
6. Not available → `NOT_AVAILABLE`

source governance 說明：

- TWSE / TPEx official or licensed feed 屬於 official / licensed source。
- Broker API / authorized quote provider 屬於 authorized source。
- Yahoo / FinMind / TradingView / yfinance-like 僅能歸類為 validated secondary 或 fallback。
- Yahoo / FinMind / yfinance-like 不得作為唯一正式來源。
- secondary source 不得單獨產生高信心結論。
- fallback source 不得觸發 DANGER。
- stale data 不得觸發 DANGER。

> 註：這些資料源名稱只在本文件作為未來 source governance 說明。本輪不得在 code runtime files
> 建立任何資料源連接；contract 只使用 generic source categories（OFFICIAL_OR_LICENSED /
> VALIDATED_SECONDARY 等）。

---

## E. Pipeline Stages

定義以下 pipeline stages（對應 contract 的 `RuntimePipelineStage`）。

### SOURCE_DISCOVERY

識別可能來源，但不代表允許接入。

### SOURCE_AUTHORIZATION_CHECK

檢查資料來源是否 official / licensed / authorized / validated secondary / fallback。

### RAW_INGESTION

未來 runtime 才會實作。V28 不實作。

### NORMALIZATION

統一 stockId、market、price、timestamp、session、source metadata。

### PRICE_VERIFICATION

產生 priceVerified / priceVerificationStatus。

### FRESHNESS_CHECK

產生 priceFreshness / staleReason。

### SOURCE_CONFLICT_CHECK

產生 sourceConflictReason / downgradeReason。

### DATA_QUALITY_GATE

判斷 PASS / WARNING / FAIL / DATA_INSUFFICIENT。

### READ_MODEL_PROJECTION

把資料轉成 War Room / Holding Defense / Position Strategy 可消費的 read model。

### CONSUMER_DELIVERY

供 API / UI 讀取。

### PRODUCTION_WRITE_BLOCKED

在未開 production gate 前，所有寫入都必須 blocked。

---

## F. Price Verification Rules

對應 contract 的 `RuntimePriceVerificationStatus`。

### VERIFIED

條件：

- source priority 合格
- freshness 合格
- 無 source conflict
- session 合理
- stockId / market verified
- price sanity check pass

允許：

- precise price zone
- defenseZone
- invalidLevel
- takeProfitZone
- riskReduceZone
- targetObservationZone
- riskRewardRatio

但仍必須：

- notTradeAdvice = true
- highConfidenceConclusionAllowed 受資料品質控制

### NOT_VERIFIED

條件：無價格 / 無授權來源 / secondary source 不足 / source unavailable / market / stockId 無法確認。

限制：

- 不得輸出精準價位
- 不得輸出 riskRewardRatio
- 不得高信心結論

### STALE

條件：timestamp 過期 / session mismatch / cache 超過 freshness window / delayed source 被誤用為 real-time。

限制：

- stale data 不得觸發 DANGER
- stale data 不得輸出高信心結論
- precise zone 必須降級或 null

### SOURCE_CONFLICT

條件：多來源 price 差異超過 threshold / official / licensed source 與 secondary source 衝突 /
bid / ask / last / close 不一致且無法解釋 / market session mismatch。

限制：

- source conflict 時降級為 WARNING / DATA_INSUFFICIENT
- 不得輸出高信心結論
- 不得觸發 DANGER

### FALLBACK_ONLY

條件：只有 fallback cache / manual input；無 official / licensed / authorized / validated secondary。

限制：

- fallback-only data 不得觸發 DANGER
- 不得輸出高信心結論
- 不得輸出精準價位，除非明確標示 observation-only 並降級

### NOT_COVERED

條件：股票不在 coverage universe / 興櫃 / 冷門 / 特殊個股無可用來源 / stockId 無法確認。

限制：

- 不得輸出精準價位
- 不得輸出 riskRewardRatio
- 只能 DATA_INSUFFICIENT

---

## G. Freshness Guard

定義 freshness guard（對應 contract 的 `RuntimeFreshnessStatus`）：

- `FRESH`
- `DELAYED`
- `STALE`
- `SESSION_MISMATCH`
- `UNKNOWN`

規則：

- FRESH 可進入 price verification。
- DELAYED 必須標示延遲。
- STALE 不得觸發 DANGER。
- SESSION_MISMATCH 必須降級。
- UNKNOWN 必須 DATA_INSUFFICIENT。
- freshness window 必須依 market session 定義。
- priceCheckedAt 必須記錄。
- sourceTimestamp 必須記錄。
- checkedAt 必須記錄。

---

## H. Source Conflict Guard

定義 source conflict guard（對應 contract 的 `RuntimeSourceConflictStatus`）：

- `NO_CONFLICT`
- `MINOR_DIFFERENCE`
- `MAJOR_CONFLICT`
- `SESSION_MISMATCH`
- `SOURCE_UNAVAILABLE`
- `DATA_INSUFFICIENT`

規則：

- NO_CONFLICT 才可維持 PASS。
- MINOR_DIFFERENCE 可 WARNING。
- MAJOR_CONFLICT 必須 DATA_INSUFFICIENT。
- SESSION_MISMATCH 必須 STALE / DATA_INSUFFICIENT。
- SOURCE_UNAVAILABLE 不得高信心。
- source conflict 不得觸發 DANGER。

---

## I. Data Quality Gate

定義 data quality statuses（對應 contract 的 `RuntimeDataQualityStatus`）：

- `PASS`
- `WARNING`
- `FAIL`
- `DATA_INSUFFICIENT`
- `PRICE_NOT_VERIFIED`
- `SOURCE_CONFLICT`
- `STALE_DATA`
- `FALLBACK_ONLY`
- `NOT_COVERED`

規則：

- PASS 才可能允許 highConfidenceConclusionAllowed。
- WARNING 只能條件式觀察。
- FAIL 不得輸出高信心結論。
- DATA_INSUFFICIENT 只能資料不足。
- PRICE_NOT_VERIFIED 不得輸出精準價位。
- SOURCE_CONFLICT 必須降級。
- STALE_DATA 不得 DANGER。
- FALLBACK_ONLY 不得 DANGER。
- NOT_COVERED 不得精準價位。

---

## J. Runtime Readiness Gate

定義 runtime readiness gate（對應 contract 的 `RuntimePilotReadinessChecklist`）。
Runtime Pilot 之前必須確認：

- source legal status
- source authorization status
- source rate limit policy
- market session handling
- timestamp normalization
- stale guard
- source conflict threshold
- fallback downgrade
- data quality gate
- no-write mode
- audit log shape
- rollback plan
- kill switch
- no buy/sell command generation
- notTradeAdvice always true

---

## K. Consumer Integration Rules

未來 consumers（對應 contract 的 `RuntimeConsumerType`）：

- Position Strategy Plan
- Dynamic Opportunity Pool
- Holding Defense Tracker
- War Room
- Dashboard UI
- Alert System

規則：

- Consumers 不得直接使用 raw data。
- Consumers 只能使用 verified / normalized / gated read model。
- priceVerified = false 時，consumers 不得輸出精準 price zone。
- stale / fallback-only / source conflict 不得讓 alerts 進入 DANGER。
- War Room 仍是 read model。
- Holding Defense Tracker API 仍需遵守 data quality gate。
- Position Strategy Plan 仍需 notTradeAdvice = true。

---

## L. Production Write Guard

- V28 不寫資料。
- V29 pilot 預設仍應 no-write / dry-run。
- production write 需要明確 feature flag。
- production write 需要 migration / RLS / audit / rollback。
- fallback-only / stale / source conflict 不得寫成高信心資料。
- requestPerformed / supabaseConnected / productionWritePerformed 必須可追蹤。
- 任何寫入都不得產生買賣指令。

---

## M. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Runtime Data Pipeline 不是自動交易系統
- V28 不接真資料
- V28 不建立 runtime
- V28 不寫資料
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 時降級為 WARNING / DATA_INSUFFICIENT
- 資料不足就顯示資料不足
- highConfidenceConclusionAllowed 受資料品質控制

---

## N. Future Implementation Gate

### V29 Runtime Pilot

- 先接低風險官方 / 授權資料源
- 僅做價格驗證與資料品質
- 預設 dry-run
- 不產生買賣指令
- 不寫 production data

### V30 Intraday Holding Defense Runtime

- 盤中持股追蹤
- 急跌 / 防守區 / 趨勢破壞
- cooldown / dedup
- fallback-only 不得觸發 DANGER
- stale data 不得觸發 DANGER
