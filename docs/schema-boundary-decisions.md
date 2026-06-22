# Schema Boundary Decisions

本文件釐清三組高度重疊資料表的責任邊界，避免在 V11.6 補齊 `war_room_reports`
之後，繼續以「看起來缺一張表」為由新增彼此重複保存同一份衍生結論的資料表。

本階段（V11.7）只做架構決策，不新增任何 migration、不修改型別、repository、API 或 UI。

對應既有設計請參閱：
[Database Architecture](./database-architecture.md)、
[War Room Architecture](./war-room-architecture.md)、
[ETL Data Contract](./etl-data-contract.md)、
[ETL Source Plan](./etl-source-plan.md)。

---

## 通用原則：單一權威來源（Single Source of Truth）

1. 每一種「衍生結論」只能有一張權威表保存，其他表只能引用（reference）不得各自重算後平行保存。
2. 「可重算的觀測事實」與「模型推論」用 `is_model_inference` 區分，不靠分表硬切。
3. 戰情室 `war_room_items` / `war_room_snapshots` 永遠是 read model，不是任何資料的權威來源；
   它只把上游權威表的結論「複製去展示」，且固定在同一 `input_cutoff_at`。
4. 新增資料表前必須先回答：「這張表是否會與既有表保存同一 `symbol + date` 的同一份結論？」
   若會，則不建，改為擴充既有表或新增關聯欄位。

---

## A. Technical Layer Boundary

### 現況

`technical_signals`（`v85_pro_plus_schema_v2.sql`）目前保存的是**訊號是否觸發**：

- 布林／事件型欄位：`week_30ma_turning_up`、`above_day_200ma`、
  `monthly_deduction_3_low/6_low/3_high/6_high`、`bollinger_squeeze`、`bollinger_expansion`、
  `ma_reversal_signal`、`old_duck_head`、`washout_four_steps`、`volume_breakout`、
  `platform_breakout`、`pullback_support`。
- 少量「判讀結果型」數值：`day_200ma_distance_ratio`（現價相對 200MA 的距離百分比）。

目前**沒有** `technical_snapshots`，原始技術指標數值（MA 值、布林上下軌、KD、MACD、量能均值等）
並未獨立保存；`technical_signals` 是直接從 `stock_snapshots` + `market_*` normalize 後算出布林結果。

### 決策

1. **`technical_signals` 保留為「訊號是否觸發」的布林／事件型事實表。**
   它回答「某 symbol 在某 record_date/time 是否成立某個技術條件」，不負責保存指標原始數值。

2. **未來若新增 `technical_snapshots`，定位為「原始／中間技術指標數值」表**（指標層），
   例如 `ma5/ma10/ma20/ma60/ma120/ma240`、`bollinger_upper/mid/lower`、`kd_k/kd_d`、
   `macd/macd_signal/macd_hist`、`atr`、`volume_ma` 等可重算的數值。

3. **`technical_snapshots` 應作為 `technical_signals` 的上游**：
   `stock_snapshots → technical_snapshots（數值）→ technical_signals（布林觸發）`。
   訊號表的布林結果由指標數值推導，而不是反向。

4. **不得讓兩張表同時保存同一種衍生訊號。**
   - `bollinger_squeeze`（布林是否收斂，boolean）只能在 `technical_signals`。
   - `bollinger_upper/mid/lower`（布林軌道數值）只能在未來的 `technical_snapshots`。
   - `above_day_200ma`（boolean）屬 `technical_signals`；`ma240` 數值屬 `technical_snapshots`。
   - `day_200ma_distance_ratio` 屬「判讀比例」，現階段留在 `technical_signals`；
     若日後 `technical_snapshots` 已保存 `close` 與 `ma240`，此比例可改為由數值即時計算或下放至指標層，二擇一，不得兩表並存同一比例。

#### 應留在 `technical_signals` 的欄位類型

