# Project Red Lines and Roadmap

本文件澄清「紅線」用語，避免被誤解成系統**永遠不能**接真實行情或**永遠不能**自動篩股。
紅線分成兩類：**永久紅線**（不可跨越）與**目前階段性限制**（暫時、未來可經核准解除）。

---

## 1. Permanent Red Lines / 永久紅線

這些是**永久不可跨越**的界線，任何版本、任何階段都成立：

- ChatGPT / 系統**不得替使用者下單**。
- **不自動交易**。
- **不自動執行買賣**。
- **不得無聲切正式資料**（no silent production data switch）。
- **不得無聲執行 broker API**（no silent broker API execution）。
- 未經 **Allen 明確 owner approval**，不擴大正式 live fetch 股票池、不切正式資料、不接 broker API、
  不切 production data switch。

> 永久紅線與「未來允許方向」不衝突：即使未來做了自動行情驗證與技術掃描，系統仍**只提供觀察與候選**，
> **最終買賣決策一律由使用者手動執行**。

---

## 2. Current Phase Restrictions / 目前階段性限制

這些是**目前階段暫時**的限制，未來可**經 owner approval、分階段驗證、manual sign-off** 後解除：

- 目前暫不切正式行情資料。
- 目前暫不切 /api/portfolio。
- 目前暫不接 Supabase runtime。
- 目前暫不新增第二檔 live fetch symbol。
- 目前暫不新增 Yahoo／新資料源。
- 目前暫不做全市場自動掃描。
- 目前暫不產生操作型買賣指令。

---

## 3. Future Allowed Direction / 未來允許方向

以下是**未來允許**的方向（非永久禁止），每一步都需分階段、經 owner approval、驗證與 manual sign-off：

- 自動抓取並驗證真實行情（real quote validation）。
- 多檔 watchlist live fetch（multi-symbol watchlist）。
- 核心股票池 universe（core universe）。
- 技術掃描器（technical scanner）。
- 扣三低掃描（扣三低 scanner）。
- 走多逢低候選股篩選（走多逢低候選股 scanner）。
- 觀察清單／候選股排名（candidate ranking）。
- 風報比、停損區、進場觀察區（risk/reward and stop-loss reference）。
- 使用者手動決策（user manual decision）。

> 這些是「觀察 / 候選 / 排名 / 參考」用途，**不等於**自動交易或自動下單。

---

## 4. Auto Scanner Roadmap / 自動技術篩選路線

自動技術篩選採**逐步、可驗證、每步 owner approval + manual sign-off** 的路線推進：

```
single-symbol validation
→ core watchlist universe
→ multi-symbol read-only shadow fetch
→ historical K-line contract
→ technical scanner fixture validator
→ 扣三低 / 走多 / 逢低候選條件
→ scanner UI
→ candidate ranking
→ manual user decision
```

各階段說明：

1. **single-symbol validation** — 單一股票（目前 3019）即時抓取與驗證的安全強化（現況）。
2. **core watchlist universe** — 定義核心觀察股票池 universe（fixture / contract 先行）。
3. **multi-symbol read-only shadow fetch** — 多檔唯讀 shadow 抓取（shadow-only、不切正式）。
4. **historical K-line contract** — 歷史 K 線資料的型別 / contract（先 spec，後驗證）。
5. **technical scanner fixture validator** — 技術掃描器以 fixture 驗證（離線、deterministic）。
6. **扣三低 / 走多 / 逢低候選條件** — 篩選條件邏輯（扣三低、走多、逢低候選股）。
7. **scanner UI** — 掃描結果的前台介面（繁中 UI）。
8. **candidate ranking** — 候選股排名與觀察清單。
9. **manual user decision** — 最終由使用者手動決策；系統不下單、不自動交易。
