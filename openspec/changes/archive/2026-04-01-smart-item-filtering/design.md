## Context

Shop Watcher 目前的商品過濾管線為：
1. 平台搜尋（蝦皮 / 露天）→ 抓取商品列表
2. 價格區間過濾（`_apply_price_filter`）
3. Blocklist 過濾（Worker `scheduler.py`）
4. SeenItem 去重（API 端）

過濾條件僅有「排除詞」與「價格區間」，用戶無法指定商品名稱**必須**包含哪些詞，也無法選擇關鍵字的比對精確度。通知記錄頁面（`/history`）目前只能查看，沒有回饋入口，讓用戶調整過濾設定的路徑過長（需回 Dashboard 手動編輯禁詞）。

技術限制：Worker 為無狀態 Python 程序，每次從 `/api/worker/keywords` 拉取最新設定，因此所有新欄位只需更新資料庫 + API 即可即時生效，不需重啟 Worker。

## Goals / Non-Goals

**Goals:**

- 新增 `mustInclude String[]` 欄位至 Keyword，Worker 過濾名稱未包含所有必包詞的商品
- 新增 `matchMode String` 欄位（預設 `any`），控制關鍵字本身的比對精確度
- /history 頁面讓用戶快速將詞加入對應關鍵字的 blocklist
- 所有新欄位向後相容：既有關鍵字保持 mustInclude = []、matchMode = "any"，行為不變

**Non-Goals:**

- 不修改平台搜尋請求參數（精確過濾在 Worker 客戶端完成）
- 不實作自動詞彙提取或 ML 推薦
- 不支援正規表達式
- 不新增分析儀表板（點擊率、開信率等）

## Decisions

### Keyword 新增欄位採 DB Migration 方式，帶預設值

**決策**：在 `Keyword` model 新增 `mustInclude String[] @default([])` 與 `matchMode String @default("any")`，並產生 Prisma migration。

**理由**：欄位帶預設值代表 migration 可無停機執行（backfill 為空陣列 / "any"），所有現有關鍵字行為不變。不選擇 JSON blob 欄位，因為未來過濾邏輯需要在 Python 端直接讀取陣列，強型別更清晰。

### matchMode 枚舉值：any / all / exact

**決策**：
- `any`（預設）：商品名稱包含關鍵字中任一詞即可（現有行為，搜尋引擎本身已做此事）
- `all`：商品名稱必須包含關鍵字以空白分割後的**所有**詞
- `exact`：商品名稱必須包含**完整關鍵字字串**（子字串比對，大小寫不分）

**理由**：三種模式覆蓋常見需求：`any` 對單詞關鍵字無意義差異；`all` 適合「機械 鍵盤 87鍵」需同時出現；`exact` 適合品牌型號比對。不採用搜尋引擎語法（`"..."` 引號），因為 UX 複雜且需要 parser。

### mustInclude 過濾在 blocklist 之後、notifyBatch 之前

**決策**：Worker (`scheduler.py`) 的過濾順序：
1. `_apply_price_filter`
2. `_apply_blocklist_filter`（現有）
3. `_apply_must_include_filter`（新增）
4. `_apply_match_mode_filter`（新增）
5. 呼叫 `notify_batch`

**理由**：blocklist 先排除明顯不要的商品，再做必包詞過濾，最後做搜尋模式過濾。這樣每一層的輸入規模都在縮小，且語意上「先排除再要求」更直覺。

### 歷史回饋 API：PATCH /api/keywords/[id]/blocklist

**決策**：新增 API endpoint `PATCH /api/keywords/[id]/blocklist`，body 為 `{ word: string }`，將 `word` append 至該關鍵字的 `blocklist`（去重）。

**理由**：與現有 `/api/keywords/[id]` PATCH 分開，語意更明確（只做 append，不替換整個陣列），前端不需先 fetch 完整關鍵字再合併。用戶在 /history 點擊「加入禁詞」時，API 可直接以 keyword ID 呼叫。

`NotificationHistory` 已記錄 `keywordId`，所以 /history 頁面可直接取得 keyword ID 傳入。

### 前端 UI：複用現有 blocklist tag 元件模式

**決策**：mustInclude 欄位的 UI 與 blocklist 完全相同（tag 輸入 + 刪除）；matchMode 使用下拉選單（`<select>`），選項為 `any / all / exact`，顯示中文標籤。

**理由**：blocklist tag UI 剛在本 sprint 實作，直接複用降低學習成本與實作時間。

## Risks / Trade-offs

- **[過濾過嚴導致 0 通知]** 用戶設定 mustInclude 後一個商品都抓不到，系統無任何提示 → Worker 目前不回報「因過濾損失多少商品」，用戶難以診斷。暫時接受；未來可在 ScanLog 記錄過濾統計。
- **[matchMode `exact` 中文分詞]** 中文不以空格分詞，`all` 模式對「機械鍵盤」（無空格）等同 `exact` → 文件說明使用者應以空格分隔詞彙（如「機械 鍵盤」）才能發揮 `all` 效果。
- **[history 頁面 keywordId 可能為 null]** 舊版通知記錄若關鍵字被刪除，`keywordId` 為 null → 「加入禁詞」按鈕在 keywordId 為 null 時 disabled，tooltip 提示「關鍵字已刪除」。

## Migration Plan

1. 新增 Prisma migration（加 `mustInclude`、`matchMode` 欄位，帶預設值）
2. 執行 `prisma migrate deploy`（不影響既有資料）
3. 部署 Next.js（API 更新）
4. 部署 Worker（過濾邏輯更新）

Rollback：刪除 migration 並 revert Worker，資料庫欄位保留（帶預設值不影響舊版 API 運作）。
