## Context

Shop Watcher 目前以 `PlatformScanStatus` 追蹤各平台健康度，該表由 Worker 於每次 `run_scan_cycle()` 結束時透過 `PATCH /api/worker/platform-status` 上報，欄位包含 `lastSuccess`、`lastError`、`failCount`。但此機制僅能偵測 scraper **throw exception** 的情境；當網站改版導致 selector 失效、HTTP 200 返回空陣列時，scraper 會靜默成功，`failCount` 永遠不會增加，儀表板看起來一切正常。

使用者感受到的症狀是「最近沒收到新品通知」，無法區分三種情況：
1. 該關鍵字在該平台本來就沒新上架
2. 關鍵字語言與平台區域不匹配
3. Scraper 壞了（selector 改了、網站 DOM 結構換了）

前兩種是常態、第三種才是故障。以「0 筆」直接推播會大量誤報，因此本提案改採「被動 UI 呈現」：只要平台健康狀態轉為 `unhealthy`，就在 webapp 相關頁面顯示警示 badge，由 operator（或發現警示的使用者）自行決定何時處理，不主動 Discord 推播打擾。

## Goals / Non-Goals

**Goals:**

- 當 scraper 因平台改版而靜默失效時，Dashboard 與關鍵字卡片能**立刻**顯示警示，不需要等使用者回報
- 警示訊號要有足夠高的訊噪比；UI 警示僅在真正有問題時才出現，避免使用者習慣性忽略
- 偵測邏輯由 Worker 主導，不依賴使用者關鍵字、不影響使用者帳號配額
- 兩層訊號可獨立運作：canary 連續 0 筆或 DOM 異常任一條件成立即標記 `unhealthy`
- 健康狀態由 webapp API 回傳，前端元件讀取後決定是否顯示警示

**Non-Goals:**

- 不主動推播 Discord/Email；`SYSTEM_ALERT_WEBHOOK` 維持原用途
- 不自動修復 scraper
- 不對 `CircleFollow`（店舖/社團追蹤）加 canary，範圍限定關鍵字搜尋
- 不建構全域「平台 uptime」SLA 報表
- 不以 AI/heuristic 自動推斷新 selector

## Decisions

### 採用雙訊號而非單一訊號

**選擇：** Canary keyword 掃描 + DOM 結構檢查並行，任一異常即將平台標記為 `unhealthy`。

**理由：** 兩者互補。Canary 偵測「端到端流程壞了」（含網路、login、解析），但週期長、訊號延遲。DOM 檢查即時、低成本，但只能看出結構性改版，看不出邏輯性失效（例：登入 session 過期）。兩層疊加可同時壓低誤報率與偵測延遲。

**替代方案：**
- 只用 canary：偵測延遲高，且需設計「保證有貨」的關鍵字列表，日後維護負擔大
- 只用 DOM 檢查：無法偵測 Playwright 被 block、login 失效等非結構性問題

### 警示以 UI badge 呈現，不推播 Discord

**選擇：** `PlatformCanaryStatus` 新增 `healthState` 欄位（`healthy` / `unhealthy`）。當 canary 連續 2 次 0 筆或 DOM 異常時轉 `unhealthy`；恢復正常時轉回 `healthy`。`GET /api/platform-status` 回傳此欄位，Dashboard 既有的 `PlatformScanHealthSection` 與關鍵字卡片 `KeywordCard` 讀取後渲染警示 badge。

**理由：**
- 使用者已習慣 Dashboard 健康區塊，在同一位置呈現 canary 警示比另開 Discord 通道更直覺
- 避免 operator 被系統告警打擾；canary 失效屬於「重要但不緊急」的狀況
- 減少 infra：不需維護 `SYSTEM_ALERT_WEBHOOK` 的推播格式、rate limit 與重送邏輯

**替代方案：**
- Discord 推播（前版設計）：否決，原因見上
- Email 每日摘要：否決，canary 問題通常需要當天內 operator 決定是否忽略，摘要延遲過高；且實作成本高於 badge

### `unhealthy` 狀態轉換以「連續異常計數」而非「單次」

**選擇：** `consecutiveEmptyCount >= 2` 或 `domIntact == false` 任一成立 → `healthState = unhealthy`。`consecutiveEmptyCount = 0` 且 `domIntact == true` → `healthState = healthy`。

**理由：** 避免單次網路抖動或瞬時 rate limit 觸發警示；DOM 異常屬結構性問題，單次即足以信任。

**替代方案：** 單次 0 筆即 `unhealthy` → 否決，誤報率高。

### Canary 清單以 Python 常數維護，不進資料庫

**選擇：** `src/canary.py` 內定義 `CANARY_KEYWORDS: dict[str, str]`（platform → keyword 字典）。

**理由：** Canary 是 operator 設定，不由使用者管理；改動頻率極低；與 scraper 程式碼同 repo 便於一起 review。若存入 DB 需額外管理介面，ROI 低。

**替代方案：** 存入 `PlatformCanaryStatus` 本身；被否決，因 canary keyword 本質是程式碼常數不是使用者資料。

### Canary 執行頻率與現有 scan cycle 同步

**選擇：** 每次 `run_scan_cycle()` 結束後、在 `report_scan_completion()` 之前執行一次 canary pass，每平台一次。

