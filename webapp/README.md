# Shop Watcher — Next.js Webapp

Shop Watcher 的 SaaS 前端與 API，使用 Next.js 15 App Router 建構，部署於 Vercel。

## 開發指令

```bash
npm run dev       # 啟動開發伺服器（Turbopack）
npm run build     # 建置生產版本
npm run lint      # ESLint 檢查
npm run cleanup   # 手動執行資料清理腳本
```

## 環境變數

複製 `.env.example` 為 `.env` 並填入以下欄位：

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | Neon.tech PostgreSQL 連線字串 |
| `NEXTAUTH_SECRET` | NextAuth 簽名金鑰（`openssl rand -base64 32`） |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `RESEND_API_KEY` | Resend API Key |
| `RESEND_FROM_EMAIL` | 發信地址（需在 Resend 驗證網域） |
| `WORKER_SECRET` | Worker ↔ API 共用密鑰 |
| `MAX_NOTIFY_PER_BATCH` | Discord 單次通知上限（預設 10） |

## 資料庫 Migration

```bash
# 套用現有 migrations
npx prisma migrate deploy

# 開發時建立新 migration
npx prisma migrate dev --name <migration-name>

# 重新產生 Prisma Client
npx prisma generate
```

## 目錄結構

```
webapp/
├── app/
│   ├── api/
│   │   ├── keywords/         # CRUD 關鍵字
│   │   ├── settings/         # 通知設定 & Webhook 測試
│   │   ├── history/          # 通知記錄
│   │   └── worker/           # Worker 專用 API（Bearer auth）
│   ├── dashboard/            # 關鍵字監控頁面
│   ├── history/              # 通知記錄頁面
│   ├── settings/             # 通知設定頁面
│   └── login/                # 登入頁面
├── components/               # KeywordForm, KeywordList, NotificationForm...
├── lib/
│   ├── discord.ts            # sendDiscordBatchNotification()
│   ├── email.ts              # sendEmailBatchNotification()
│   ├── prisma.ts             # Prisma Client singleton
│   └── worker-auth.ts        # verifyWorkerToken()
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── scripts/
    └── cleanup.ts            # 清理過期 SeenItem & ScanLog
```
