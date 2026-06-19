# War Room Architecture

戰情室是 Allen Stock Dashboard 的發布型讀取模型：同一畫面上的市場燈號、持股、風報比、主升段與禁碰清單，必須來自同一個資料截止時間與模型版本。UI 不在開頁時臨時組裝五組彼此不同步的來源。

## 區塊與資料責任

| 區塊 | `section` | 主要輸入 | 最低輸出 |
| --- | --- | --- | --- |
| 市場燈號 | `market_signal` | 指數、廣度、風險模式 | 市場分數、曝險建議、理由、更新時間 |
| 持股戰情 | `holdings` | 持股、行情、Pro+ 分數 | 損益、權重、訊號、風險旗標 |
| 風報比 | `risk_reward` | 進場、停損、目標、波動 | 風報比、分數、排序、理由 |
| 主升段候選 | `breakout` | 技術、籌碼、產業 | 候選分數、信心度、觸發條件 |
| 今日禁碰 | `avoid` | 流動性、下跌風險、資料品質 | 風險等級、排除原因、排序 |

`war_room_items.payload` 只放區塊專屬的展示欄位；排序、標題、代號、分數、信心度與理由使用正式欄位，避免所有查詢都依賴 JSONB。

## 產製與發布

```text
collect → normalize → persist snapshots → calculate Pro+ → compose draft
                                                        ↓
                                      validate required sections and freshness
                                                        ↓
                                      publish one immutable snapshot
                                                        ↓
                                      UI reads latest published snapshot
```

1. 建立模型 run，固定來源截止時間，不在計算中途漂移。
2. 各來源可以部分失敗，但必須留下 warning 與最後成功時間。
3. Composer 建立 `draft` snapshot，寫入所有 items。
4. 發布前驗證必備區塊、重複排名、分數範圍、資料新鮮度與模型版本。
5. 驗證通過後設定 `published_at` 並切換為 `published`；同一日期／session／版本以 upsert 更新 draft，不產生重複快照。
6. 已被新版本取代者標為 `superseded`，不直接刪除。

## 一致性與降級

- 市場燈號不可用：整份新快照不發布，UI 保留上一份並標示過期。
- 單一個股不可用：可發布 `partial` run，但該項目需標示資料時間與缺少欄位，不得補成 0。
- Pro+ 計算失敗：不得把舊評分標上新的 `score_date`。
- Storage artifact 不可用：文字戰情仍可發布，但附件入口隱藏並留下 warning。
- 完全沒有已發布快照：顯示可操作的空狀態，不退回未標示的 mock data。

## UI 讀取契約

戰情室回應至少包含：

- snapshot ID、日期、session、model version、data cutoff、published time；
- 市場模式、分數、建議曝險、headline、summary；
- 依 section 分組且穩定排序的 items；
- freshness、partial warnings 與來源狀態。

Server 取得資料後映射成 UI view model。Component 不認識資料表名稱，不自行把 `signal`、`risk_level` 翻譯成文案；翻譯遵循 [UI Language Rule](./ui-language-rule.md)。

## 可觀測性

每次 run 與發布都需記錄 run ID、snapshot ID、模型版本、來源截止時間、各來源耗時、成功／失敗標的數與 warning 數。告警條件至少包含：沒有當日已發布快照、連續 provider 失敗、資料超過新鮮度門檻、排名重複、Storage 孤兒物件。

## V3-1.5 邊界

本階段完成 schema 與架構契約，不在 `app/`、`components/` 或 mock data 內切換 UI。後續實作順序為 repository、計算／發布工作、戰情室 query service、server route，最後才逐區塊替換 mock data。

