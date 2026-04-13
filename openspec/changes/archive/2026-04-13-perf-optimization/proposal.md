## Why

HAR 分析顯示 `/api/history`、`/api/keywords`、`/api/circles` 回應時間達 3-4.5 秒（TTFB 佔 99%），且同一頁面內存在大量重複請求（浪費 38.7 秒），導致 `/status` 頁面載入需 3.5 秒。主要瓶頸為資料庫查詢缺乏 index、Neon serverless 連線開銷、API 無快取設定，以及前端 RSC/useEffect 觸發重複 fetch。

## What Changes

- 在 Prisma schema 新增 `SeenItem`、`Notification`、`ScanLog` 的複合 index，加速常用查詢
- Neon PostgreSQL 連線字串改用 pgbouncer connection pooling
- `/api/history`、`/api/keywords`、`/api/circles` 加入 `Cache-Control: stale-while-revalidate` 回應 header
- 排查並消除前端重複 API fetch（RSC prefetch 問題、useEffect dependency 不穩定）
- 使用 React Suspense boundary 讓頁面 skeleton 先渲染，API 資料非同步填入

## Non-Goals

- 不引入 Redis 或外部快取層（Vercel + Neon 架構下不需要）
- 不更動 Worker Python 端程式碼
- 不改變 API 回應資料結構或行為語義

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `notification-history`：`/api/history` 加入快取 header，查詢加 index
- `keyword-management`：`/api/keywords` 加入快取 header，查詢加 index
- `circle-follow`：`/api/circles` 加入快取 header，查詢加 index
- `loading-skeleton-ui`：擴展 Suspense boundary 至 /status、/history 頁面，確保非同步資料載入時顯示 skeleton

## Impact

- Affected specs: notification-history, keyword-management, circle-follow, loading-skeleton-ui
- Affected code:
  - `webapp/prisma/schema.prisma`（新增 index）
  - `webapp/.env.example`（pgbouncer 連線字串說明）
  - `webapp/app/api/history/route.ts`
  - `webapp/app/api/keywords/route.ts`
  - `webapp/app/api/circles/route.ts`
  - `webapp/app/(dashboard)/history/page.tsx`（Suspense boundary）
  - `webapp/app/(dashboard)/status/page.tsx`（Suspense boundary）
  - `webapp/components/`（相關 client component 檢查 useEffect dependency）
