## 1. 資料庫 Migration（Keyword 新增欄位採 DB Migration 方式，帶預設值）

- [x] 1.1 在 `webapp/prisma/schema.prisma` 的 `Keyword` model 新增 `mustInclude String[] @default([])` 與 `matchMode String @default("any")` 兩個欄位，符合「Keyword supports a mustInclude list of required terms」與「Keyword matchMode controls how keyword text is matched against item names」規格
- [x] 1.2 執行 `npx prisma migrate dev --name add_keyword_must_include_match_mode` 產生並套用 migration 檔，確認既有資料列 `mustInclude` 預設為空陣列、`matchMode` 預設為 `"any"`

## 2. API 後端

- [x] 2.1 修改 `webapp/app/api/keywords/route.ts`（POST）：接受 `mustInclude`（string[]）與 `matchMode`（`"any"` | `"all"` | `"exact"`）；對 `matchMode` 無效值回傳 HTTP 400；符合「Keyword creation accepts mustInclude and matchMode fields」
- [x] 2.2 修改 `webapp/app/api/keywords/[id]/route.ts`（PATCH）：接受並更新 `mustInclude` 與 `matchMode`；符合「Keyword edit accepts mustInclude and matchMode fields」
- [x] 2.3 修改 `webapp/app/api/worker/keywords/route.ts`：在每筆關鍵字回傳中加入 `mustInclude` 與 `matchMode` 欄位，使 Worker 可讀取這兩個新過濾條件
- [x] 2.4 新增 `webapp/app/api/keywords/[id]/blocklist/route.ts`（PATCH）：接受 `{ word: string }`，空白字串回 HTTP 400，不擁有關鍵字回 HTTP 403，已存在的詞靜默忽略（不重複加入）；符合「User can add a word to a keyword's blocklist from notification history」與設計「歷史回饋 API：PATCH /api/keywords/[id]/blocklist」

## 3. Python Worker 過濾邏輯

- [x] 3.1 在 `src/scheduler.py` 中新增 `_apply_must_include_filter(items, must_include)` 函式：過濾名稱未包含所有必包詞（大小寫不分）的商品，在 blocklist 過濾後、`notify_batch` 前呼叫；符合「Scraped items are filtered by mustInclude before notification」
- [x] 3.2 在 `src/scheduler.py` 中新增 `_apply_match_mode_filter(items, keyword_text, match_mode)` 函式：依 `any`（含任一 token）、`all`（含所有 token）、`exact`（含完整子字串）過濾商品名稱（大小寫不分）；在 mustInclude 過濾後呼叫；符合「Scraped items are filtered by matchMode before notification」與設計「mustInclude 過濾在 blocklist 之後、notifyBatch 之前」與「matchMode 枚舉值：any / all / exact」
- [x] 3.3 修改 `src/scheduler.py` 的掃描主迴圈：從 `kw` dict 讀取 `must_include`（預設 `[]`）與 `match_mode`（預設 `"any"`），在 blocklist 過濾後依序呼叫 `_apply_must_include_filter` 和 `_apply_match_mode_filter`

## 4. 前端 UI — 關鍵字表單與列表（複用現有 blocklist tag 元件模式）

- [x] 4.1 修改 `webapp/components/KeywordForm.tsx`：新增 `mustInclude` tag 輸入欄位（與 blocklist 相同的 tag 新增 / 刪除 UI）；確認 blocklist 欄位同樣以 tag 輸入呈現（「Keyword supports a blocklist of forbidden terms」MODIFIED 規格）；符合「Keyword creation accepts mustInclude and matchMode fields」與設計「前端 UI：複用現有 blocklist tag 元件模式」
- [x] 4.2 修改 `webapp/components/KeywordForm.tsx`：新增 `matchMode` 下拉選單（`<select>`），選項為 `any`（寬鬆比對）、`all`（每詞都要有）、`exact`（完整字串）；預設選取 `any`
- [x] 4.3 修改 `webapp/components/KeywordList.tsx`：`Keyword` interface 加入 `mustInclude: string[]` 與 `matchMode: string`；view mode 以 tag 顯示 mustInclude 詞彙（綠色底）並顯示 matchMode badge；edit mode 加入 mustInclude tag 輸入與 matchMode 下拉；符合「Keyword edit accepts mustInclude and matchMode fields」

## 5. 通知記錄頁面回饋功能（History 快速加禁詞）

- [x] 5.1 新增 `webapp/components/HistoryFeedbackButton.tsx`：client component，接受 `keywordId: string | null` prop；`keywordId` 為 null 時顯示 disabled 按鈕 + tooltip「關鍵字已刪除」；`keywordId` 非 null 時點擊後展開 inline input + submit 按鈕，呼叫 `PATCH /api/keywords/{keywordId}/blocklist`；成功後顯示「已加入禁詞」，失敗顯示錯誤訊息；符合「Notification history page shows a quick-add-to-blocklist action per item」與「History page shows a quick-add-to-blocklist action per notification」
- [x] 5.2 修改 `webapp/app/history/page.tsx`：在每筆通知記錄旁引入 `HistoryFeedbackButton`，傳入 `keywordId`（由現有的 SeenItem 查詢中取得）
