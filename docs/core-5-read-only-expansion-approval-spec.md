# Core 5 Read-Only Expansion Approval Spec

核心 5 檔唯讀擴充核准規格。

## Purpose

- 定義核心 5 檔唯讀行情擴充前的 owner approval 流程。
- 定義每一檔股票正式進入 `approvedLiveFetchSymbols` 前必須完成的驗證。
- 目前只有 3019 已核准。
- 4966 / 5347 / 4979 / 2455 尚未核准。
- 本版不新增任何 live fetch symbol。
- 本版不切正式行情全切。
- 本版不切 `/api/portfolio`。
- 本版不接 Supabase。
- 本版不接 broker。
- 本版不下單。
- 本版不自動交易。

這是 approval governance spec / read-only expansion preparation，不是開第二檔、不是擴股票池、
不是 live-fetch expansion。

## Current Approved State

```ts
approvedLiveFetchSymbols = ["3019"];
approvedChannels = ["tse_3019.tw"];
approvedProvider = "TWSE_TPEX";
```

- runtime 目前只有 3019 已核准且完成 production endpoint verification（Case A live_verified、
  Case B/C/D rejected without fetch）。
- 本規格中的 candidate symbols 與 proposed channels 皆為 **spec-only**，未進入 runtime approved set。

## Core 5 Candidate Mapping Table

| symbol | nameZh | proposedChannel | channelVerified | approvalStatus | inApprovedLiveFetchSymbols |
|--------|--------|-----------------|-----------------|----------------|----------------------------|
| 3019 | 亞光 | tse_3019.tw | true | approved | true |
| 4966 | 譜瑞 | tse_4966.tw | false | pending_owner_approval | false |
| 5347 | 世界 | tse_5347.tw | false | pending_owner_approval | false |
| 4979 | 華星光 | otc_4979.tw | false | pending_owner_approval | false |
| 2455 | 全新 | tse_2455.tw | false | pending_owner_approval | false |

- 只有 3019 為 approved 並在 approvedLiveFetchSymbols。
- 4966 / 5347 / 4979 / 2455 皆為 `pending_owner_approval`，**不得**加入 approvedLiveFetchSymbols。
- proposedChannel 的 `tse_` / `otc_` 前綴屬候選值，需逐檔 owner 驗證後才 `channelVerified=true`；
  在驗證與核准前，proposed channel 不得寫入 provider / route / MVP contract / runtime approved 集合。

## Per-Symbol Required Evidence Checklist

每一檔股票在進入 `approvedLiveFetchSymbols` 前，必須完成以下全部項目（缺一不可）：

1. owner approval（Allen 明確書面核准該檔）。
2. approved channel（逐檔驗證 `tse_/otc_` 前綴，channelVerified=true）。
3. per-symbol standalone validator（不納入 safety-chain）。
4. manual-refresh-only endpoint 行為（預設 page load 不 fetch）。
5. read-only（不下單、不寫 DB、不切 production）。
6. non-approved rejection case（他檔 symbol 被拒且不 fetch）。
7. missing mode / auto mode rejection case（缺 mode / mode=auto 被拒且不 fetch）。
8. manual smoke evidence（實測 LIVE_FETCH_OK，或如實記錄 fallback / timeout / source_error）。
9. production endpoint evidence（production URL 實跑並記錄 actual response）。
10. 加入 approvedLiveFetchSymbols 前需全部完成（未完成不得加入）。

## Owner Approval Gate

- required：每一檔都必須 Allen owner approval。
- 未核准前不得進入後續 gate、不得加入 approvedLiveFetchSymbols、不得對該檔 live fetch。

## Manual Smoke Gate

- required：每一檔都必須先完成 manual smoke evidence。
- smoke 失敗只記錄 fallback / timeout / source_error / not_available，**不假造價格**（price=null）。

## Production Endpoint Case Gate

- required：每一檔都必須完成 production endpoint evidence（四案實跑並記錄 actual response）。
- Case A：approved symbol + mode=manual → read-only fetch（live_verified 或如實 fallback）。
- Case B：non-approved symbol + mode=manual → rejected without fetch。
- Case C：approved symbol 缺 mode → rejected without fetch。
- Case D：approved symbol + mode=auto → rejected without fetch。

## Future Approval Workflow

1. owner approval gate：Allen 明確核准該檔進入唯讀擴充流程。
2. channel verification：逐檔確認 approved channel（`tse_/otc_` 前綴）並設 channelVerified=true。
3. per-symbol validator：新增該檔 standalone validator（不納入 safety-chain）。
4. manual smoke gate：執行 manual smoke，記錄 LIVE_FETCH_OK 或 fallback/timeout/source_error（不假造價格）。
5. production endpoint case gate：production URL 實跑 approved / non-approved / missing-mode / auto-mode 四案並記錄。
6. approved set 加入：全部 gate 通過後，才可將該檔加入 approvedLiveFetchSymbols（仍 manual-refresh-only、read-only）。

在 workflow 全部完成前，該檔一律維持 `pending_owner_approval`，且 approvedLiveFetchSymbols 維持只有 3019。

## Red Lines / Safety Boundary

- approved live-fetch symbols remain exactly ["3019"]。
- 4966 / 5347 / 4979 / 2455 must NOT be added to approvedLiveFetchSymbols（本版不加入）。
- no Yahoo。
- no new provider。
- no new TPEx channel added to the runtime approved set（proposed channel 僅存在於本規格）。
- no provider runtime change。
- no Supabase。
- no process.env。
- no DB write。
- no broker API。
- no buy/sell command。
- no actionSignal。
- no auto order。
- no production data switch。
- no /api/portfolio switch。
- not production trading ready。
- this spec is not a live-fetch expansion, not a trading signal, not buy/sell advice, not an
  order, not auto trading。
- 本版 validator not in safety-chain；safety-chain remains 22 checks。
- 不因 3019 成功就直接擴大到 core 5。