- 布林觸發旗標（是否成立某型態／均線／量價條件）。
- 訊號層級的判讀結果（例如距離比例、是否共振），且不與指標層重複。
- 共用的 `record_*` / `source_*` / `is_model_inference` lineage 欄位。

#### 未來才適合放進 `technical_snapshots` 的欄位類型

- 移動平均、布林軌道、KD、MACD、ATR、量能均值等**連續數值指標**。
- 計算訊號所需的中間值（可重算事實，`is_model_inference = false`）。
- 不放任何「是否觸發」的布林結論——那是 `technical_signals` 的責任。

### 結論

- **暫緩建立 `technical_snapshots`。**
- 原因：
  1. 目前沒有任何真實技術指標寫入流程；`technical_signals` 尚未有實際資料，先建指標層只會多一張空表。
  2. 現行戰情室六大區（見 database-architecture）只消費**訊號觸發**與 Pro+ 分數，
     尚未需要逐項指標數值。
  3. 指標 schema（要存哪些 MA／哪些震盪指標）應由真實 ETL 與共振引擎需求決定，現在定欄位會猜錯。
- **未來允許建表的條件**：當共振引擎要正式落地，需要保存「可重算的指標數值以供回測與重算訊號」時，
  且已確定指標清單與單位（股／張、adjusted/unadjusted）後，才建 `technical_snapshots` 作為
  `technical_signals` 的上游，並同步把可由數值推導的比例欄位移出訊號表。

---

## B. Risk / Reward Boundary

### 現況

`position_risk_snapshots`（`v85_pro_plus_schema_v2.sql`）保存**已持有部位**的風險：
`position_cost`、`current_price`、`quantity`、`financing_used/ratio`、`margin_call_price`、
`forced_liquidation_price`、`stop_loss_price`、`max_drawdown_estimate`、`risk_level`。
其 `quantity > 0` constraint 本質上就假設「這是一個實際持有的部位」。

目前**沒有** `risk_reward_snapshots`。戰情室「風報比」區（`war_room_items.section = 'risk_reward'`）
依 war-room-architecture 的輸入為「進場、停損、目標、波動 → 風報比、分數、排序、理由」，
而 database-architecture 第 4 區指出風報比排行來自「Pro+ 風報分項 + `capital_management_snapshots`
+ 停損／回撤資料」。也就是說，風報比目前是 **Pro+ 評分的分項（`risk_reward_score`）+ 展示層**，
尚無獨立事實表。

### 決策

1. **`position_risk_snapshots` 只服務「已持有部位」。**
   它回答「我手上的這檔部位，融資、追繳、斷頭、停損與預估回撤如何」，以實際 `quantity`、
   `position_cost` 為前提。

2. **未來的 `risk_reward_snapshots`（若建）只服務「候選股／watchlist／全市場機會」。**
   它回答「這個我還沒持有的標的，以假設進場價計算，風報比是否值得進場」，
   不含實際持股數量與融資斷頭等部位事實。

3. **若風報比用於已持股**：應**擴充 `position_risk_snapshots`**（新增 `entry_reference_price`、
   `target_price`、`reward_risk_ratio` 等欄位），不另開表，因為它與部位事實同屬一列。

4. **若風報比用於候選股**：才需要獨立 `risk_reward_snapshots`，因為候選標的沒有部位事實，
   不該硬塞進 `position_risk_snapshots`（會違反 `quantity > 0` 語意）。

5. **不得讓兩張表同時保存同一個 `symbol/date` 的同一份風報比結論。**
   - 已持股的風報比 → 只在 `position_risk_snapshots`（擴充後）。
   - 候選股的風報比 → 只在 `risk_reward_snapshots`（未來）。
   - 同一 symbol 若同時是持股又被當候選評估，以「持股風報」為準寫入部位表，候選表不得重複保存同一日結論。

### 結論

- **暫緩建立 `risk_reward_snapshots`。**
- 短期風報比資料應放在：**`v85_pro_plus_scores.risk_reward_score` 及其 `score_breakdown` JSONB**
  （Pro+ 評分既有的風報分項），戰情室 `risk_reward` 區直接消費此分項與停損／回撤資料展示，
  不需要獨立事實表即可上線排行。
