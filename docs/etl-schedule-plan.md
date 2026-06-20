# ETL Schedule Plan

所有排程時間使用 `Asia/Taipei`。V3-3.6 只定義計畫，不建立 scheduler、Python job 或 production credential。

## 每日排程

| 時間 | 工作 | 主要來源 | 預期產出 | 品質／失敗規則 |
| --- | --- | --- | --- | --- |
| 08:00 | 盤前戰情室 | 上一交易日 TWSE／TPEx official close、最新 MOPS、隔夜 Yahoo 全球資料 | 盤前 market context 與 report draft | 上一交易日收盤必須標示實際日期；全球資料過期則降級，不產生假今日價 |
| 12:00 | 盤中快照 | TWSE／TPEx 可用公開盤中資料、低頻 twstock reference | `stock_snapshots`／`market_snapshots` 候選資料 | twstock 不可高頻輪詢或成為唯一來源；異常只告警，不覆蓋 official history |
| 14:30～15:30 | 官方收盤價校驗 | TWSE／TPEx OpenAPI，Yahoo 僅 secondary | `daily_prices`（規劃）、已驗證 stock／market snapshots | 價差 >1% 或量差 >5% 隔離；官方尚未發布時延遲重試，不用 Yahoo 冒充官方值 |
| 20:00 | 營收與籌碼更新 | MOPS、TWSE／TPEx 法人及融資融券 | monthly revenue、fundamental、chip snapshots（皆規劃） | 公告更正保留版本；部分 dataset 未發布時個別 pending，不讓整批偽裝完整 |
| 23:00 | 全球市場更新 | Yahoo Finance；可用官方資料 secondary | global market snapshots，供隔日盤前 | 依市場 session／時區標記日期；休市或尚未收盤不得當作完整日資料 |

## Job 依賴

```text
collect source
      ↓
save run metadata / raw checksum
      ↓
normalize symbol, unit, currency and Taipei timestamp
      ↓
validate required fields and freshness
      ↓
compare sources when available
      ↓
upsert staging / target table
      ↓
verify counts and publish dataset version
      ↓
allow War Room composer to consume
```

War Room 只能依賴已發布 dataset version；不能因 08:00 report deadline 而跳過 23:00 全球資料或上一交易日收盤資料的品質狀態。

## 交易日與休市

- 排程先讀台灣與全球市場 calendar，再決定 job 是交易日、休市日或補班交易日。
- 台股休市時，12:00 與 14:30 工作可改為 metadata health check，不產生零成交假行情。
- 美股休市或夏令時間切換時，23:00 job 可能只取得盤中值；必須標記 session，不得當作收盤價。
- 颱風停市、臨時休市與來源延遲需透過 calendar override 處理，不在程式中硬編固定星期。

## Retry 與截止時間

- 網路 timeout／5xx：建議 5、15、30 分鐘 exponential backoff，最多三次。
- schema mismatch、解析零筆、必要欄位缺失：不盲目重試；立即 quarantine 並告警 parser owner。
- 14:30 官方資料尚未完成：可在 15:00、15:30 重試；仍失敗則保留上一版並將當日狀態標為 incomplete。
- 20:00 MOPS／籌碼未公告：依 dataset 個別重試，不阻塞已完整的其他 dataset。
- 每個 War Room 時段設定 data cutoff；cutoff 後才到的資料進下一版，不回頭無聲改寫已發布報告。

## Idempotency 與併發

每個 job 使用 `{job_name}:{business_date}:{scheduled_slot}` 作 run key。相同 key 同時只允許一個 active run；重跑使用相同資料唯一鍵 upsert，但保留 attempt 與 checksum。不同排程不得同時改寫同一 published version，publish 必須在完整性檢查後原子切換。

## 每次執行的最低紀錄

- job／run／attempt ID。
- scheduled time、business date、source timestamp、started／finished time。
- fetched、parsed、valid、stale、suspicious、invalid、loaded 筆數。
- primary／secondary 比對覆蓋率。
- parser version、raw checksum、dataset version。
- retry reason、錯誤摘要與是否阻擋 War Room。

## 初期啟用順序

1. 先以人工觸發 dry run 驗證 TWSE／TPEx official close。
2. 再啟用 14:30～15:30 日價校驗與 `stock_master` 定期同步。
3. 加入 20:00 MOPS／籌碼工作。
4. 加入 23:00 全球資料。
5. 最後啟用 08:00／12:00 戰情室相關工作。

任何階段都先觀察至少數個交易日的筆數、延遲與差異分布，再允許下游 decision-ready；排程「有跑」不代表資料「可用」。

