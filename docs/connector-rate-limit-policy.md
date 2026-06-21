# Connector Rate Limit Policy

V3-6.5 的 timeout 與 rate-limit 是未來 transport contract，不會啟動 timer、retry 或 request。

## 預設值

| Connector | Timeout | 每分鐘上限 | 角色 |
| --- | ---: | ---: | --- |
| TWSE | 10 秒 | 30 | 官方上市收盤資料 |
| TPEx | 10 秒 | 30 | 官方上櫃收盤資料 |
| Yahoo | 8 秒 | 15 | 全球市場／台股 fallback |

正式值仍須在 V7 依官方文件與 staging 觀測調低或調整；contract 值不是繞過來源限制的授權。

## Timeout 與 retry

- Timeout 後必須回傳 typed error，不得無限等待。
- 僅 timeout、429 或暫時性 5xx 可 retry；解析、validation 與權限錯誤不得 retry。
- TWSE／TPEx 最多重試 2 次，Yahoo 最多 1 次，使用 exponential backoff 與 jitter。
- Retry 仍計入 rate limit；不得用多 process 或多 IP 規避限制。

## Fallback

- 台股官方來源 timeout 時，可顯示快取或 Yahoo reference，但必須有 `data_warning`。
- Yahoo fallback 不得把來源標示改成官方，也不得成為台股唯一決策依據。
- Official 與 fallback 價格差異大於 1% 時為 suspicious，禁止進決策。
- Empty、partial 或 stale fallback 不得覆蓋最後一筆已驗證官方資料。

## IP 與高頻風險

過度輪詢可能造成來源封鎖、共享出口 IP 受限、429、資料授權問題或影響其他服務。禁止高頻輪詢、並行爆量、IP rotation、無界 retry 與前端每頁刷新。未來應以排程批次、cache、去重與 single-flight 控制流量。
