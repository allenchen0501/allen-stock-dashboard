# 4966 Owner Approval Decision Gate

4966 譜瑞 Owner 核准決策閘門。

## Purpose

- 定義 Allen owner 如何明確核准 4966 譜瑞進入 read-only manual-refresh MVP。
- 本文件只是 approval decision gate。
- 本版不代表 4966 已核准。
- 本版不代表 4966 可抓真實行情。
- 本版不新增 4966 live fetch。
- 本版不新增 4966 endpoint。
- 本版不新增 4966 War Room button。
- 本版不執行 smoke。
- 本版不打 production endpoint。
- 本版不切 `/api/portfolio`。
- 本版不接 Supabase。
- 本版不接 broker。
- 本版不下單。
- 本版不自動交易。

這是 owner approval decision gate / governance evidence gate / fixture-only，不是正式核准 4966、
不是 live-fetch expansion、不是正式行情全切。

## Current State

```ts
currentApprovalStatus = "pending_owner_approval";
ownerApprovalReceived = false;
approvalDate = null;
approvedChannel = null;
inApprovedLiveFetchSymbols = false;

currentApprovedLiveFetchSymbols = ["3019"];
currentApprovedChannels = ["tse_3019.tw"];
approvedProvider = "TWSE_TPEX";
```

- 4966 **not approved**、**pending_owner_approval**。
- 本版 **no endpoint、no War Room button、no smoke executed、no production endpoint called**。
- 4966 **not in approvedLiveFetchSymbols**；approvedLiveFetchSymbols 仍只有 3019。

## Approval Decision States

- `pending_owner_approval`：預設狀態，尚未核准（目前狀態）。
- `approved`：Allen owner 明確提供核准句且含全部安全邊界元素後才成立。
- `rejected`：owner 拒絕或安全邊界不齊；維持不擴充。

## State Transition Rules

- `pending_owner_approval` → `approved`：需 owner 明確提供核准句（含全部 approvalPhraseRequiredElements
  安全邊界元素），ownerApprovalReceived=true。
- `pending_owner_approval` → `rejected`：owner 明確拒絕，或安全邊界元素不齊；4966 不進 approvedLiveFetchSymbols。
- `approved` → （下一版）：核准後**仍需**完成 channel verification + per-symbol validator + manual smoke +
  production endpoint evidence，才可將 4966 加入 approvedLiveFetchSymbols（仍 read-only、manual-refresh-only）。

目前 gate 評估：ownerApprovalReceived=false → resultingStatus=`pending_owner_approval`、nextVersionUnlocked=false。

## Owner Approval Required Phrase（核准句）

Allen owner 必須明確提供以下核准句（或等義且含全部安全邊界元素）：

> 「我同意 4966 譜瑞進入 read-only manual-refresh MVP，僅限 approved provider TWSE_TPEX、
> manual-refresh-only、read-only、預設不 fetch，不切正式持倉 portfolio API、不接 Supabase、
> 不接 broker、不下單、不自動交易。」

### Approval Phrase Required Elements（核准句必含的安全邊界）

1. read-only 唯讀（不下單、不寫 DB）。
2. manual-refresh-only（僅手動刷新，預設 page load 不 fetch）。
3. approved provider only（僅 TWSE_TPEX、approved channel）。
4. 不切正式持倉 portfolio API、不接 Supabase、不接 broker。
5. 不自動交易、不自動下單、不切 production data switch。

## Approval Text Template（模板，尚未核准）

```
[APPROVAL TEMPLATE — NOT YET APPROVED]
approvedBy: Allen owner
approvedAtIso: <填入核准時間>
decision: approved
statement: 我同意 4966 譜瑞進入 read-only manual-refresh MVP …（見上方核准句）
（此為模板，尚未核准；填入並由 owner 明確提供後才生效。）
```

- 這是 **template only**（templateIsApproval=false）。在文件中列出模板**不等於**已核准。

## Preconditions For Next Version（4966 Read-Only Manual-Refresh MVP 前置條件）

1. owner approval received（Allen 明確書面核准句，含全部安全邊界元素）。
2. channel verification（逐檔驗證 `tse_/otc_` 前綴，channelVerified=true 後才成為 approvedChannel）。
3. per-symbol standalone validator（4966 專屬，不納入 safety-chain）。
4. manual smoke evidence（實測 LIVE_FETCH_OK，或如實記錄 fallback / timeout / source_error）。
5. production endpoint evidence（production URL 實跑並記錄 actual response）。

## Post-Approval Remaining Requirements（核准後仍需）

- 核准 ≠ 立即 live fetch：仍需 channel verification 才能填 approvedChannel。
- 核准 ≠ 立即加入 approvedLiveFetchSymbols：仍需 per-symbol validator + smoke + production evidence。
- 核准後仍維持 read-only、manual-refresh-only、預設 page load 不 fetch。
- 核准後仍不切 `/api/portfolio`、不接 Supabase、不接 broker、不下單、不自動交易。

下一版：**4966 Read-Only Manual-Refresh MVP**（nextVersionUnlocked=false，需 owner 核准後才解鎖）。

## Red Lines / Safety Boundary

- approved live-fetch symbols remain exactly ["3019"]。
- 4966 must NOT be added to approvedLiveFetchSymbols（本版不加入）。
- 4966 approvalStatus 不改成 approved、approvalDate 不填、approvedChannel 不填。
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
- this gate is not an approval, not a live-fetch expansion, not a trading signal, not
  buy/sell advice, not an order, not auto trading。
- 本版 validator not in safety-chain；safety-chain remains 22 checks。
