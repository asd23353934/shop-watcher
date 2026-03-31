## Context

Shop Watcher 原為單機 Python CLI 工具。本 change 將建立一個全新的 Next.js 15 SaaS 網頁應用（`webapp/` 子目錄），作為多人使用的前端 + API 層。Python Worker（`keyword-shop-watcher` change）保持無狀態，透過 HTTP API 與 Next.js 通訊。

**關鍵外部服務**：
- Google OAuth（用戶認證，免費）
- Neon.tech PostgreSQL（資料庫，免費 0.5GB）
- Resend（Email 通知，免費 3,000/月）
- Vercel（Next.js 部署，免費）

## Goals / Non-Goals

**Goals:**
- 多用戶 Google OAuth 登入，每位用戶資料隔離
- Keyword CRUD Dashboard（新增/編輯/刪除關鍵字，設定平台、價格範圍）
- 用戶個人通知設定（Discord Webhook URL + User ID、Email）
- Worker API：`GET /api/worker/keywords`、`POST /api/worker/notify`（含 Bearer token 驗證、去重、通知觸發）
- PostgreSQL 資料持久化（Prisma ORM）
- Vercel 一鍵部署

**Non-Goals:**
- 不實作自訂帳號密碼登入（只支援 Google OAuth）
- 不實作 Line / Telegram 通知（MVP 只做 Discord + Email）
- 不實作管理員後台（用戶管理）
- 不實作商品價格歷史追蹤（只通知新商品）
- 不實作多語系（繁體中文介面）
- 不實作 Discord Bot（只用 Webhook）

## Decisions

### Next.js 15 App Router + TypeScript

**決策**：使用 Next.js 15 App Router 架構，全程 TypeScript。

**理由**：
- App Router 支援 Server Components，減少前端 JS bundle 大小
- API Routes 在同一個 repo 中處理 Worker API，不需另建後端
- Vercel 對 Next.js 有 first-class 支援，部署零配置
- TypeScript 提供型別安全，減少 Prisma model 與 API 之間的型別錯誤

**替代方案考慮**：
- Remix → 生態系較小，Vercel 整合不如 Next.js 原生
- SvelteKit → 學習曲線，Prisma 生態系整合較少範例

### NextAuth.js v5（Auth.js）僅支援 Google OAuth

**決策**：使用 NextAuth.js v5（`next-auth@5 beta`），Provider 只加 Google OAuth，session 策略用 JWT。

**理由**：
- NextAuth.js 是 Next.js 生態系標準認證方案，文件完整
- Google OAuth 門檻低（用戶無需額外建立帳號），適合 SaaS 快速上線
- JWT session 無需 DB session table，簡化 Prisma schema

**替代方案考慮**：
- Clerk → 付費方案 (>10K MAU)，增加外部依賴
- 自製 email/password → 需實作密碼 hash、重設流程，MVP 成本高
- NextAuth database session → 需額外 Session table，超出 MVP 需求

### Prisma + Neon.tech PostgreSQL

**決策**：使用 Prisma ORM 連接 Neon.tech Serverless PostgreSQL。Schema 包含 4 個 model：`User`、`Keyword`、`NotificationSetting`、`SeenItem`。

**Schema 設計**：
```
User          { id, email, name, image, createdAt }
Keyword       { id, userId, keyword, platforms[], minPrice, maxPrice, active, createdAt }
NotificationSetting { id, userId, discordWebhookUrl, discordUserId, emailAddress }
SeenItem      { id, userId, platform, itemId, keyword, firstSeen }
              unique: (userId, platform, itemId)
```

**理由**：
- Prisma 提供型別安全的 DB client，與 TypeScript 整合最佳
- Neon.tech 免費方案支援 0.5GB，足夠 MVP 用量
- `SeenItem` unique constraint `(userId, platform, itemId)` 確保同一用戶對同一商品只通知一次
- `platforms` 存為 `String[]` 陣列（Prisma + PostgreSQL 支援）