- **未來允許建表的條件**：當需要對「尚未持有的候選股／全市場」逐檔保存可追溯的
  進場價、停損、目標、波動與風報比，且要支援歷史回查與排序（而非僅即時計算）時，
  才建 `risk_reward_snapshots`，且僅限候選股用途。

---

## C. Prediction / Score Boundary

### 現況

`v85_pro_plus_scores`（`v85_pro_plus_schema.sql`）是目前個股評分的權威表：
`market/global_risk/industry/fundamental/chip/technical/risk_reward/total_score`、
`confidence`、`data_completeness`、`rating`、`signal`（`strong_buy/buy/watch/reduce/avoid`）、
`risk_level`、`thesis`、`score_breakdown`、`evidence`、`risk_flags`，並以 `run_id` 關聯 `v85_model_runs`。

`strategy_validation_results`（v2）已負責「訊號／策略後 1／5／20 個交易日的實際價格與報酬驗證」。

目前**沒有** `predictions`。

### 決策

1. **`v85_pro_plus_scores` 是目前個股評分、`signal`、`confidence`、`thesis`、`risk_flags`
   的唯一權威來源。** 戰情室與任何 consumer 一律以它為準。

2. **`predictions` 不得平行取代 `v85_pro_plus_scores`。**
   評級、訊號、信心度、論點、風險旗標屬於評分表，`predictions` 不得重複保存這些欄位。

3. **若未來真的新增 `predictions`，必須以 `score_id` 關聯 `v85_pro_plus_scores`**
   （`score_id uuid references public.v85_pro_plus_scores(id)`），表示「這筆預測是基於哪一筆評分產生」，
   而非獨立另一套評分。

4. **`predictions` 只允許保存明確 horizon 的量化預測**，例如針對 `1/5/20` 日的
   `predicted_return`、`probability_up`、信賴區間（`ci_low/ci_high`）、`horizon_days`，
   不得保存 `signal`、`rating`、`thesis` 這類已屬評分表的欄位。

5. **`strategy_validation_results` 負責驗證 prediction / score 的後續實際結果**：
   它以實際 1／5／20 日價格回填，與 `predictions` 的預測值對照，形成「預測 → 實現」閉環。
   `predictions` 存「事前預測」，`strategy_validation_results` 存「事後實現」，兩者責任不重疊。

### 結論

- **暫緩建立 `predictions`。**
- 原因：
  1. 目前模型只產出評分與 `signal`，尚未產出帶信賴區間的量化 horizon 預測；先建表沒有資料來源。
  2. `predictions` 必須以 `score_id` 掛在 `v85_pro_plus_scores` 之下，而後者目前也還沒有真實資料流，
     先建下游預測表順序顛倒。
  3. 預測值的驗證閉環需 `strategy_validation_results` 配合，目前驗證流程亦未落地。
- **未來允許建表的條件**：當 Pro+ 模型確定要輸出「特定 horizon 的量化報酬／機率預測」，
  且已有 `v85_pro_plus_scores` 真實資料可被 `score_id` 關聯、並由 `strategy_validation_results`
  回測驗證時，才建 `predictions`，且嚴格限定為 horizon 量化欄位。

---

## D. Authoritative Source Rules

