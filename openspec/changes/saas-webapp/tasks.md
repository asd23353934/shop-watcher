## 1. 專案初始化（Next.js 15 App Router + TypeScript）

- [x] 1.1 在 `webapp/` 目錄執行 `npx create-next-app@15 . --typescript --app --tailwind --eslint`，確認 Next.js 15 App Router + TypeScript 專案建立成功（`webapp/` 子目錄，與 Worker 同倉庫）
- [x] 1.2 在 `webapp/` 安裝依賴：`npm install next-auth@beta @prisma/client prisma resend`；確認 `package.json` 包含 `next@15`、`next-auth@5`、`@prisma/client`、`resend`
- [x] 1.3 建立 `webapp/.env.local`（不進 git），填入 `NEXTAUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`DATABASE_URL`、`RESEND_API_KEY`、`RESEND_FROM_EMAIL`、`WORKER_SECRET`；確認 `.env.local` 已列於 `.gitignore`

## 2. Prisma Schema 與資料庫（Prisma + Neon.tech PostgreSQL 決策）

- [x] 2.1 建立 `webapp/prisma/schema.prisma`：定義 `User`（id, email, name, image, createdAt）、`Keyword`（id, userId, keyword, platforms String[], minPrice, maxPrice, active, createdAt）、`NotificationSetting`（id, userId, discordWebhookUrl, discordUserId, emailAddress）、`SeenItem`（id, userId, platform, itemId, keyword, firstSeen）；`SeenItem` 加入 `@@unique([userId, platform, itemId])`（`SeenItem table records notified items with user, platform, and item_id as unique key`、`SeenItem unique constraint prevents duplicate rows`）
- [x] 2.2 在 Neon.tech 建立 PostgreSQL DB，取得 `DATABASE_URL`（格式 `postgresql://...`）；在 `webapp/` 執行 `npx prisma migrate dev --name init`，確認 4 個 tables 成功建立
- [x] 2.3 執行 `npx prisma generate` 產生 Prisma Client；確認 `import { PrismaClient } from '@prisma/client'` 可正常編譯

## 3. 用戶認證（user-auth）

- [x] 3.1 在 Google Cloud Console 建立 OAuth 2.0 Client ID，授權 redirect URI 為 `http://localhost:3000/api/auth/callback/google`；填入 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`（NextAuth.js v5（Auth.js）僅支援 Google OAuth 決策）
- [x] 3.2 建立 `webapp/auth.ts`：設定 NextAuth.js v5（`strategy: "jwt"`，`Session is managed via JWT without a database session table`）；加入 Google Provider；在 `signIn` callback 中以 Prisma upsert 建立或更新 `User` 記錄（`User can sign in with Google OAuth`）
- [x] 3.3 建立 `webapp/app/api/auth/[...nextauth]/route.ts` 匯出 NextAuth handlers
- [x] 3.4 建立 `webapp/middleware.ts`：以 NextAuth `auth()` middleware 保護 `/dashboard` 與 `/settings` 路徑；未登入時 redirect 至 `/login`（`Unauthenticated users are redirected to the login page`）
- [x] 3.5 建立 `webapp/app/login/page.tsx`：顯示 "Sign in with Google" 按鈕（呼叫 `signIn("google")`）；確認未認證用戶可直接存取（`Sign-in page is accessible without authentication`）
- [x] 3.6 驗證完整登入流程：`npm run dev` → 點擊 Sign in with Google → OAuth consent → redirect `/dashboard` → 確認 `User` 資料庫記錄建立（`First-time Google sign-in creates a user record`）
- [x] 3.7 在 dashboard layout 加入登出按鈕（呼叫 `signOut()`）；確認登出後 redirect `/login` 且 JWT 已清除（`Authenticated user can sign out`）

## 4. Keyword CRUD Dashboard（keyword-management）

- [x] 4.1 建立 `webapp/app/api/keywords/route.ts`（GET + POST）：GET 回傳 session user 的所有 `Keyword`（`User's keyword list shows only their own keywords`）；POST 建立新 keyword（驗證 keyword 非空、至少一個 platform），否則回傳 400（`Keyword creation with empty keyword string is rejected`、`Keyword creation with no platform selected is rejected`）
- [x] 4.2 建立 `webapp/app/api/keywords/[id]/route.ts`（PATCH + DELETE）：驗證 `keyword.userId === session.user.id`，不符合回傳 403（`User cannot edit another user's keyword`、`User cannot delete another user's keyword`）；PATCH 更新欄位；DELETE 刪除 keyword 但保留 SeenItem（`SeenItem rows are preserved after a keyword is deleted`、`Deleting a keyword does not delete its SeenItem history`）
- [x] 4.3 建立 `webapp/components/KeywordForm.tsx`：表單欄位含 keyword 文字、platforms 多選（shopee/ruten checkboxes）、minPrice、maxPrice、active toggle；送出呼叫 `POST /api/keywords`
- [x] 4.4 建立 `webapp/components/KeywordList.tsx`：列出 keywords；每筆顯示 active toggle（呼叫 `PATCH /api/keywords/[id]`，`User can toggle a keyword's active status`）、編輯按鈕、刪除按鈕；空列表時顯示 call-to-action（`Empty keyword list shows a call-to-action`）
- [x] 4.5 建立 `webapp/app/dashboard/page.tsx`：整合 KeywordList + KeywordForm；以 Server Component 初始載入 keywords；確認 `Authenticated user can create a keyword`、`Authenticated user can edit an existing keyword`、`Authenticated user can delete a keyword` 完整流程

