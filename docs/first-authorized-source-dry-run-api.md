# First Authorized Source Dry-Run API

本文件定義 Allen Stock Dashboard 的 **First Authorized Source Dry-Run API**。
V40 把 V39 First Authorized Source Dry-Run bundle 包成 fixture-only API，作為 V41 First Authorized Source Dry-Run Monitoring UI 的資料來源。

**本階段（V40）是 fixture API / mock_or_contract / internal endpoint only。本輪不接真資料、不建立 runtime、不連 Supabase、不讀 env、不寫資料、不產生買賣指令、不自動下單。
contract / builder / route / checker 不得硬寫任何具體資料源名稱（single-source / source-neutral connector shape only）。**

相關文件：
[First Authorized Source Dry-Run Spec](./first-authorized-source-dry-run-spec.md)、
[Runtime Pilot Implementation Review](./runtime-pilot-implementation-review.md)、
[Runtime Pilot Dry-Run Spec](./runtime-pilot-dry-run-spec.md)、
[Runtime Pilot Monitoring UI](./runtime-pilot-monitoring-ui.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 First Authorized Source Dry-Run API。
- V40 目標是把 V39 First Authorized Source Dry-Run bundle 包成 fixture-only API。
- 本階段是 mock_or_contract。
- 本階段不接真資料。
- 本階段不建立 runtime。
- 本階段不建立 quote polling。
- 本階段不建立 scheduler。
- 本階段不建立 webhook。
- 本階段不建立 connector runtime。
- 本階段不連 Supabase。
- 本階段不讀 env key。
- 本階段不新增 UI。
- 本階段不寫資料。
- 本階段不產生買賣指令。
- 本階段不自動下單。

---

## B. API Endpoint

定義 endpoint：

```
GET /api/portfolio/first-authorized-source-dry-run
```

說明：

- 只允許 GET。
- 回傳 mock_or_contract / fixture-only payload。
- 不讀真實行情。
- 不讀真實持股。
- 不讀 Supabase。
- 不讀 env key。
- 不發外部 request。
- 不寫資料。
- 不產生買賣指令。
- 不自動下單。

---

## C. Relationship to Previous Versions

- V38 定義 Runtime Pilot Implementation Review。
- V39 定義 First Authorized Source Dry-Run Spec。
- V40 只建立 fixture-only API。
- V40 不建立 runtime。
- V40 不接真資料。
- V40 不新增 UI。
- V41 才可做 First Authorized Source Dry-Run Monitoring UI。
- 真正接資料必須等 V38 全部 CRITICAL review items PASS 且 manual sign-off 完成。

---

## D. Response Shape

API response 必須包含：

- `apiContractVersion`
- `responseSource`
- `sourceMode`
- `generatedAt`
- `fixtureVersion`
- `dryRunBundle`
- `summary`
- `safetyLabels`
- `requestPerformed`
- `supabaseConnected`
- `productionWritePerformed`

其中：

- `apiContractVersion` = V40
- `responseSource` = mock_or_contract
- `sourceMode` = fixture
- `fixtureVersion` = V40
- `dryRunBundle.contractVersion` = V39
- `dryRunBundle.decision` = NO_GO
- `dryRunBundle.dryRunAllowed` = false
- `dryRunBundle.preflight.manualSignOffCompleted` = false
- `requestPerformed` = false
- `supabaseConnected` = false
- `productionWritePerformed` = false

`summary` 至少包含：

- `decision`
- `dryRunAllowed`
- `manualSignOffCompleted`
- `authorizationStatus`
- `legalStatus`
- `sourceCategory`
- `requestMode`
- `requestPerformed`
- `rawResponseStored`
- `normalizedSnapshotProduced`
- `priceVerified`
- `highConfidenceConclusionAllowed`
- `precisePriceZoneAllowed`
- `projectedAlertLevel`
- `buySellCommandGenerated`
- `autoOrderRequested`
- `productionWriteRequested`
- `writeAttempted`
- `databaseWritePerformed`
- `externalOrderPerformed`
- `productionWritePerformed`
- `supabaseConnected`
- `dryRunCanContinue`
- `rollbackRequired`
- `noWriteProofStatus`

`summary` 必須從 `dryRunBundle` 派生，不得另外捏造一份假資料。

---

## E. Required Dry-Run Fields

API 必須能展示或保留：

- `preflight`
- `connectorShape`
- `quoteSnapshot`
- `priceVerification`
- `alertProjection`
- `auditEvent`
- `noWriteProof`
- `killSwitch`
- `rollback`

必須包含以下欄位語意：

- `GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN`
- `NO_GO`
- source-neutral connector shape
- single-source
- `manualSignOffCompleted`
- `priceVerified`
- `noDangerGuardApplied`
- `buySellCommandGenerated`
- `autoOrderRequested`
- `productionWriteRequested`
- `writeAttempted`
- `databaseWritePerformed`
- `externalOrderPerformed`
- `productionWritePerformed`
- `supabaseConnected`
- `requestPerformed`

本 API 維持 single-source / source-neutral connector shape：只描述一個抽象授權資料源的 dry-run 形狀，不硬寫任何具體資料源名稱。

---

## F. No-Write / No-Trade Guard

- `buySellCommandGenerated` 必須 false。
- `autoOrderRequested` 必須 false。
- `productionWriteRequested` 必須 false。
- `writeAttempted` 必須 false。
- `productionWritePerformed` 必須 false。
- `databaseWritePerformed` 必須 false。
- `externalOrderPerformed` 必須 false。
- `supabaseConnected` 必須 false。
- `requestPerformed` 必須 false。
- production write 一律 BLOCKED。
- First Authorized Source Dry-Run API 不是 production。
- First Authorized Source Dry-Run API 不代表可寫資料。
- First Authorized Source Dry-Run API 不代表產生買賣指令。

---

## G. Data Quality Guard

- `priceVerified` = false 時不得輸出精準價位。
- `priceVerified` = false 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- fallback-only data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。
- DATA_INSUFFICIENT 不得觸發 DANGER。
- `highConfidenceConclusionAllowed` 預設 false。
- `noDangerGuardApplied` 必須可追蹤。

---

## H. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- First Authorized Source Dry-Run API 不是自動交易系統
- fixture data 不是即時資料
- V40 不接真資料
- V40 不建立 runtime
- V40 不寫資料
- First Authorized Source Dry-Run API 不是 production
- First Authorized Source Dry-Run API 不代表可寫資料
- First Authorized Source Dry-Run API 不代表產生買賣指令
- production write 一律 BLOCKED
- buySellCommandGenerated 必須 false
- autoOrderRequested 必須 false
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- 資料不足就顯示資料不足

---

## I. Future Implementation Gate

### V41 First Authorized Source Dry-Run Monitoring UI

- 讀取 `GET /api/portfolio/first-authorized-source-dry-run`。
- 顯示 preflight。
- 顯示 connector shape。
- 顯示 quote snapshot normalization。
- 顯示 price verification / data quality。
- 顯示 alert projection。
- 顯示 no-write proof。
- 顯示 kill switch。
- 顯示 rollback。
- 仍不得寫 production data。
- 仍不得產生買賣指令。

### V42 First Real Authorized Source Review

- 只能在 V38 全部 CRITICAL review items PASS 後討論。
- 只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。
