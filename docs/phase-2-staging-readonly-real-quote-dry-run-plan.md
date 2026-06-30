# Phase 2 — Staging Read-only Real Quote Dry-run Implementation Plan

本文件為 **docs-only / spec-only** 的實作規劃，描述「下一階段如何在仍然安全鎖定的前提下，接入 staging read-only real quote dry-run」。

**本文件不改 runtime、不改 API、不連資料。** 不新增 runtime connection、不新增 API route、不讀 env、不 fetch、不連 Supabase、不接真實行情、不切 /api/portfolio、不產生買賣指令、不自動下單、不標記 production ready。對應已收到的 Evidence Phase 1（intake round 1 / round 2）。

> 這是「計畫」，不是「啟用」。本計畫描述未來 PR 的範圍與安全邊界；任何實際連線都需要另一次 owner 明確同意 + CI 綠燈 + PR scope 核准。

---

## 1. Phase 2 目標

- staging read-only real quote dry-run（只在 staging、只讀報價）。
- **fixture remains default**：fixture/mock 永遠是預設來源。
- **real quote only in shadow mode**：真實報價只用於 fixture 旁邊「並排比較」，不取代 fixture、不驅動任何操作。
- **no production switch**：不切 production、不切 /api/portfolio、不標記 production ready。
- 目的：先驗證「真實報價能被讀進來且與 fixture 對照一致」，全程不下單、不接 broker、不寫資料。

---

## 2. Env switch semantics（語義規劃；本階段不讀值）

以下為**名稱與語義**規劃，本階段不讀任何值、不在 runtime 生效：

### `REAL_DATA_MODE`
- `fixture`：**預設**，完全 mock/fixture，與目前 V60–V74 行為一致。
- `shadow`：fixture 與 real quote **並排比較**（real 僅供對照，不取代 fixture、不可操作）。
- `real-readonly`：**未來狀態，本階段不得啟用**（即使啟用也只讀、不寫、不下單）。

> 預設值永遠是 `fixture`。缺值 / 未知值 → 視為 `fixture`（fail-safe）。

### `REAL_QUOTE_PROVIDER`
- `yahoo`：公開報價（第一階段優先候選）。
- `twse`：上市官方查核層。
- `tpex`：上櫃官方查核層。
- `mixed-public`：以官方（TWSE/TPEx）為主、Yahoo 備援的混合公開來源。

> 僅限公開行情；不含 broker / 券商 / 下單來源。

### `NEXT_PUBLIC_REAL_DATA_ENABLED`
- `false`：**kill switch off / fixture only**（預設）。
- `true`：未來允許 shadow，但**本階段不啟用 runtime**（僅語義保留）。

### `SUPABASE_URL`
- 名稱存在，**本階段不讀值**。

### `SUPABASE_READONLY_ANON_KEY`
- 名稱存在，**本階段不讀值**；為 read-only anon key。

### Service role
- **service role key forbidden in app runtime**：app runtime 永遠不得使用 service role key；只允許 read-only anon key（且本階段連 anon key 都不讀）。

---

## 3. Read-only quote adapter plan

規劃一個**純介面**（未實作、未連線）：

```
// 規劃用型別示意（本階段不建立 runtime / 不 fetch）
interface QuoteProvider {
  providerName: "yahoo" | "twse" | "tpex" | "mixed-public";
  mode: "readonly";          // 永遠 readonly
  // getQuote(symbol): 未來實作；本階段不實作、不 fetch
}
```

- **Yahoo provider** 作為第一個 public quote 候選（read-only）。
- **TWSE / TPEx** 作為官方 verification layer（與 Yahoo 對照查核）。
- **Goodinfo not first real-time source**：Goodinfo 不作為第一階段即時來源（可作為後續分析參考）。
- **no broker provider**：不規劃任何 broker / 券商 provider。
- **no order provider**：不規劃任何下單 provider。
- **no auto order**：不規劃任何自動下單。

> adapter 介面只描述「read-only 取報價」的形狀；實作、連線、fetch 全部留待後續、且需另外同意。

---

## 4. Shadow comparison plan

shadow 模式下，每檔同時呈現並比較（並排、不切換）：