**替代方案考慮**：
- Supabase → 免費方案功能較多，但 Prisma + Neon 更輕量可控
- MongoDB → NoSQL 去重查詢較複雜，不如 PostgreSQL UNIQUE constraint 直觀
- Drizzle ORM → 生態系較新，文件不如 Prisma 完整

### Worker API 以 WORKER_SECRET Bearer token 驗證

**決策**：`/api/worker/keywords` 與 `/api/worker/notify` 兩支端點以 `Authorization: Bearer {WORKER_SECRET}` 驗證，`WORKER_SECRET` 透過環境變數設定。

**理由**：
- Worker 無需 Google OAuth session，簡單 Bearer token 即可
- `WORKER_SECRET` 在 Vercel 環境變數設定，不進 git
- Next.js middleware 或 route handler 內驗證，與用戶認證邏輯分離

### Resend SDK 發送 Email；每次 notify 累積後單封彙整

**決策**：使用 `resend` 官方 SDK 發送 Email。`POST /api/worker/notify` 收到商品後，若去重通過，觸發 Discord Webhook 立即通知；Email 採「每次 notify 呼叫各自發送」（MVP 簡化，後續可改為批次）。

**理由**：
- Resend SDK 提供 React Email 模板支援（HTML + plain text）
- 免費方案 3,000/月足夠 MVP 測試
- 立即發送 Email 實作最簡單，後續可加 queue 批次

**替代方案考慮**：
- Nodemailer → 需自備 SMTP，設定複雜
- SendGrid → 免費方案限制較多，SDK 不如 Resend 簡潔

### `webapp/` 子目錄，與 Worker 同倉庫

**決策**：Next.js 專案建立在 `webapp/` 子目錄中，與現有 Python Worker 共用同一 git repo。

**理由**：
- Keyword 設定與 Worker 版本同步（相同 commit）
- Vercel 支援 monorepo，設定 Root Directory 為 `webapp/` 即可
- 不需管理跨 repo 的 Prisma schema 同步

## Risks / Trade-offs

- **[Risk] Neon.tech cold start（Serverless DB）** → 首次請求可能有 ~500ms 延遲 → 可接受，MVP 不要求 SLA
- **[Risk] NextAuth.js v5 仍為 beta** → API 可能有 breaking change → 鎖定版本；若不穩定可退回 v4
- **[Risk] WORKER_SECRET 洩漏** → 透過 Vercel + Fly.io secrets 管理，不寫入程式碼；定期 rotate
- **[Risk] Resend 免費方案 3,000/月額度** → MVP 測試用量遠低於此；超過可升級付費或改批次 Email
- **[Risk] `platforms[]` 陣列在 Prisma schema** → PostgreSQL 支援，但需注意 Prisma migration 語法（`String[]`）

## Migration Plan

1. 建立 `webapp/` 目錄，執行 `npx create-next-app@15 webapp --typescript --app --tailwind`
2. 設定 `webapp/prisma/schema.prisma`，執行 `prisma migrate dev` 建立 tables
3. 設定 NextAuth.js，Google OAuth Client ID/Secret 在 Google Cloud Console 申請
4. 本機 `npm run dev` 驗證登入、Keyword CRUD、通知設定均正常
5. 建立 `.env.local`（不進 git），設定所有必要環境變數
6. Vercel 連結 git repo，設定 Root Directory = `webapp/`，加入所有 env vars
7. Neon.tech 建立 Production DB，更新 `DATABASE_URL` 至 Vercel
8. 推送至 `main`，確認 Vercel 自動部署成功

## Open Questions

- Vercel 免費方案 Function invocation 限制（100GB-hours/月）是否足夠 Worker notify 呼叫量？（每 5 分鐘 × n keywords，應在限制內）
- `POST /api/worker/notify` 收到商品後，Discord + Email 是否需要 async queue？（MVP 先同步發送，若有 timeout 問題再加）
