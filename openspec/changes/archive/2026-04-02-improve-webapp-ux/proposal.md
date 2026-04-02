## Why

目前 webapp 功能完整，但使用者介面缺乏即時回饋（無 Toast、無 Skeleton）、空狀態無引導、行動裝置導覽缺失，導致整體操作體驗生硬。提升 UI/UX 可降低用戶困惑、提高留存率。

## What Changes

- **引入 shadcn/ui**：作為統一 UI 元件基礎，使用 `npx shadcn@latest init` 初始化；安裝 `sonner`（Toast）、`skeleton`、`badge`、`button`、`switch` 元件
- 新增全域 Toast 通知系統：改用 shadcn/ui 的 **Sonner**（`<Toaster>`），取代目前的 inline 成功/失敗文字
- 新增 Loading Skeleton：使用 shadcn/ui **Skeleton** 元件，Dashboard 與關鍵字列表載入期間顯示佔位動畫
- 新增 Empty State 元件（自行實作），無關鍵字時顯示引導文字，無通知歷史時顯示空狀態提示
- 重設計關鍵字卡片：使用 shadcn/ui **Badge** 顯示平台標籤、**Switch** 做啟用/停用 toggle、價格區間顯示、最後掃描時間
- 改善 Dashboard 佈局：頁面標題、統計數字區塊（關鍵字數量、今日通知數）、更清晰的 section 分隔
- Navbar 加入 hamburger menu，解決小螢幕無法導覽的問題
- 關鍵字卡片在手機上的 action buttons 使用 shadcn/ui **Button** 加大點擊區域

## Non-Goals

- 不更動任何後端 API 或資料庫 schema
- 不改動 Python Worker 相關程式碼
- 不新增新的功能性需求（例如批次刪除關鍵字）
- 不調整 Discord / Email 通知邏輯

## Capabilities

### New Capabilities

- `toast-notification-ui`: 全域 Toast 通知系統，提供成功、失敗、資訊三種類型，右下角滑入動畫，自動消失
- `loading-skeleton-ui`: 通用 Skeleton 佔位元件，用於 Dashboard 卡片與關鍵字列表的載入狀態
- `empty-state-ui`: 空狀態引導元件，針對無關鍵字與無通知歷史情境提供插圖與引導文字

### Modified Capabilities

- `keyword-management`: 關鍵字卡片重設計（新增平台 badge、價格區間、toggle 視覺、掃描時間）；表單操作改用 Toast 回饋取代 inline 文字
- `notification-history`: 無通知歷史時套用 Empty State 元件

## Impact

- Affected specs: `toast-notification-ui`（新）、`loading-skeleton-ui`（新）、`empty-state-ui`（新）、`keyword-management`（修改）、`notification-history`（修改）
- Affected code:
  - `webapp/app/layout.tsx` — 加入 ToastProvider
  - `webapp/app/dashboard/page.tsx` — 統計區塊、Skeleton、Empty State 整合
  - `webapp/components/KeywordList.tsx` — 卡片重設計、Skeleton、Empty State
  - `webapp/components/KeywordForm.tsx` — Toast 取代 inline 回饋
  - `webapp/app/history/page.tsx` — Empty State 整合
  - `webapp/components/Navbar.tsx` — hamburger menu（行動裝置）
  - 新增 `webapp/components/ui/sonner.tsx`（shadcn/ui Sonner wrapper）
  - 新增 `webapp/components/ui/skeleton.tsx`（shadcn/ui Skeleton）
  - 新增 `webapp/components/ui/badge.tsx`（shadcn/ui Badge）
  - 新增 `webapp/components/ui/button.tsx`（shadcn/ui Button）
  - 新增 `webapp/components/ui/switch.tsx`（shadcn/ui Switch）
  - 新增 `webapp/components/EmptyState.tsx`
  - 新增 `webapp/components/ui/lib/utils.ts`（shadcn/ui cn() helper）
  - 修改 `webapp/tailwind.config.ts` — shadcn/ui theme tokens
  - 修改 `webapp/app/globals.css` — shadcn/ui CSS variables
