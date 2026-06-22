# Portfolio API Switch Guard

本文件定義 `/api/portfolio` 在 V14 階段的 source mode 切換守衛（switch guard）行為、
response metadata 契約與安全規則。

**V14 的目標是：guard 就位，但仍不正式切換。預設仍為 `hardcoded`，Supabase 連線不得在本階段開啟。**

相關文件：
[Portfolio Production Readiness](./portfolio-production-readiness.md)、
[Portfolio Staging RLS Validation](./portfolio-staging-rls-validation.md)、
[Portfolio Switch Strategy](./portfolio-switch-strategy.md)。

---

## A. Purpose

V14 switch guard 的目的是：

- 為所有 `PORTFOLIO_SOURCE_MODE` 值（`hardcoded` / `shadow` / `supabase` / 無效值 / 未設定）提供
  明確、可機器驗證的 response metadata，讓 rollout 狀態在 API 回應中直接可見。
- 確認 `supabase` mode 在本階段被 guard 攔截：不建立 Supabase client、不讀 Supabase env key、
  不發任何 request，必須 fallback 到 hardcoded 並在 metadata 標示 `fallback_used: true`。
- 讓 fixture-only 本機 checker（`npm run test:portfolio-api-switch-guard`）可以驗證所有 mode
  的 metadata 契約，無需連線任何外部服務。

本階段明確排除的事項：

- **不正式切換 `/api/portfolio` 到 Supabase**：V14 只做 guard 程式準備，實際切換另立版本。
- **不建立 Supabase client**：`supabase` mode 在 V14 必須 guarded fallback，不得呼叫
  `createServerSupabaseClient()`。
- **不讀 Supabase secret env key**：`SUPABASE_SERVICE_ROLE_KEY` 等 key 不得在本階段被讀取。
- **不寫入真實持股資料**：`cost_price`、`quantity`、`owner_id` 不得進入任何 Git 檔案。
- **不修改 UI、components、repositories 或 services**。
- **不新增 SQL migration**。
- **不產生買賣建議**。

---

## B. Source Mode Contract

| `PORTFOLIO_SOURCE_MODE` 值 | `source_mode` | `response_source` | `fallback_used` | 備註 |
|---|---|---|---|---|
| 未設定（unset）| `"hardcoded"` | `"hardcoded"` | `true` | 隱式 fallback，warnings 包含說明 |
| `"hardcoded"` | `"hardcoded"` | `"hardcoded"` | `false` | 明確指定，正常路徑 |
| `"shadow"` | `"shadow"` | `"hardcoded"` | `false` | Data 仍為 hardcoded；shadow metadata 標示 SKIPPED |
| `"supabase"` | `"supabase"` | `"hardcoded"` | `true` | V14 guard 攔截；不建立 client，fallback_reason 必須存在 |
| 任意無效值 | `"hardcoded"` | `"hardcoded"` | `true` | unknown-mode fallback，warnings 包含說明 |

---

## C. Response Metadata Contract

`/api/portfolio` 的 `meta.portfolioMode` 欄位在所有 mode 下均包含以下欄位：

### 必填欄位（所有 mode 均出現）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `source_mode` | `string` | 解析後的模式（resolver effective_mode 或 guard override） |
| `response_source` | `"hardcoded"` | V14 資料永遠來自 hardcoded；此欄位恆為 `"hardcoded"` |
| `decision_source` | `"hardcoded"` | 持股決策來源；恆為 `"hardcoded"` |
| `fallback_used` | `boolean` | 是否啟動 fallback（implicit、invalid 或 supabase guard） |
| `warnings` | `string[]` | Resolver 或 guard 產生的警告訊息；無警告時為空陣列 |
| `request_performed` | `false` | 常數 `false`：V14 guard 不發任何 request |
| `supabase_connected` | `false` | 常數 `false`：V14 guard 不建立 Supabase 連線 |
| `production_write_performed` | `false` | 常數 `false`：V14 guard 不寫入任何資料 |

### 條件欄位

