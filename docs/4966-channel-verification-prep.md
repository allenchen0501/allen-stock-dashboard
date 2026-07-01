# 4966 Channel Verification Prep

4966 譜瑞通道驗證準備。

## Purpose

- 準備 4966 譜瑞的 approved channel 驗證流程。
- 本版**不驗證完成**、**不核准 channel**、**不寫入 runtime approved set**。
- 4966 的 approvedChannel 目前為 `null`；proposedChannel 為候選、未驗證。

## Proposed Channel（proposed / unverified / not approved）

| symbol | nameZh | proposedChannel | channelVerified | channelStatus |
|--------|--------|-----------------|-----------------|---------------|
| 4966 | 譜瑞 | tse_4966.tw | false | proposed_unverified |

- `tse_4966.tw` 僅為 **proposed** 候選值：譜瑞-KY 為上市股，候選前綴 `tse_`。
- 但 `tse_` / `otc_` 前綴必須逐檔由 owner 實際驗證後才可信；在 channelVerified=true 前，
  proposedChannel **不得**寫入 provider / route / MVP contract / dashboard / runtime approved set。

## Channel Verification Steps（本版僅定義，不執行）

1. owner 確認 4966 掛牌市場（上市 TWSE → `tse_`；上櫃 TPEx → `otc_`）。
2. owner 核准後，於 approved provider 以該 channel 執行一次唯讀 dry-run（GET only、timeout 3000ms、maxRetries 0）。
3. 若回應 schema 正確且 symbol code 相符，記錄為 channelVerified 候選證據（不假造）。
4. 通過後，才將 4966 的 approvedChannel 由 `null` 更新為驗證後的 channel，並設 channelVerified=true。
5. 全部 gate（見 owner approval packet）完成且 owner 核准後，才可加入 approvedLiveFetchSymbols。

## Current Runtime State（本版維持不變）

```ts
approvedLiveFetchSymbols = ["3019"];
approvedChannels = ["tse_3019.tw"];
approvedProvider = "TWSE_TPEX";
```

## Red Lines

- approved live-fetch symbols remain exactly ["3019"]。
- 4966 proposedChannel 未驗證、未核准、不進入 runtime approved set。
- no new TPEx channel added to the runtime approved set（proposed channel 僅存在於本規格文件）。
- no provider runtime change、no /api/portfolio switch、no Supabase、no broker、no auto order、
  no production data switch。
- 本版 validator not in safety-chain；safety-chain remains 22 checks。
