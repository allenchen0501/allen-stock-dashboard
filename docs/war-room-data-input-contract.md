# War Room Data Input Contract

V8.5 定義 Official Price Pipeline 結果如何進入未來戰情室。此階段只有資料分類，不建立戰情室引擎、不產生買賣建議，也不接 UI、API、Supabase 或網路。

## 分流規則

| Pipeline result | War Room 分流 | decision_allowed | 用途 |
| --- | --- | --- | --- |
| PASS，且允許 decision、無 warning | `primary_inputs` | true | 可作未來決策引擎的主要資料 |
| WARNING | `reference_inputs` | false | 僅顯示背景與人工參考 |
| FAIL | `rejected_inputs` | false | 完全排除決策流程 |

Gate 採 fail-closed：若資料標示 PASS，但 `decision_allowed = false` 或 `data_warning = true`，視為契約不一致並放入 rejected。若 WARNING／FAIL 嘗試把 decision_allowed 設為 true，gate 仍會關閉並記錄 issue。

## Primary input

Primary 必須同時符合：

- Official Price Pipeline status 為 PASS。
- `decision_allowed = true`。
- `data_warning = false`。
- 必要欄位、來源與 official／fallback 比對均已通過。

Primary 只代表資料具備進入未來引擎的資格，不代表買進、賣出、加碼或減碼建議。

## Reference input

WARNING 代表資料仍有可讀價值，但存在價差或品質警訊。Reference 可供人工查看背景，不能影響主要評分、部位比例或交易建議；gate 會強制 `decision_allowed = false` 並建立 data warning。

WARNING 不得產生買賣建議，因為來源之間已存在超過門檻的差異。把這類資料當主要依據會掩蓋行情錯置、時間落差或來源異常。

## Rejected input

FAIL 包含缺 symbol、日期、時間、價格、來源，或 symbol／日期／來源角色不一致。Rejected 不得進入模型、評分、摘要或 fallback decision；它只保留非敏感 issues 供稽核。

FAIL 必須排除，因為以猜測值補齊會讓戰情室把未知資料誤認為已驗證事實。

## Data warning

- Primary 不顯示 data warning。
- Reference 必須顯示「僅供參考，不得產生交易指引」。
- Rejected 必須顯示「已排除決策流程」。
- `data_warnings` 與 `issues` 必須保留 symbol、source、status／code 與 message，但不得包含 key 或持股敏感值。

輸出固定包含 `primary_inputs`、`reference_inputs`、`rejected_inputs`、`data_warnings` 與 `issues`，讓下游不能用單一未分級陣列繞過 gate。