**理由：**
- 現有 worker 每小時觸發一次，canary 每小時一次已足夠偵測「數小時內平台改版」
- 若獨立排程需額外 GitHub Actions job，增加 infra 複雜度
- 在同一 process 內執行可沿用 Playwright browser context，省資源

**替代方案：**
- 獨立 `canary.yml` workflow 每 30 分鐘跑一次：增加複雜度，收益有限，否決
- 每輪 scan 內每個平台都跑 canary：對平台壓力過大，否決

### DOM 結構檢查以 scraper 內 `check_dom_structure()` 實作，不抽象成框架

**選擇：** 每個 scraper module 自行定義 `_check_dom_structure(page) -> bool`，在 `scrape_<platform>()` 開頭呼叫，結果放進回傳結構。

**理由：**
- 每個平台 DOM 結構不同，抽象化後仍需每個 scraper 提供 selector 清單，不如直接寫 function
- 維持「scraper 模組自包含」的現有慣例
- 新增 scraper 時作者已經知道關鍵 selector，寫 DOM 檢查只是多一行 `await page.locator(SEL).count() > 0`

**替代方案：** 在 `BaseWatcher` 定義抽象方法；被否決，過度設計。

### Worker 以新增 API endpoint 上報，不合併到現有 `/platform-status`

**選擇：** 新增 `PATCH /api/worker/canary-status`，payload 結構獨立。

**理由：**
- `PlatformScanStatus` 綁定 `userId`（歷史因素），canary 是系統級不綁 user
- 混在同一 route 會讓 payload 變成 union type，schema 混亂
- 獨立 route 讓權限與驗證邏輯簡單（仍用 Bearer `WORKER_SECRET`）

### 前端在兩個位置顯示警示

**選擇：**
1. Dashboard 既有的 `PlatformScanHealthSection` 顯示每個平台的 `healthState`；`unhealthy` 時 badge 顯示橘紅色並標註原因（empty canary / DOM broken）
2. 關鍵字卡片 `KeywordCard` 的平台標籤旁，若該平台 `unhealthy`，加上警示 icon（小圖示），hover tooltip 顯示原因與 `lastRunAt`

**理由：** Dashboard 給 operator 總覽；關鍵字卡片給一般使用者在 context 內看到「這個平台可能有問題」，不需要特別進入儀表板才發現。

**替代方案：** 只顯示在 Dashboard → 否決，一般使用者不一定會看 Dashboard；只顯示在關鍵字卡片 → 否決，operator 需要一覽式檢視。

## Risks / Trade-offs

- **[Risk] Canary keyword 本身熱度下降導致誤報**（例：某天「初音」在 Melonbooks 真的剛好 0 筆）
  → Mitigation：連續 2 次 0 筆才轉 `unhealthy`；operator 看到 UI badge 可判斷是否調整 canary keyword

- **[Risk] DOM 結構檢查的 selector 本身也會隨改版失效，造成檢查邏輯本身 false positive/negative**
  → Mitigation：選擇檢查「最外層、最穩定的容器」（例如 `<main>`、`body > .container`），而非深層元素；搭配 canary 雙保險

- **[Risk] UI 警示可能被使用者忽略（相較於 Discord 推播）**
  → 接受：本提案明確選擇「不打擾」作為設計方向；若 operator 希望主動告警，未來可加 opt-in 設定，不在本 change 範圍

- **[Risk] 每輪加 canary 執行會延長 scan cycle 總時間（12 平台 × 單次 ~3 秒 ≈ 36 秒）**
  → Mitigation：canary 在使用者 scan 完成後執行，不影響使用者通知延遲；若 GitHub Actions 觸及 timeout，可改為每 N 輪執行一次 canary

- **[Trade-off] Canary 佔用目標網站資源**
  → 接受：每平台每小時一次的查詢對目標網站負擔極小

- **[Risk] 新增 DB 表需執行 migration，部署時要注意順序（Worker 先部署會打到不存在的 endpoint）**
  → Mitigation：部署順序為 webapp migrate → webapp deploy → worker 更新。Worker 端呼叫 canary API 失敗時只記 log 不 raise，不影響主流程

## Migration Plan

1. 於 webapp 建立 `PlatformCanaryStatus` migration，local 跑 `prisma migrate dev` 產生 SQL
2. webapp 部署（Vercel 自動 deploy 時跑 `prisma migrate deploy`），包含 API route 與前端 badge 元件
3. 確認 `/api/worker/canary-status` route 可用、`/api/platform-status` 已回傳 `healthState`
4. Worker 端加 `canary.py`、`check_dom_structure()`、`scheduler.py` 整合
5. GitHub Actions 下一次排程自動觸發 canary
6. 觀察 24–48 小時，確認各平台 `healthState` 穩定為 `healthy`
7. Rollback：若 canary 產生大量誤報，於 `scheduler.py` 將 canary 呼叫以 env flag 停用（`ENABLE_CANARY=false`）即可，DB 資料保留不動

## Open Questions

- Canary 是否要支援「多個關鍵字輪流」以降低單一關鍵字下架的風險？（初版單一關鍵字夠用）
- 關鍵字卡片警示 icon 是否要附「X 天未見新品」等輔助資訊？初版僅顯示平台層級健康狀態，不混合關鍵字層級統計
