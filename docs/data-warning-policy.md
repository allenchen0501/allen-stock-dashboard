# Data Warning Policy

任何來源不一致、資料過期、single-source 或校驗未完成的輸出，都必須攜帶結構化 `data_warning`。V3-4.5 只定義契約，不修改目前 API 或 UI。

## 必須產生 data_warning 的情況

- Source validation 結果為 WARNING 或 FAIL。
- 台股只有 Yahoo／Priority 3，尚無 TWSE／TPEx 校驗。
- 價格或成交量超過雙來源差異門檻。
- 使用上一交易日或超過 freshness threshold 的資料。
- official close 尚未公布、資料 session 未完成或 comparison unavailable。
- symbol mapping、幣別、adjusted price 或 volume unit 有疑問。

## 建議 contract

```json
{
  "data_warning": {
    "level": "WARNING",
    "blocking": true,
    "codes": ["SOURCE_DIVERGENCE"],
    "message": "官方與輔助來源價格不一致，暫停方向性建議。",
    "record_date": "YYYY-MM-DD",
    "primary_source": "TWSE",
    "secondary_source": "Yahoo Finance",
    "difference_percent": 1.25,
    "validated_at": "ISO-8601 timestamp"
  }
}
```

- PASS：`data_warning` 可為 `null`。
- WARNING：必須有 warning，`blocking` 依用途為 true；作純 reference 展示時仍需可見。
- FAIL：必須有 warning 且 `blocking = true`，數值不得標成 decision-ready。

## 禁止輸出方向性建議

來源不一致或 validation 非 PASS 時，前端、API 與 War Room Engine 禁止輸出：

- 買進
- 賣出
- 加碼
- 減碼
- 任何等價的方向性建議、信號或暗示

這項禁止包含按鈕 label、卡片標題、AI summary、push notification、排序理由與隱含色彩語意。不能只顯示 warning，旁邊仍保留舊的交易動作。

## 允許的中性文字

- 「資料來源校驗中」
- 「目前僅有輔助來源」
- 「資料已過期，僅供參考」
- 「來源差異超過門檻，暫停策略判斷」
- 「等待 TWSE／TPEx 官方資料」

不得用「偏多」「偏空」「機會」「風險可控」等語句繞過禁止規則。

## 顯示與傳遞規則

`data_warning` 必須由 server use case 一路傳到 API contract 與 UI view model，不可在 mapper 中丟失。UI 未支援 warning contract 前，不得切換到新 Portfolio API。

Warning 顯示需包含：狀態、原因、資料日期、primary source、最後校驗時間。顏色不是唯一提示；FAIL 數值若保留供診斷，必須與正常 Portfolio 數值視覺隔離，且不參與排名、評分或建議。

## AI 與快取

- AI summary 只能讀取 PASS 決策資料；WARNING／FAIL 可以被摘要為資料狀態，但不能生成交易動作。
- 快取必須包含 validation status 與 warning，不得只快取數值。
- 新資料 FAIL 時，不可用舊 PASS 數值冒充今日資料；可以顯示舊值，但必須改成 stale warning 並保留原 record date。

