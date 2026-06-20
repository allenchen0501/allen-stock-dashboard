# Data Quality Layer

V3-3.5 在 provider／repository 與戰情室決策之間加入 Data Quality Layer。它不決定買賣，也不替任何來源背書；它負責回答「資料是否完整、是否新鮮、不同來源是否一致、能不能成為決策主依據」。

本階段只建立型別、規則與純驗證函式，沒有修改 provider、API、UI、mock data 或既有資料流。

## 為什麼需要資料品質層

行情 API 與爬蟲可能遇到延遲、休市日誤判、時區錯置、股票代號對應錯誤、除權息未調整、成交量單位不同、cache 過期或上游欄位改版。單一來源即使成功回應，也不代表內容足以支撐今日決策。

資料品質層讓每一筆數值帶著日期、時間、來源、可信度與推論標記流動，並用同一套狀態阻擋異常值進入戰情室決策引擎。

## 必要資料契約

每筆價格、成交量或其他決策數值必須包含：

- `symbol`
- `value`
- `record_date`
- `record_time`
- `source_name`
- `source_type`
- `source_confidence`
- `is_model_inference`

`record_date`／`record_time` 以 `Asia/Taipei` 解讀；`source_confidence` 使用 0～100。缺少日期、時間、來源或必要欄位時一律為 `invalid`，不能用預設值悄悄補成今日資料。

## 資料來源優先順序

### 台股行情

1. TWSE／TPEx 官方資料
2. Yahoo Finance
3. CMoney／Goodinfo／券商資料

### 美股與全球指數

1. Yahoo Finance
2. Nasdaq／官方交易所資料
3. 其他金融資料源

優先順序決定雙來源比較的 primary baseline，不代表第一來源永遠正確。官方來源若過期或缺欄位，同樣會被標記；較低優先來源可以用來確認異常，但 `source_confidence` 高低不能覆蓋 validation failure。

## 雙來源比對

`comparePriceSources(primary, secondary)` 與 `compareVolumeSources(primary, secondary)` 使用：

```text
abs(primary - secondary) / primary
```

- 價格差異 **大於 1%**：`suspicious`。
- 成交量差異 **大於 5%**：`suspicious`。
- 差異剛好等於門檻仍通過。
- 價格必須大於 0；成交量可為 0，但不可為負。
- primary 為 0、secondary 非 0 時無法計算合理比例，直接標為 `suspicious`。
- 比較前兩筆資料仍各自接受必要欄位、時間與模型標記驗證。

成交量比較前必須先由 provider 正規化單位（股、張、ADR 等）。Data Quality Layer 不猜測單位，也不把未正規化數字視為可比。

## 新鮮度規則

預設 quote 過期門檻為 30 分鐘，允許來源時間最多比驗證時間快 5 分鐘以容納時鐘偏差。呼叫端可依盤前、收盤後或歷史分析明確調整 max-age，但不得用放寬門檻掩蓋來源延遲。

- 今日戰情室使用非今日資料：`stale`。
- 今日資料超過 quote max-age：`stale`。
- Weekly review 使用非本週資料：`stale`。
- 歷史分析可使用歷史資料，但仍需完整來源與合法時間。
- 超過容許範圍的未來時間：`suspicious`。

今日、本週與歷史日期一律依 `Asia/Taipei` 判斷；本週以星期一為起點。

## 模型推論標記

原始行情與模型推論不可混為同一種事實。`source_type = "model"` 時，`is_model_inference` 必須為 `true`，否則為 `invalid`。模型產生的目標價、風險分數或摘要必須保留推論標記，即使來源信心度很高也不例外。

## 狀態與處理方式

| 狀態 | 意義 | 戰情室處理 |
| --- | --- | --- |
| `valid` | 欄位完整、時間符合用途、來源比較在門檻內 | 可作決策輸入 |
| `stale` | 格式有效但不夠新 | 僅供參考，不能作買賣建議主依據 |
| `suspicious` | 來源差異過大或時間異常 | 禁止進入決策引擎，等待第二來源或人工確認 |
| `invalid` | 缺欄位、格式錯誤、數值非法或模型未標記 | 丟棄／隔離並記錄 issue |

同一結果有多個 issue 時，狀態優先序為 `invalid > suspicious > stale > valid`。`validateDecisionReady()` 只有在至少有一個結果且全部為 `valid` 時回傳 true。

## 哪些資料不能直接進戰情室

- 沒有 symbol、value、日期、時間或來源。
- source confidence 不在 0～100。
- 價格為 0／負數，或成交量為負數。
- source type 無法識別。
- 模型資料未設 `is_model_inference = true`。
- 價格雙來源差異超過 1%。
- 成交量雙來源差異超過 5%。
- timestamp 明顯位於未來。
- stale 資料被當作今日主要依據。

## 建議資料流

```text
provider raw response
       ↓ normalize symbol / unit / Taipei timestamp
DataQualityRecord
       ↓ validate freshness + required metadata
       ↓ compare primary and secondary sources
DataValidationResult / SourceComparisonResult
       ├─ valid → repository / model input / war-room composer
       ├─ stale → reference-only store and warning
       └─ suspicious or invalid → quarantine, log and retry
```

V3-4 Portfolio Migration 應先在 server use case 將 Yahoo quote 映射成 `DataQualityRecord`，再逐步加入 TWSE／TPEx secondary source。尚未取得第二來源時需明確標示 single-source，不得偽造 comparison result；Portfolio repository 只負責持股設定，不能取代行情品質驗證。