## 5. 通知設定（notification-settings）

- [x] 5.1 建立 `webapp/app/api/settings/route.ts`（GET + POST）：GET 回傳 session user 的 `NotificationSetting`（`Settings are pre-filled with existing values on load`）；POST upsert `NotificationSetting`；驗證 `discordWebhookUrl` 必須以 `https://discord.com/api/webhooks/` 開頭（`Invalid Discord Webhook URL is rejected`）；驗證 email 格式（`Invalid email format is rejected`）
- [x] 5.2 建立 `webapp/components/NotificationForm.tsx`：欄位含 Discord Webhook URL、Discord User ID（選填）、Email 地址（選填）；送出呼叫 `POST /api/settings`；確認欄位清空時儲存為 null（`User clears email address to disable email notifications`）
- [x] 5.3 建立 `webapp/app/settings/page.tsx`：整合 NotificationForm；驗證 `Notification settings are isolated per user`（只載入 session user 的設定）；確認 `User can save Discord notification settings`、`User can save Email notification settings` 流程

## 6. Worker API（worker-api + Worker API 以 WORKER_SECRET Bearer token 驗證決策）

- [x] 6.1 建立 `webapp/lib/worker-auth.ts`：實作 `verifyWorkerToken(request)` helper，讀取 `Authorization` header，比對 `WORKER_SECRET`；不符合回傳 `Response 401`
- [x] 6.2 建立 `webapp/app/api/worker/keywords/route.ts`（GET）：呼叫 `verifyWorkerToken()`；以 Prisma join 查詢所有 `active = true` 的 `Keyword` 及其 user 的 `NotificationSetting`；回傳 JSON 陣列（`GET /api/worker/keywords returns all active keywords with user notification settings`、`No active keywords returns empty array`）
- [x] 6.3 建立 `webapp/app/api/worker/notify/route.ts`（POST）：呼叫 `verifyWorkerToken()`；驗證 payload 含 `keyword_id`、`item_id`（`Invalid payload returns 400`）；查詢 Keyword 取得 `userId`（`Unknown keyword_id returns 404`）；執行 `SeenItem` unique 檢查（`POST /api/worker/notify receives a scraped item and triggers deduplication and notifications`、`Deduplication is scoped per user`）；插入 SeenItem 後觸發 Discord + Email 通知；回傳 `{ status: "new" }` 或 `{ status: "duplicate" }`

