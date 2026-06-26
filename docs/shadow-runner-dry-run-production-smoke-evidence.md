# V51.1 Production Route Deployment Smoke Evidence

本文件記錄 **V51.1 Production Route Deployment Smoke Evidence**：確認 V51 route
`GET /api/portfolio/shadow-runner-dry-run` 是否真的進 production。

**本階段以 evidence / docs / validator 為主。本輪不新增 UI、不連 Supabase、不讀 env、不寫 DB、不切換 /api/portfolio、不接真實行情、不產生買賣指令、不自動下單。**

相關文件：
[Shadow Runner Dry-run API Route](./shadow-runner-dry-run-api-route.md)、
[Shadow Runner Dry-run API Contract](./shadow-runner-dry-run-api-contract.md)。

---

## A. Observed Symptom

- GitHub：`e8237be` → `3cb112d` 只多 1 個 commit，檔案變更符合 V51。
- Vercel production deployment still shows V50 commit `e8237be`（Vercel production deployment list 目前最新仍顯示 V50）。
- production endpoint currently returns 404：
  `GET https://allen-stock-dashboard.vercel.app/api/portfolio/shadow-runner-dry-run`
- 因此 do not proceed to V52。

---

## B. Local Code Evidence (deployment-ready)

本機已驗證 V51 route 程式碼正確、可服務 200，**code is deployment-ready**；404 為部署管線問題、非程式碼問題：

1. `npm run build` 成功，route table 出現：
   `ƒ /api/portfolio/shadow-runner-dry-run`
2. V51 route checker（`npm run test:shadow-runner-dry-run-api-route`）PASS。
3. V50 builder 產生的 `responsePayload`（即 route 回傳的 body）為：
   - `ok` = true
   - `responseSource` = mock_or_contract
   - `sourceMode` = fixture
   - `plannedEndpoint` = /api/portfolio/shadow-runner-dry-run
   - `method` = GET
   - `safetyFlags.supabaseConnected` = false
   - `safetyFlags.stagingSupabaseConnected` = false
   - `safetyFlags.productionSupabaseConnected` = false
   - `safetyFlags.envReadPerformed` = false
   - `safetyFlags.databaseWritePerformed` = false
   - `safetyFlags.shadowRunnerExecuted` = false
   - `safetyFlags.shadowResultPersisted` = false
   - `safetyFlags.portfolioApiSwitched` = false
   - `safetyFlags.realMarketDataEnabled` = false
   - `safetyFlags.buySellCommandGenerated` = false
   - `safetyFlags.autoOrderRequested` = false
   - `safetyFlags.killSwitchDefaultEnabled` = true

> 註：本 repo 內的 validator **無法且不會**連線 production URL 或 Vercel API。
> `productionEndpointCheckedByValidator` = false；production HTTP 檢查是 MANUAL 步驟。

---

## C. Likely Causes（待人工於 Vercel dashboard 確認）

`3cb112d` 未進 production，常見原因：

1. **Vercel 沒有針對 `3cb112d` 觸發 deployment**（GitHub ↔ Vercel integration / webhook 沒收到 push，或該分支未設為 production branch）。
2. **deployment 仍在 queued / building**（尚未完成，alias 還停在舊 commit）。
3. **deployment failed**（build error → production alias 保留在前一個成功版本 `e8237be`）。
4. **Ignored Build Step / skipped**（Vercel 專案設定了「Only build if changed」之類規則而略過）。
5. **production alias 被釘在舊 deployment**（手動 promote / rollback 過）。

本機 `npm run build` 已成功，因此原因 (3) build error 的機率較低，較可能是 (1) 未觸發 / (2) queued / (4) skipped / (5) alias 釘住。

---

## D. Required Manual Actions（由你在 Vercel 操作；我無法代為執行）

1. 開 Vercel dashboard → 專案 deployments，找有沒有 `3cb112d` 的 deployment。
2. 若 **沒有 `3cb112d`**：檢查 Git integration 是否連到 `allenchen0501/allen-stock-dashboard`、production branch 是否為 `main`、是否有 Ignored Build Step 設定；必要時 **redeploy main**（Deployments → 對 `main` / 最新 commit 按 Redeploy，或 `git commit --allow-empty` 後再 push 觸發）。
3. 若 **有 `3cb112d` 但 status = Error**：把 build log 貼回來，不要硬改功能。
4. 若 **有 `3cb112d` 且 Ready**：確認 production alias 已指向該 deployment（Deployments → Promote to Production / 檢查 Domains）。
5. alias 指向 `3cb112d` 後，再手動 `GET https://allen-stock-dashboard.vercel.app/api/portfolio/shadow-runner-dry-run`，預期 **HTTP 200** 且 body 等於 B 節欄位。

---

## E. Safety Boundary

- responseSource must remain mock_or_contract。
- sourceMode must remain fixture。
- PORTFOLIO_SOURCE_MODE must remain hardcoded。
- no Supabase connection。
- no env key。
- no write / no staging write / no production write。
- no SQL migration。
- no api switch。
- no buy/sell command。
- no auto order。
- 本輪未改任何功能程式碼，只新增 evidence 文件與 validator。

---

## F. Gate

- **do not proceed to V52** 直到 production endpoint 回 200 並通過上述 smoke 檢查。
- 下一階段（待 production 修復後）才是 V52 Shadow Runner Dry-run Monitoring UI 或 V52 Shadow Runner Dry-run API Evidence Review。
