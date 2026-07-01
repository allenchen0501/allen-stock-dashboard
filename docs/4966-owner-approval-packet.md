# 4966 Owner Approval Packet

4966 譜瑞核准包。

## Purpose

- 準備 4966 譜瑞成為下一檔 read-only manual-refresh 候選標的。
- 本文件只是 owner approval packet。
- 本版不代表 4966 已核准。
- 本版不代表 4966 可抓真實行情。
- 本版不新增 4966 live fetch。
- 本版不新增 4966 endpoint。
- 本版不新增 4966 War Room button。
- 本版不切 `/api/portfolio`。
- 本版不接 Supabase。
- 本版不接 broker。
- 本版不下單。
- 本版不自動交易。

這是 owner approval packet / channel verification preparation / fixture-only governance prep，
不是 live-fetch expansion、不是開第二檔、不是正式行情全切。

## Current State

```ts
currentApprovedLiveFetchSymbols = ["3019"];
currentApprovedChannels = ["tse_3019.tw"];
approvedProvider = "TWSE_TPEX";
```

4966 目前狀態（本版必須維持）：

| 欄位 | 值 |
|------|-----|
| symbol | 4966 |
| nameZh | 譜瑞 |
| candidateStatus | candidate_only |
| approvalStatus | pending_owner_approval |
| ownerApproved | false |
| approvedChannel | null |
| proposedChannel | tse_4966.tw（proposed / unverified / not approved） |
| channelVerified | false |
| inApprovedLiveFetchSymbols | false |
| hasLiveFetchEndpoint | false |
| hasWarRoomManualRefreshButton | false |
| manualSmokeExecuted | false |
| productionEndpointTested | false |

- 4966 **not approved**、**candidate_only**、**pending_owner_approval**。
- 4966 **not in approvedLiveFetchSymbols**；approvedLiveFetchSymbols 仍只有 3019。
- 4966 **no real fetch**、**no endpoint path**、**no War Room manual refresh button**。

## Per-Symbol Required Evidence Checklist

4966 進入 `approvedLiveFetchSymbols` 前必須完成（缺一不可）：

1. owner approval（Allen 明確書面核准 4966）。
2. channel verification（逐檔驗證 `tse_/otc_` 前綴，channelVerified=true 後才成為 approvedChannel）。
3. per-symbol standalone validator（4966 專屬，不納入 safety-chain）。
4. manual-refresh-only endpoint 行為（預設 page load 不 fetch）。
5. read-only（不下單、不寫 DB、不切 production）。
6. non-approved rejection case（他檔 symbol 被拒且不 fetch）。
7. missing mode / auto mode rejection case（缺 mode / mode=auto 被拒且不 fetch）。
8. manual smoke evidence（實測 LIVE_FETCH_OK，或如實記錄 fallback / timeout / source_error）。
9. production endpoint evidence（production URL 實跑並記錄 actual response）。
10. 全部完成且 owner 核准後，才可將 4966 加入 approvedLiveFetchSymbols。

## Future Manual Smoke Plan（僅規劃，本版不執行）

- 本版**不執行** 4966 smoke、**不打** 4966 真實行情。
- 步驟一：owner 核准後，於本機以 approved provider 對 4966 執行一次唯讀 dry-run（GET only、timeout 3000ms、maxRetries 0）。
- 步驟二：記錄 outcome（LIVE_FETCH_OK 或 fallback / timeout / source_error），不假造價格（price 不可得則為 null）。
- 步驟三：標示為 manual smoke，不納入 safety-chain。

## Future Production Endpoint Cases（僅定義，本版不執行）

- 本版**不打** 4966 production endpoint。
- Case A：`GET /api/war-room/approved-live-quote?symbol=4966&mode=manual` → 核准後 read-only fetch（live_verified 或如實 fallback）；核准前不得建立此路徑。
- Case B：`symbol=<其他>&mode=manual` → non-approved symbol rejected without fetch。
- Case C：`symbol=4966`（缺 mode）→ rejected without fetch。
- Case D：`symbol=4966&mode=auto` → rejected without fetch。

## Owner Approval Record Schema（僅定義結構，尚未填入 / 尚未核准）

必須包含：approvedSymbol（= 4966）、approvedChannel（channelVerified 後填入）、approvedBy（Allen owner）、
approvedAtIso、decision（approved / rejected）、scope（read-only、manual-refresh-only）、
evidenceRefs（manual smoke + production endpoint evidence 連結）。recordPopulated=false、ownerApproved=false。

## Owner Approval Required Statement

需 Allen owner 明確書面核准：

> 「我同意 4966 譜瑞進入 read-only manual-refresh 唯讀擴充流程，僅限 approved provider、
> manual-refresh-only、read-only，不切 /api/portfolio、不下單、不自動交易。」

核准前 4966 一律維持 candidate_only。核准後才能進入下一版：**4966 Read-Only Manual-Refresh MVP**。

## Red Lines / Safety Boundary

- approved live-fetch symbols remain exactly ["3019"]。
- 4966 must NOT be added to approvedLiveFetchSymbols（本版不加入）。
- 4966 must NOT be added to the runtime approved set。
- no 4966 live-fetch endpoint、no 4966 War Room manual refresh button（本版不新增）。
- no 4966 smoke executed、no 4966 production endpoint called（本版不執行）。
- no Yahoo、no new provider、no new TPEx channel added to the runtime approved set。
- no provider runtime change。
- no /api/portfolio switch。
- no Supabase。
- no process.env。
- no DB write。
- no broker API。
- no buy/sell command、no actionSignal、no auto order。
- no production data switch、not production trading ready。
- this packet is not an approval, not a live-fetch expansion, not a trading signal, not
  buy/sell advice, not an order, not auto trading。
- 本版 validator not in safety-chain；safety-chain remains 22 checks。
- 不因 3019 成功就直接擴大到 4966。