## 7. Discord 通知（discord-notify）

- [x] 7.1 建立 `webapp/lib/discord.ts`：實作 `sendDiscordNotification(webhookUrl, discordUserId, item, keyword)` 函式；建構 Embed payload（title 連結、platform 顏色 `0xEE4D2D`/`0x0066CC`、price 格式 `NT$ {n:,}` 或 `價格未知`、thumbnail）（`New item triggers a Discord Embed notification via the user's Webhook URL`、`Discord Embed is sent with item details`、`Embed color reflects the platform`）
- [x] 7.2 實作 `content` 欄位邏輯：`discordUserId` 非 null 時 `<@{discordUserId}> 發現新商品！`，否則 `發現新商品！`（`User mention is included when discordUserId is set`、`No mention when discordUserId is null`）
- [x] 7.3 在 `sendDiscordNotification` 中 try/catch Webhook POST 錯誤：非 2xx 回應或網路例外時 log 錯誤，不拋出（`Discord Webhook errors do not block the notify response`）；`discordWebhookUrl` 為 null 時直接 return（`Discord notification is skipped when no Webhook URL is configured`）
- [x] 7.4 在 `POST /api/worker/notify` handler 中，SeenItem 插入成功後呼叫 `sendDiscordNotification()`；確認 Webhook 失敗時 response 仍回傳 HTTP 200

## 8. Email 通知（email-notify）

- [x] 8.1 建立 `webapp/lib/email.ts`：import `Resend` SDK（`Resend SDK 發送 Email；每次 notify 累積後單封彙整`）；實作 `sendEmailNotification(emailAddress, item, keyword)`；`subject` 含商品名（超過 60 字元截斷加 `...`）（`Email subject shows item name truncated to 60 characters`）；`html` 包含商品名、平台、價格、連結、圖片（`New item triggers an Email notification via Resend`）
- [x] 8.2 實作 sender 讀取 `RESEND_FROM_EMAIL` 環境變數；未設定時 log 錯誤 `RESEND_FROM_EMAIL is not configured` 並 return（`Sender email address is configurable via environment variable`、`Missing RESEND_FROM_EMAIL causes a startup configuration error`）
- [x] 8.3 在 `sendEmailNotification` 中 try/catch Resend SDK 錯誤：例外時 log（含 item ID 與 user ID），不拋出（`Resend API errors do not block the notify response`）；`emailAddress` 為 null 時直接 return（`Email is skipped when no email address is configured`）
- [x] 8.4 在 `POST /api/worker/notify` handler 中，SeenItem 插入成功後呼叫 `sendEmailNotification()`；確認 Resend 失敗時 response 仍回傳 HTTP 200

## 9. 部署至 Vercel（Vercel 一鍵部署）

- [x] 9.1 確認 `webapp/` 根目錄有 `next.config.ts`；在 Vercel 建立新 Project，設定 Root Directory 為 `webapp`；連結 git repo
- [ ] 9.2 在 Vercel Project Settings → Environment Variables 加入所有必要變數：`NEXTAUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`DATABASE_URL`（Neon.tech production）、`RESEND_API_KEY`、`RESEND_FROM_EMAIL`、`WORKER_SECRET`
- [ ] 9.3 在 Google Cloud Console 新增 Vercel domain 至 OAuth 2.0 授權 redirect URI（`https://{your-vercel-domain}/api/auth/callback/google`）
- [ ] 9.4 在 Vercel 執行 `prisma migrate deploy`（透過 build command 或 Vercel 環境）；確認 production DB tables 建立
- [ ] 9.5 推送至 `main`，確認 Vercel 自動部署成功；完整驗證：Google 登入 → 建立 keyword → 設定 Discord/Email → 呼叫 `GET /api/worker/keywords` 確認回傳正確資料
