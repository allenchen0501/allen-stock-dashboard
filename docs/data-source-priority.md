# Data Source Priority

資料來源優先級用來決定 primary baseline、fallback 與衝突處理，不代表高順位資料可跳過完整性與新鮮度驗證。所有來源都必須經過 V3-3.5 Data Quality Layer。

## 台股

1. **TWSE／TPEx**：上市／上櫃行情、成交量、法人、融資融券的官方 primary source。
2. **MOPS**：月營收、財報與重大訊息的官方 primary source；不是股價 fallback。
3. **Yahoo Finance**：台股行情 secondary source，只做交叉驗證與官方暫時不可用時的 reference。
4. **twstock**：盤中低頻 sanity check，只作 reference。

台股價格不得只靠 Yahoo 或 twstock 進入正式收盤價與決策資料。官方資料未到時，可以保留輔助值並標記 single-source／reference-only，但不得冒充已校驗 official close。

## 美股與全球指數

1. **Yahoo Finance**：第一階段主要免費來源。
2. **Nasdaq／官方交易所資料**：可取得相同指標時作官方校驗來源。
3. **其他免費來源**：只在來源、授權、頻率與欄位通過審核後作 secondary/fallback。

全球資料缺乏第二來源時必須保留 single-source 標記。Yahoo 成功回應不等於自動 valid；日期、時區、symbol mapping、數值範圍與 freshness 仍需驗證。

## 按資料領域選 primary

| 領域 | Primary | Secondary／reference | 不可替代原則 |
| --- | --- | --- | --- |
| 上市行情 | TWSE | Yahoo、twstock | TPEx／MOPS 不可代替上市行情 |
| 上櫃行情 | TPEx | Yahoo、twstock | TWSE 上市資料不可錯配市場 |
| 台股法人／融資融券 | TWSE 或 TPEx | 無則保持 pending | Yahoo 不提供等價官方籌碼事實 |
| 股票主檔 | TWSE ISIN | TWSE／TPEx 清單交叉檢查 | 行情來源不可自行創造上市狀態 |
| 月營收／財報／重大訊息 | MOPS | 公司公告僅作人工校驗 | Yahoo 財務摘要不可覆蓋官方申報 |
| 美股／全球指數與商品 | Yahoo | Nasdaq／官方交易所、審核後免費來源 | 不混用不同 session 或 adjusted 定義 |

## 雙來源校驗

1. 先把 symbol、market、currency、price basis、volume unit、record date/time 正規化。
2. 以高順位且通過 freshness validation 的來源為 primary。
3. 價格差異採 `abs(primary - secondary) / primary`；大於 1% 標記 `suspicious`。
4. 成交量差異大於 5% 標記 `suspicious`。
5. 除權息、股票分割、不同交易 session 或成交量單位不一致時，先標示 not-comparable，不能硬算差異。
6. `suspicious`／`invalid` 禁止進 War Room Engine；`stale` 只可作 reference。

source confidence 不採加權平均來「抵銷」異常。官方 100 與 Yahoo 70 發生大幅差異時，應隔離 Yahoo 或等待官方更正，不得算成 85 後放行。

## Fallback 規則

- Primary timeout：依固定重試政策重試，不立即升級 secondary 為 official。
- Primary 零筆或 schema mismatch：停止該 dataset load，保留上次成功版本並告警。
- Secondary timeout：primary 可在自身完整且合法時入庫，但保留 comparison unavailable 標記；是否能進決策由 use case 決定。
- 兩來源皆失敗：不發布新版本，不把舊資料改寫成今日。
- 來源長期不穩定或改為付費：停用 connector，重新審核替代來源。

## MOPS 排名的解讀

「台股第 2 順位 MOPS」表示在台股資料生態中，企業申報資料優先使用 MOPS；MOPS 不提供可與 TWSE／TPEx 收盤價互換的同類指標。優先級必須在相同 metric 內比較，不能跨領域 fallback。

