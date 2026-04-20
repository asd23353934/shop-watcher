## Why

當用戶累積大量關鍵字與社團追蹤時，現有 Dashboard 與 Circles 頁面只能按建立順序排列，難以依主題（例如某個 IP、某位作者、某類商品）快速定位相關項目。單純的名稱搜尋無法跨資源分類，也不支援一次看多個相關關鍵字 + 社團的狀況。引入使用者自訂標籤系統，讓關鍵字與社團追蹤共用同一組標籤，可依標籤快速篩選並跨資源管理。

## What Changes

- 新增 `Tag` 資料表：userId scoped、`(userId, name)` 唯一、可選 `color` 欄位（hex 色碼）
- 新增 `KeywordTag` / `CircleFollowTag` join tables，支援多對多關聯
- 新增 Tag CRUD API：`GET/POST /api/tags`、`PATCH/DELETE /api/tags/[id]`
- Keyword API（`POST /api/keywords`、`PATCH /api/keywords/[id]`）新增 `tagIds: string[]` 欄位
- CircleFollow API（`POST /api/circles`、`PATCH /api/circles/[id]`）新增 `tagIds: string[]` 欄位
- `GET /api/keywords` 與 `GET /api/circles` 回應中包含各自關聯的 tags
- Dashboard 頁面新增 tag filter chip 區域，支援多選過濾（AND 邏輯：同時具備所選全部 tag 才顯示）
- Circles 頁面新增相同的 tag filter chip
- Keyword 卡片與 Circle 卡片顯示其 tags（帶顏色）
- 編輯 modal 新增 tag 選擇器，支援選擇既有 tag 與建立新 tag

## Non-Goals

- 不支援 tag 階層（parent/child）
- 不支援跨使用者共用 tag
- 不提供 OR filter 模式（首版只做 AND，若未來有需求再加）
- 不對 SeenItem / NotificationLog 加標籤
- 不影響 Worker 行為與通知流程（tag 僅為 UI 與查詢用）

## Capabilities

### New Capabilities

- `resource-tagging`: 使用者可建立、編輯、刪除個人標籤，並將標籤套用到 Keyword 與 CircleFollow；Dashboard 與 Circles 頁面可依標籤篩選

### Modified Capabilities

- `keyword-management`: Keyword 建立/更新請求新增可選 `tagIds` 欄位，列表回應包含 tags
- `circle-follow`: CircleFollow 建立/更新請求新增可選 `tagIds` 欄位，列表回應包含 tags

## Impact

- Affected specs:
  - 新增 `openspec/specs/resource-tagging/`
  - 修改 `openspec/specs/keyword-management/`
  - 修改 `openspec/specs/circle-follow/`
- Affected code:
  - `webapp/prisma/schema.prisma`（新增 Tag / KeywordTag / CircleFollowTag model、加 migration）
  - `webapp/app/api/tags/route.ts`（新）
  - `webapp/app/api/tags/[id]/route.ts`（新）
  - `webapp/app/api/keywords/route.ts`、`webapp/app/api/keywords/[id]/route.ts`（加 tagIds 欄位處理）
  - `webapp/app/api/circles/route.ts`、`webapp/app/api/circles/[id]/route.ts`（加 tagIds 欄位處理）
  - `webapp/app/dashboard/page.tsx` 或對應 client component（tag filter chip、卡片顯示 tag、編輯 modal tag 選擇器）
  - `webapp/app/circles/page.tsx` 或對應 client component（同上）
  - 新增 `webapp/components/TagChip.tsx`、`webapp/components/TagSelector.tsx`、`webapp/components/TagFilterBar.tsx`
- 不影響：Worker（Python）、通知邏輯（discord.ts / email.ts）、SeenItem、NotificationLog
