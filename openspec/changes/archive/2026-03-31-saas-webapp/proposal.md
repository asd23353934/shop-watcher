## Why

Shop Watcher 目前為單機 CLI 工具，無法支援多人使用。需要建立完整的 SaaS 網頁應用，讓任意用戶皆能透過瀏覽器自助設定關鍵字監控，並接收 Discord 或 Email 通知，無需直接操作程式碼或設定檔。

## What Changes

- **新增** Google OAuth 用戶認證（NextAuth.js）：用戶以 Google 帳號登入，自動建立帳號
- **新增** Keyword CRUD Dashboard：用戶可新增、編輯、刪除關鍵字，設定平台（Shopee/Ruten）、價格範圍、掃描間隔
- **新增** 通知設定頁面：用戶可設定個人 Discord Webhook URL + Discord User ID、Resend Email 地址
- **新增** Worker API 端點：`GET /api/worker/keywords` 回傳所有 active keyword；`POST /api/worker/notify` 接收 Worker 回報的商品，執行去重與通知發送
- **新增** 商品去重機制：`seen_items` table（PostgreSQL）記錄已通知商品，避免重複通知
- **新增** Discord 通知發送：Next.js API 依用戶設定呼叫 Discord Webhook，embed 含商品名、價格、圖片、連結，`<@userId>` mention
- **新增** Email 通知發送：Next.js API 透過 Resend 寄送 HTML Email，內含商品清單
- **新增** PostgreSQL 資料模型（Prisma）：`User`、`Keyword`、`NotificationSetting`、`SeenItem` tables
- **移除** config.yaml 驅動的關鍵字設定（改由資料庫管理）

## Capabilities

### New Capabilities

- `user-auth`: Google OAuth 登入 / 登出（NextAuth.js）；session 管理；未登入自動導向登入頁
- `keyword-management`: Keyword CRUD（新增/編輯/刪除）；欄位：keyword 文字、platforms（多選）、min_price、max_price、active 開關；每用戶隔離
- `notification-settings`: 用戶設定個人通知管道：Discord Webhook URL + Discord User ID；Resend Email 收件地址；設定儲存至 `NotificationSetting` table
- `worker-api`: Worker 專用 API 端點：`GET /api/worker/keywords`（WORKER_SECRET Bearer 驗證，回傳所有 active keyword）；`POST /api/worker/notify`（接收商品，執行去重，觸發通知）
- `item-deduplication`: `seen_items` table 去重邏輯；以 `(user_id, platform, item_id)` 為 unique key；相同商品同一用戶只通知一次
- `discord-notify`: Next.js API 依用戶 Discord 設定呼叫 Webhook；Embed 包含平台色彩、商品名、價格、圖片縮圖、`<@userId>` mention
- `email-notify`: Next.js API 透過 Resend SDK 發送 HTML Email；每次掃描週期將新商品彙整成一封信

### Modified Capabilities

（無 — saas-webapp 為全新專案，不修改現有 worker spec）

## Impact

- **新增依賴**: `next@15`、`next-auth@5`、`@prisma/client`、`prisma`、`resend`、`@types/node`
- **新增服務**: Neon.tech PostgreSQL（免費）、Resend（免費 3,000/月）、Google OAuth（Google Cloud Console）
- **新增設定**: `NEXTAUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`DATABASE_URL`、`RESEND_API_KEY`、`WORKER_SECRET`
- **新增檔案**:
  - `webapp/` — Next.js 15 App Router 專案根目錄
  - `webapp/prisma/schema.prisma` — Prisma schema（User, Keyword, NotificationSetting, SeenItem）
  - `webapp/app/` — App Router 頁面（login, dashboard, settings）
  - `webapp/app/api/` — API routes（auth, worker/keywords, worker/notify）
  - `webapp/components/` — React 元件（KeywordForm, KeywordList, NotificationForm）
- **部署**: Vercel（Next.js）+ Neon.tech（PostgreSQL）
