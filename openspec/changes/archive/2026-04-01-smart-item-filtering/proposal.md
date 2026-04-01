## Why

目前關鍵字監控只有「排除詞（blocklist）」與「價格區間」兩種過濾條件，容易捕捉到大量與用戶需求不符的商品，造成通知疲勞。用戶沒有辦法告訴系統「我要的商品」（必包詞），也無法從通知記錄直接回饋「這類商品不要再推」，導致系統只能「為了抓而抓」，而非針對真正感興趣的商品。

## What Changes

- 每個關鍵字新增**必包詞（mustInclude）**欄位：商品名稱必須包含所有必包詞才會通知，Worker 端在 blocklist 過濾後立即套用
- 每個關鍵字新增**搜尋精確度模式（matchMode）**：`any`（預設，現有行為）或 `all`（商品名稱必須包含關鍵字的每個詞）或 `exact`（商品名稱必須包含完整關鍵字字串）
- 通知記錄（/history）新增**快速禁詞回饋**：每筆通知旁新增「加入禁詞」按鈕，點擊後可將自訂詞加入該關鍵字的 blocklist，讓用戶透過使用習慣逐步精煉過濾條件

## Non-Goals

- 不實作機器學習或自動特徵抽取（本次回饋機制為手動加詞）
- 不修改平台搜尋 URL 或搜尋 API 參數（精確過濾在 Worker 端完成，不影響抓取範圍）
- 不支援正規表達式或進階語法過濾
- 不實作「喜歡」評分或推薦演算法

## Capabilities

### New Capabilities

- `item-must-include-filter`: 必包詞過濾 — Keyword 新增 `mustInclude String[]` 欄位，Worker 在回傳前過濾掉名稱未包含全部必包詞的商品
- `search-match-mode`: 搜尋精確度模式 — Keyword 新增 `matchMode` 欄位（`any` / `all` / `exact`），Worker 在 mustInclude 之前依模式過濾商品名稱
- `history-blocklist-feedback`: 通知回饋加禁詞 — /history 頁面每筆通知新增「加入禁詞」操作，呼叫 API 將指定詞追加至關鍵字的 blocklist

### Modified Capabilities

- `keyword-management`: Keyword model 新增 `mustInclude String[]` 與 `matchMode String` 欄位；CRUD API 及 UI（KeywordForm、KeywordList）對應支援必包詞 tag 輸入與模式下拉選單
- `keyword-search`: Worker 過濾流程擴充 mustInclude 及 matchMode 檢查，緊接在 blocklist 過濾後執行
- `notification-history`: /history 頁面新增每筆通知的「加入禁詞」按鈕與互動邏輯

## Impact

- Affected specs: `item-must-include-filter`（新）、`search-match-mode`（新）、`history-blocklist-feedback`（新）、`keyword-management`（修改）、`keyword-search`（修改）、`notification-history`（修改）
- Affected code:
  - `webapp/prisma/schema.prisma` — Keyword model 新增欄位 + migration
  - `webapp/app/api/keywords/route.ts` — POST 接受 mustInclude、matchMode
  - `webapp/app/api/keywords/[id]/route.ts` — PATCH 接受 mustInclude、matchMode
  - `webapp/app/api/worker/keywords/route.ts` — 回傳 mustInclude、matchMode
  - `webapp/app/api/history/[id]/blocklist/route.ts` — 新 API：追加禁詞至關鍵字
  - `webapp/components/KeywordForm.tsx` — 新增 mustInclude tag 輸入、matchMode 下拉
  - `webapp/components/KeywordList.tsx` — 顯示 mustInclude tag、matchMode badge
  - `webapp/app/history/page.tsx` — 每筆通知新增「加入禁詞」按鈕
  - `webapp/components/HistoryFeedbackButton.tsx` — 新元件
  - `src/scheduler.py` — 傳遞 mustInclude、matchMode 至 scraper 過濾
  - `src/scrapers/shopee.py` — 新增 mustInclude + matchMode 過濾邏輯
  - `src/scrapers/ruten.py` — 同上