| Domain | Authoritative Table | Derived / Consumer Table | 不得重複保存的資料 |
| --- | --- | --- | --- |
| 技術訊號（是否觸發） | `technical_signals` | `war_room_items`（展示）、`strategy_patterns`（聚合） | 布林訊號結論不得同時存在指標數值表 |
| 技術原始數值（指標層） | 未來 `technical_snapshots`（暫緩） | `technical_signals`（由數值推導布林） | MA／布林軌道／震盪指標數值不得存進 `technical_signals` |
| 已持股風險 | `position_risk_snapshots` | `war_room_items`（持股／禁碰展示） | 持股的融資／停損／回撤／（未來）風報比只此一處 |
| 候選股風報比 | 未來 `risk_reward_snapshots`（暫緩）；短期用 `v85_pro_plus_scores.risk_reward_score` | `war_room_items`（風報比區展示） | 候選股風報比不得與部位風險表重複保存同一 symbol/date 結論 |
| 個股總評分 | `v85_pro_plus_scores` | `war_room_items`、`latest_v85_pro_plus_scores`（view） | `signal`／`rating`／`confidence`／`thesis`／`risk_flags` 只此一處 |
| 未來 N 日預測 | 未來 `predictions`（暫緩，需 `score_id` 關聯） | `strategy_validation_results`（事後驗證） | 不得重複保存評分表欄位；只存 horizon 量化預測 |
| 策略驗證結果 | `strategy_validation_results` | `strategy_patterns`（按 regime／產業聚合） | 1／5／20 日實際結果只此一處，不混入評分或預測表 |
| 戰情室展示 read model | `war_room_snapshots` + `war_room_items` | UI／`latest_published_war_room_items`（view） | 不得成為任何結論的權威；只複製上游結論展示 |

補充：
- `war_room_decisions` = 決策／AI 摘要的歷史稽核，不是成交紀錄、也不是評分權威。
- `war_room_reports`（V11.6）= 對外可讀報告文件，引用上述權威表的結論，不自行保存原始衍生結論。

---

## E. Next Build Order Recommendation

依上述邊界，下一階段**不要再加新表**，先把已大量鋪墊的真實資料路徑打通。

### 現在不建

- `technical_snapshots`、`risk_reward_snapshots`、`predictions`：見 A／B／C 暫緩條件。
- `global_leader_snapshots`：依賴 Yahoo 全球資料（confidence 80，fallback 性質），
  非台股官方來源，時區／symbol mapping 風險高；在台股官方路徑打通前不優先。
- `risk_events`、`broker_ratings`、`industry_snapshots`：尚無真實來源與消費端，暫不建。

### 可優先建（但排在真實路徑之後）

- `chip_snapshots`：有明確官方來源（TWSE／TPEx 三大法人、融資融券）、
  已在 [ETL Data Contract](./etl-data-contract.md) 定義 business key `(symbol, record_date, source_name)`，
  且戰情室「主升段候選」與 Pro+ `chip_score` 需要它。是新增 snapshot 表中優先序最高者。

### Phase 2 應先打通的真實資料路徑

**優先做 `portfolio_stocks` 真實 API**，而不是先做 `chip_snapshots` 或 `global_leader_snapshots`。

理由：
1. 這條路徑的安全與驗證 gate 已被 V3-4～V11 大量鋪墊：
   shadow test（`test:portfolio-shadow`）、seed shape、RLS checklist、
   `PORTFOLIO_SOURCE_MODE` 切換器與 hardcoded fallback contract 都已就緒，
   只差「真實 seed + RLS migration + 切換」最後一哩。
2. 它不需要新增任何資料表，符合「不擴表」原則。
3. 打通後可驗證整條 `Supabase → repository → /api/portfolio → UI` 是否真的安全可用，
   為後續 snapshot 類表（chip 等）建立可複製的上線範本。

### 最小可執行順序

1. **Phase 2a**：補 `portfolio_stocks` 安全 migration（RLS policy + grants），完成真實 seed，
   通過 shadow／RLS／rollback gates，再把 `/api/portfolio` 由 hardcoded 切到 supabase mode。
   （不新增表、不改既有 schema 結構，只加安全 migration。）
2. **Phase 2b**：以同一套上線範本接 `chip_snapshots`（TWSE／TPEx 籌碼），打通第二條真實 ETL 路徑。
3. **Phase 2c 以後**：待 portfolio 與 chip 真實資料穩定，再依需求評估 `technical_snapshots`／
   `risk_reward_snapshots`／`predictions` 是否符合各自的建表條件。

不一次擴多張表；每個 Phase 只打通一條可驗證的真實資料路徑。