| 欄位 | 說明 |
|---|---|
| fixture quote | 目前 fixture/mock 報價（預設來源） |
| real quote candidate | public provider 候選報價（僅對照） |
| source timestamp | real 報價的來源時間戳 |
| source name | yahoo / twse / tpex |
| price difference | fixture vs real 差異（金額 / %） |
| stale detection | real 報價是否過期（超時） |
| conflict detection | 多來源 / fixture 與 real 是否衝突 |

衝突 / 缺值 / 過期時，**對應回既有降級鏈**：
- **V67** Real Quote Source Conflict Resolution Policy（多來源衝突解析、降級 BLOCKED_NOT_CONNECTED）。
- **V68** Conflict → Trade Plan Verification Downgrade（SOURCE_CONFLICT / STALE_DATA / MISSING_DATA…）。
- **V69** Downgraded Trade Plan UI Behavior（依 displayMode 隱藏/降級承接區、顯示警告、actionLabel 非買進）。

> shadow 模式永遠是 **non-operational**：real quote 只標示、只對照，不可作為正式操作依據、不驅動下單。

---

## 5. Rollback / kill switch

- **rollback**：`REAL_DATA_MODE=fixture` → 網站回到 mock safe mode。
- **kill switch**：`NEXT_PUBLIC_REAL_DATA_ENABLED=false` → 立即關閉 real，回 fixture only。
- **fallback to fixture/mock safe mode**：任何異常（來源衝突 / 延遲 / 缺值 / 讀取失敗）一律 fallback 回 fixture。
- **no production switch**：rollback / kill switch 都不涉及 production；本階段不存在 production 切換路徑。

---

## 6. Safety chain alignment

- **V60–V74 safety chain remains active**：整條 fixture-only 安全鏈持續有效。
- **test:safety-chain remains required**：`npm run test:safety-chain` 仍為必過。
- **GitHub Actions Safety Chain remains required**：push / PR to main 仍自動跑 safety chain + build。
- **no flag flips**：不翻任何 manual sign-off / staging connection / production switch 旗標。
- **decision remains NO_GO until actual dry-run review**：在真正的 dry-run 實作審查通過前，decision 維持 NO_GO、productionReady=false、stagingConnectionAllowed=false。

> 未來新增 real-quote 相關 spec/validator 時，須同步加入 `test:safety-chain` 與 V73 guard 的 CHAIN_SPECS，確保 CI 仍能攔下偷翻旗標的 commit。

---

## 7. Explicit forbidden list

本階段（與下一版實作 PR 規劃）一律禁止：

- no Supabase connection
- no env read
- no DB write
- no fetch
- no real market data
- no API route
- no /api/portfolio switch
- no buy/sell command
- no auto order
- no broker API
- no service role key
- not PRODUCTION_READY

---

## 8. Exit criteria（從 plan 進到 implementation 的條件）

只有同時滿足以下條件，才可開始下一版**實作 PR**（且實作 PR 仍維持 read-only + shadow + fixture 預設）：

1. **owner reconfirms**：owner 明確再次同意「進行 implementation」。
2. **CI green**：`test:safety-chain` 與 GitHub Actions Safety Chain 全綠。
3. **dry-run implementation PR scope approved**：實作 PR 的範圍（哪些檔案、哪些介面）先被核准。
4. **runtime flags still default fixture**：`REAL_DATA_MODE` 預設仍 `fixture`、`NEXT_PUBLIC_REAL_DATA_ENABLED` 預設仍 `false`。
5. **shadow mode still non-operational**：shadow 只對照、不可操作、不驅動下單。
6. **service role absence check included**：實作須包含「app runtime 不含 service role key」的檢查。

---

## 9. 仍鎖定狀態（本文件未改變任何東西）

- decision = NO_GO；productionReady = false；realDataConnected = false；stagingConnectionAllowed = false；manualSignoffCompleted = false。
- 未改 runtime、未改 API、未連 Supabase、未讀 env、未 fetch、未接真實行情；V60–V74 safety chain 不受影響。
- 下一步需要 owner 明確指示「進行 Phase 2 implementation」並滿足第 8 節 exit criteria，我才會著手；屆時仍只先出實作 PR scope，實際連線需再一次明確同意。
