# Data Source Validation

V3-4.5 定義 Portfolio API 切換前的來源驗證 gate。來源順位只決定 baseline 與 fallback，不能取代 V3-3.5 的必要欄位、新鮮度、數值與雙來源驗證。

## 資料來源優先權

### Priority 1：官方來源

- TWSE OpenAPI
- TPEx OpenAPI
- TWSE ISIN

TWSE／TPEx 是台股價格、成交量與市場資料的官方來源；TWSE ISIN 只負責股票主檔與上市狀態，不是行情來源。

### Priority 2：輔助來源

- Yahoo Finance

Yahoo 可提供盤中輔助、fallback 與交叉校驗。台股 Portfolio 名單仍只能來自 `portfolio_stocks`，台股 official close 也不能只靠 Yahoo 宣稱已完成官方校驗。

### Priority 3：其他免費來源

只有在來源免費公開、允許自動化使用、欄位／單位明確且通過審核後才可加入。Priority 3 只能作 secondary／reference，不能無聲升級成台股 official source。

## 驗證結果

### PASS

同時符合：

- symbol、value、record date/time、source name/type/confidence、inference flag 完整。
- 日期與交易 session 合法，且 freshness 符合當前 use case。
- 台股 official close 來自對應市場的 TWSE 或 TPEx。
- 數值通過合理範圍與單位正規化。
- Secondary comparison 可用，且價格差異不超過 1%、成交量差異不超過 5%。
- Data Quality status 為 `valid`。

PASS 可成為決策引擎輸入，但仍需保留來源與校驗 metadata。

### WARNING

任一情況成立：

- 只有 Priority 2／3 可用，尚無 Priority 1 校驗。
- Priority 1 完整有效，但 secondary 暫時不可用，無法做雙來源比較。
- 資料為 `stale`，或是上一交易日 official close 被用在盤前參考。
- 來源可用但市場 session 尚未結束，值不是 official close。
- 免費來源的 confidence、symbol mapping 或 adjusted 定義仍需確認。

WARNING 只能作 reference，必須輸出 `data_warning`，不得作方向性買賣建議主依據。

### FAIL

任一情況成立：

- 缺少日期、時間、來源、symbol、value 或 inference flag。
- Data Quality status 為 `invalid` 或 `suspicious`。
- 價格差異大於 1% 或成交量差異大於 5%。
- timestamp 超出允許的未來偏移，或 record date 與宣稱 session 不符。
- 價格小於等於 0、成交量為負，或單位無法確認。
- 台股值只有 Yahoo／其他免費來源，卻被標成 official close。
- 模型輸出未設 `is_model_inference = true`。

FAIL 不得進入 War Room 決策或 Portfolio decision-ready response；應隔離、記錄 issue、重試或等待人工確認。

## Data Quality 對應

| Data Quality | Source validation 上限 | 決策處理 |
| --- | --- | --- |
| `valid` + Priority 1 | PASS | 可進決策 |
| `valid` + Priority 2／3 | WARNING | Reference only |
| `stale` | WARNING | Reference only |
| `suspicious` | FAIL | 阻擋 |
| `invalid` | FAIL | 阻擋 |

source confidence 不可平均掉 FAIL。官方 100 與 Yahoo 70 若差異超門檻，結果仍是 FAIL；應檢查 session、除權息、單位與 parser，而不是把 confidence 算成 85 後放行。

## 最低驗證紀錄

每次驗證需保存：symbol、metric、primary／secondary source、各自 record time、fetched time、value、unit、difference percentage、Data Quality status、PASS／WARNING／FAIL、issues、validated time 與 validator version。

缺少 secondary 時要明確保存 `comparison_available = false`，不能建立假的 0% 差異。
