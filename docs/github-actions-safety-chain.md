# GitHub Actions Safety Chain Workflow

本文件定義 V74 GitHub Actions Safety Chain Workflow：把 V73 的 Safety Chain CI Guard 實際接到 GitHub Actions，讓每次 push / pull_request 到 main 時，自動執行 npm ci → npm run test:safety-chain → npm run build，防止任何 commit 偷翻安全旗標。

V74 不是新的業務 spec，是 CI guard only。fixture/mock safe mode 維持不變。no Supabase secrets、no Vercel deploy、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

---

## A. Data flow

V60–V73 safety chain → GitHub Actions workflow → push / PR 自動跑 test:safety-chain + build → 防止安全旗標被偷翻

---

## B. Workflow

`.github/workflows/safety-chain.yml`：

- name: Safety Chain
- on：push main、pull_request main（branches: [main]）
- permissions：contents: read（唯讀，no contents: write、no write-all）
- jobs：safety-chain，runs-on: ubuntu-latest
- steps：
  1. actions/checkout
  2. actions/setup-node（node 20、cache npm）
  3. npm ci
  4. npm run test:safety-chain
  5. npm run build

---

## C. Workflow 不得包含

- secrets（no Supabase secrets、no VERCEL_TOKEN）
- environment variables for Supabase
- deployment action / Vercel deploy action（no Vercel deploy）
- curl / wget / external fetch（no fetch）
- service role（service_role）
- write permissions（write-all、contents: write）
- schedule trigger
- workflow_dispatch with production inputs
- any production switch / production ready（not PRODUCTION_READY）
- /api/portfolio switch

---

## D. Validator

Validator（`scripts/validate-github-actions-safety-chain.ts`）檢查：`.github/workflows/safety-chain.yml` 存在、name 含 Safety Chain、push main 觸發、pull_request main 觸發、permissions contents: read、有 npm ci / npm run test:safety-chain / npm run build、沒有 secrets / SUPABASE / VERCEL_TOKEN / deploy / curl / wget / fetch / service_role / write-all / contents: write / workflow_dispatch / schedule / /api/portfolio / PRODUCTION_READY；docs phrases、package script、README 連結；以及未新增任何 deployment workflow。

CI guard only：本 workflow 只跑既有 V60–V73 safety chain validator 與 next build，不部署、不連線、不接真實資料、不標記 production ready。

---

## E. Commands

- `npm run test:github-actions-safety-chain`：靜態驗證 workflow 內容與安全邊界。
- `npm run test:safety-chain`：本機一鍵跑 V60–V72 全部 validator + V73 guard（與 CI 相同）。
- `npm run build`：next build。

---

## F. Safety Boundary

- CI guard only；fixture/mock safe mode。
- contents: read；no Supabase secrets；no Vercel deploy。
- no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## G. Future

未來新增 V75+ 安全鏈時，需把對應 script 加進 `npm run test:safety-chain` 與 V73 guard 的 CHAIN_SPECS，CI workflow 即自動涵蓋；workflow 本身永遠維持 read-only、no secrets、no deploy。