| 欄位 | 出現條件 | 說明 |
|---|---|---|
| `fallback_reason` | `fallback_used === true` | 說明 fallback 原因（supabase guard / invalid mode） |
| `shadow_enabled` | `source_mode === "shadow"` | 恆為 `true`（shadow mode 啟用） |
| `shadow_status` | `source_mode === "shadow"` | V14 恆為 `"SKIPPED"` |
| `shadow_reason` | `source_mode === "shadow"` | 說明 shadow 為何被跳過（V14 guard） |

### 範例 — hardcoded mode

```json
{
  "source_mode": "hardcoded",
  "response_source": "hardcoded",
  "decision_source": "hardcoded",
  "fallback_used": false,
  "warnings": [],
  "request_performed": false,
  "supabase_connected": false,
  "production_write_performed": false
}
```

### 範例 — shadow mode

```json
{
  "source_mode": "shadow",
  "response_source": "hardcoded",
  "decision_source": "hardcoded",
  "fallback_used": false,
  "warnings": [],
  "shadow_enabled": true,
  "shadow_status": "SKIPPED",
  "shadow_reason": "Supabase connection disabled in V14 guard",
  "request_performed": false,
  "supabase_connected": false,
  "production_write_performed": false
}
```

### 範例 — supabase mode（V14 guard fallback）

```json
{
  "source_mode": "supabase",
  "response_source": "hardcoded",
  "decision_source": "hardcoded",
  "fallback_used": true,
  "fallback_reason": "Supabase mode is guarded in V14 and remains disabled until staging gates pass",
  "warnings": ["Supabase mode is guarded in V14 and remains disabled until staging gates pass."],
  "request_performed": false,
  "supabase_connected": false,
  "production_write_performed": false
}
```

---

## D. Safety Rules

1. **Supabase client 禁止在 V14 建立**：`createServerSupabaseClient()` 不得在 `supabase` mode 分支被呼叫。
   Guard 必須在 client 建立之前攔截並 fallback。
2. **Secret env key 不得被讀取**：`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_ANON_KEY` 等 server-only key
   不得在 V14 switch guard 中出現任何讀取行為。
3. **Empty Supabase result 不得覆蓋 hardcoded data**：V14 不連 Supabase，此條件在架構上
   已成立；未來版本開啟 Supabase mode 時，`empty_portfolio` fallback 必須仍然有效。
4. **`response_source` 恆為 `"hardcoded"`**：V14 所有 mode 下資料來源均為 hardcoded。
   此欄位不得因 mode 設定改變而變為其他值。
5. **`decision_source` 恆為 `"hardcoded"`**：持股決策（哪些股票、哪些市場）由 hardcoded 決定。
6. **`request_performed`、`supabase_connected`、`production_write_performed` 恆為 `false`**：
   這三個欄位為常數，不允許為 `true`。
7. **預設行為不得改變**：`PORTFOLIO_SOURCE_MODE` 未設定時，行為必須與明確設定 `hardcoded` 相同
   （唯一差異是 `fallback_used: true` 而非 `false`，以及 warnings 包含說明）。

---

## E. Promotion Gate to V15

進入 V15（Supabase 模式正式 rollout）前，以下條件**全部**必須通過：

- [ ] **V14 switch guard checker PASS**：`npm run test:portfolio-api-switch-guard` 輸出 `status: "PASS"`，5 個 scenario 全部 PASS。
- [ ] **TypeScript build 無 error**：`npm run build` 在 V14 修改後通過，無任何型別錯誤。
- [ ] **V13 staging RLS validation 已完成**：`npm run test:portfolio-staging-rls` PASS，且人工 RLS matrix 驗證已完成。
- [ ] **Staging shadow comparison PASS**：至少連續 2 次 portfolio shadow comparison 無 symbol / market drift。
- [ ] **V14 doc 已記錄 guard 行為與 promotion 條件**：本文件（`portfolio-api-switch-guard.md`）已更新至最新。
- [ ] **Product owner 明確授權**：Allen 確認所有 V14 gates 通過，並明確授權開始 V15 Supabase 正式切換。

V15 正式切換時，`supabase` mode 的 guard 攔截必須被移除，並替換為真實的 Supabase client 呼叫與
`empty_portfolio` fallback 防護。
