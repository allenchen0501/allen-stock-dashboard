# Intraday Risk Crisis Alert Spec

本文件定義 Allen Stock Dashboard 的**盤中風險危機告警系統**（Intraday Risk Crisis Alert）規格。
本規格是 `docs/war-room-intelligence-architecture.md` 中 Intraday Alert Engine 的細化文件。

**本階段（V18F）只做規格、型別合約與 fixture-only checker。
不接資料源、不寫資料、不推播、不新增 API route、不新增 UI component、
不連 Supabase、不新增 SQL migration、不寫入資料、不產生買賣指令。**

相關文件：
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)、
[Portfolio Valuation Formula](./portfolio-valuation-formula.md)、
[Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的盤中風險危機告警系統。
- 目標是事件驅動型警報，不是定時報告。
- 警報用途是提醒風險與觀察條件，不是自動交易。
- 本階段只做 spec，不接資料源、不寫資料、不推播。
- 本規格是 `docs/war-room-intelligence-architecture.md` 中 Intraday Alert Engine 的細化文件。
- 警報系統不替代 Allen 的風控決策，也不會自動下單。
- 所有警報僅為資訊提醒，不構成投資建議，不是買賣指令。

---

## B. Runtime Limitation

本階段限制如下：

- ChatGPT Tasks 不能可靠做到每分鐘監控。
- 網站後端 / worker / cron 才適合做 1 分鐘行情抓取。
- V18F 不實作 runtime。
- V18F 不建立 cron。
- V18F 不建立推播。
- V18F 不新增 API route。
- V18F 不新增 UI component。
- V18F 不連 Supabase。
- V18F 不新增 SQL migration。
- V18F 不寫資料。
- V18F 不產生買賣指令。

實作 runtime 的時機與規格，由後續 V19（Intraday Alert Engine Contract）至 V22（Push Notification）規劃。

---

## C. Data Source Candidates

未來可能資料源（依優先順序）：

1. **Official source first**：TWSE / TPEx 官方行情（最高信任）。
2. **Validated secondary source**：Yahoo 股市、FinMind（需交叉驗證）。
3. **Fallback / cached source**：TradingView / yfinance-like adapters、broker API、本地 fallback cache。
4. **Conflict → WARNING / DATA_INSUFFICIENT**：若資料源衝突，降級為 WARNING 或 DATA_INSUFFICIENT。

資料來源規則：

- Yahoo / yfinance-like 資料不得作為唯一正式來源。
- 若資料源衝突，不得直接觸發高風險警報。
- dataQualityStatus 非 PASS 時，alertLevel 必須保守。
- fallback-only data 不得獨立觸發 DANGER。
- stale data 不得觸發 DANGER。
- 若資料無法驗證來源，最多觸發 WARNING，不得觸發 DANGER。
- 所有推播（未來版本）需包含資料來源與時間戳。

---

## D. Alert Scope

定義四大類警報：

1. **大盤急跌警報**：加權指數短時間急跌，影響市場整體。
2. **大盤急漲警報**：加權指數短時間急拉，可能廣度背離。
3. **持股急跌警報**：Allen 持股 / 觀察股短時間急跌，可能觸及防守區。
4. **持股急漲警報**：Allen 持股 / 觀察股短時間急漲，可能突破壓力。

預留觀察類別：

- 支撐跌破
- 壓力突破
- 成交量異常
- 上漲家數 / 下跌家數惡化
- 權值股護盤但市場廣度不佳
- 族群同步轉弱
- 族群急拉但廣度背離

---

## E. Market Crash Alert Rules

大盤急跌條件（僅為風險提醒，不等於出場或放空）：

| 條件 | alertLevel |
|---|---|
| 5 分鐘內跌超過 150 點 | WATCH |
| 5 分鐘內跌超過 250 點 | WARNING |
| 5 分鐘內跌超過 400 點 | DANGER |
| 15 分鐘內跌超過 500 點 | DANGER |
| 開高後跌破昨收 | WARNING |
| 成交量急放大但指數走低 | WARNING |
| 上漲家數 / 下跌家數低於 1:3 | WARNING 或 DANGER |

重要邊界：

- 這些條件只觸發風險提醒，不等於出場或放空。
- DANGER 觸發需要資料來源為 PASS，單一 fallback / stale data 不得觸發 DANGER。
- 盤中大盤急跌不等於個股一定跌停，需配合廣度與族群判斷。

---

## F. Market Surge Alert Rules

大盤急漲條件：

| 條件 | alertLevel |
|---|---|
| 5 分鐘急拉 150 點 | WATCH |
| 5 分鐘急拉 250 點 | WARNING |
| 從低點反彈超過 300 點 | WARNING |
| 指數翻紅但下跌家數仍遠大於上漲家數 | WATCH（廣度背離提醒） |
| 權值股急拉但中小型股未跟上 | WARNING |

重要邊界：

- 大盤急漲不等於全面轉強，可能只是權值股護盤。
- 廣度背離提醒不是追價指令。
- 急漲後需觀察成交量與廣度，才能判斷是否持續。

---

## G. Holding Crash Alert Rules

針對 Allen 目前關注 / 持股：

- **3019 亞光**
- **4966 譜瑞**
- **2743 山富**

通用急跌條件：

| 條件 | alertLevel |
|---|---|
| 3 分鐘內跌超過 2% | WATCH |
| 5 分鐘內跌超過 3% | WARNING |
| 成交量放大且價格創低 | WARNING |
| 跌破成本 | WARNING |
| 跌破 5MA / 10MA / 20MA | WATCH 或 WARNING |
| 跌破關鍵支撐 | 依支撐等級判斷 |

指定防守區（alert trigger reference，不是停損指令）：

### 亞光（3019）

| 防守價 | alertLevel |
|---|---|
| 跌破 160 | WATCH |
| 跌破 157 | WARNING |
| 跌破 153 | DANGER |

### 譜瑞（4966）

| 防守價 | alertLevel |
|---|---|
| 跌破 680 | WATCH |
| 跌破 665 | WARNING |
| 跌破 652 | DANGER |

### 山富（2743）

| 防守價 | alertLevel |
|---|---|
| 跌破 67 | WATCH |
| 跌破 65 | WARNING |
| 跌破 63 | DANGER |

重要邊界：

- 以上價格是 alert trigger reference，不是停損指令，不得自動下單。
- DANGER 觸發須資料品質 PASS，且不得僅由單一 fallback source 觸發。
- 跌破防守區只提醒一次，除非 alertLevel 升級才重新提醒（cooldown / dedup 詳見 Section M）。

---

## H. Holding Surge Alert Rules

持股急漲條件：

| 條件 | alertLevel |
|---|---|
| 5 分鐘急漲 3% | WATCH |
| 爆量突破 | WARNING |
| 突破壓力區 | WATCH |
| 站回成本 | WATCH |
| 站回前高 | WARNING |

重要邊界：

- 急漲警報不是追價指令，只是提醒檢查續抱 / 減碼觀察 / 突破確認等條件。
- 急漲警報不等於全面轉強，需配合廣度與族群確認。
- `suggestedObservation` 欄位可描述「續抱 / 減碼觀察 / 突破確認」等觀察行為，但不得寫成明確買賣指令。

---

## I. Sector Alert Rules

Allen 觀察族群：AI、光通、PCB、散熱、CPO、記憶體、機器人。

族群警報條件：

| 條件 | alertLevel |
|---|---|
| 族群同步急跌 | WARNING |
| 族群內龍頭弱於大盤 | WARNING |
| 族群急拉但只有權值股或單一龍頭支撐 | WATCH（廣度背離提醒） |
| CPO / 光通 / PCB / AI Server / 散熱族群同步轉弱 | WARNING（持股風險提高） |
| 族群資料不足 | DATA_INSUFFICIENT |

重要邊界：

- 不得使用族群急拉作為追價指令。
- 族群廣度背離只是提醒，不是出場信號。
- CPO / 光通 / PCB / AI Server / 散熱族群同步轉弱 → 持股風險提高，但不直接等於出場指令。

---

## J. Alert Levels

定義 `alertLevel`：

| alertLevel | 中文 | 說明 |
|---|---|---|
| `INFO` | 資訊 | 一般觀察，低優先 |
| `WATCH` | 注意 | 值得關注，但無緊急行動 |
| `WARNING` | 警戒 | 需要評估風險，提高警覺 |
| `DANGER` | 危險 | 高風險事件，需即時評估 |
| `DATA_INSUFFICIENT` | 資料不足 | 資料品質不足，無法判斷 |

- DANGER 觸發需多資料源確認，且 `dataQualityStatus` 必須 PASS。
- DATA_INSUFFICIENT 出現時，顯示資料不足，不得偽造結論。

---

## K. Alert Payload Contract

未來 alert payload 欄位定義（詳見 `use-cases/intraday-alert/intraday-alert-contract.ts`）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `alertId` | string | 唯一識別碼 |
| `createdAt` | string | ISO 8601 時間戳 |
| `marketSession` | enum | PRE_MARKET / INTRADAY / POST_MARKET / CLOSED |
| `alertLevel` | IntradayAlertLevel | INFO / WATCH / WARNING / DANGER / DATA_INSUFFICIENT |
| `alertType` | IntradayAlertType | MARKET_CRASH / MARKET_SURGE / HOLDING_CRASH / HOLDING_SURGE / … |
| `scope` | IntradayAlertScope | MARKET / HOLDING / WATCHLIST / SECTOR |
| `symbol` | string \| null | 股票代碼（大盤警報為 null） |
| `stockName` | string \| null | 股票名稱 |
| `sectorName` | string \| null | 族群名稱 |
| `marketIndex` | string \| null | 指數名稱（如 TWSE） |
| `currentPrice` | number \| null | 目前股價 |
| `currentIndex` | number \| null | 目前指數點位 |
| `changePoints` | number \| null | 變動點數（正 = 漲，負 = 跌） |
| `changePercent` | number \| null | 變動百分比 |
| `windowMinutes` | number \| null | 觀察時間窗口（分鐘） |
| `triggerReason` | string | 觸發原因說明 |
| `impactSummary` | string | 影響摘要 |
| `holdingImpact` | string \| null | 持股影響說明 |
| `suggestedObservation` | string | 觀察建議（不得包含明確買賣指令） |
| `dataQualityStatus` | IntradayAlertDataQualityStatus | PASS / WARNING / FAIL / DATA_INSUFFICIENT |
| `sourceMode` | enum | spec_only / fixture / runtime_candidate |
| `sourceName` | string \| null | 資料來源名稱 |
| `requestPerformed` | boolean | 是否發出 HTTP request |
| `supabaseConnected` | boolean | 是否連接 Supabase |
| `productionWritePerformed` | boolean | 是否寫入生產資料 |

重要邊界：

- `suggestedObservation` 不得包含明確買賣指令。
- `requestPerformed`、`supabaseConnected`、`productionWritePerformed` 在 spec-only 與 fixture 階段均為 `false`。

---

## L. Alert Message Format

中文格式範例：

```text
🔴 盤中急跌警報｜10:19

加權指數 47636，5 分鐘急跌超過 300 點。
下跌家數 761，大於上漲家數 234，市場偏弱。

影響：
AI / 光通 / PCB 高位階股短線風險升高。

持股提醒：
亞光接近 155～157 防守區。
譜瑞測試 660～665 防守區。
山富觀察 67 是否跌破。

觀察建議：
不追反彈，先觀察 10:30 是否站回 47700。
```

禁止在訊息中使用：

- 推薦買進
- 明確賣出
- 立即進場
- 自動下單

---

## M. Cooldown / Dedup Rules

未來 runtime 必須遵守：

- 同一 symbol + alertType + trigger level 於 5～10 分鐘內不得重複推送（cooldown）。
- alertLevel 升級才可重新提醒（dedup 解除條件：只有升級才重發）。
- stale data 不得觸發 DANGER。
- fallback-only data 不得獨立觸發 DANGER。
- 若資料源衝突，最多 WARNING。
- 同一防守區跌破只提醒一次，除非再次升級。
- 盤中開盤前 3 分鐘可設定觀察緩衝，避免 opening noise。
- 收盤前 5 分鐘可降低重複提醒頻率。

cooldown 與 dedup 規則僅為未來 runtime 規格，V18F 不實作。

---

## N. Safety Boundary

明確安全邊界：

- 警報不是投資建議。
- 警報不是買賣指令。
- 不自動下單。
- 不替代風控。
- dataQualityStatus 非 PASS 時不得升級到 DANGER，除非多資料源確認。
- Yahoo / fallback source 單一來源不得觸發最高等級警報。
- 所有推播（未來版本）需包含資料來源與時間戳。
- War Room Read Model 只能顯示 Intraday Alert Engine 輸出，不得自行升級警報。
- 不是買賣指令，也不替代 Allen 的交易判斷。

平文摘要（checker 掃描用）：

不自動下單。不是買賣指令。dataQualityStatus 非 PASS 時不得升級到 DANGER。Yahoo / yfinance-like 資料不得作為唯一正式來源。fallback-only data 不得獨立觸發 DANGER。stale data 不得觸發 DANGER。

---

## O. Future Implementation Gate

未來版本規劃（roadmap 僅為架構規劃，不代表本輪實作）：

### V19 Intraday Alert Engine Contract
- 建立 fixture-only pure function。
- 輸入 quote windows / market breadth / holding references。
- 輸出 `IntradayAlertPayload[]`。
- 不接 runtime。

### V20 Intraday Alert UI
- 網站顯示警報中心。
- 不推播。

### V21 Intraday Runtime Pipeline
- 1 分鐘抓取行情。
- 仍需 source validation。

### V22 Push Notification
- Telegram / LINE / Email。
- 需 cooldown / dedup / silent window。
