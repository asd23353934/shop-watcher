<!-- SPECTRA:START v1.0.1 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `/spectra:*` skills when:

- A discussion needs structure before coding → `/spectra:discuss`
- User wants to plan, propose, or design a change → `/spectra:propose`
- Tasks are ready to implement → `/spectra:apply`
- There's an in-progress change to continue → `/spectra:ingest`
- User asks about specs or how something works → `/spectra:ask`
- Implementation is done → `/spectra:archive`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode → `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `/spectra:apply` and `/spectra:ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

---

# 專案說明

**Shop Watcher** — 多販售平台新品監控 SaaS，自動監控台灣電商、拍賣、動漫專門店及同人誌販售平台的最新上架商品與作品，透過 Discord Webhook 或 Email 即時通知用戶。

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 / API | Next.js 15 App Router、TypeScript、Tailwind CSS |
| 資料庫 ORM | Prisma v5 + Neon.tech PostgreSQL |
| 認證 | NextAuth.js v5（Google OAuth） |
| Email 通知 | Resend SDK |
| Worker | Python 3.12 + Playwright（Chromium headless） |
| 排程 | GitHub Actions cron `*/10 * * * *` |
| 部署 | Vercel（Next.js）+ GitHub Actions（Worker） |

## 目錄結構

```
shop-watcher/
├── webapp/               # Next.js SaaS 應用
│   ├── app/              # App Router pages & API routes
│   ├── components/       # React 元件
│   ├── lib/              # discord.ts / email.ts / prisma.ts
│   ├── prisma/           # schema.prisma + migrations
│   └── scripts/          # cleanup.ts（資料清理）
├── src/                  # Python Worker
│   ├── scrapers/         # ruten.py / pchome.py / momo.py / animate.py / yahoo_auction.py
│   │                     # mandarake.py / myacg.py / kingstone.py / melonbooks.py
│   │                     # toranoana.py / booth.py / dlsite.py（shopee.py 暫停）
│   ├── watchers/         # base.py（WatcherItem dataclass）
│   ├── api_client.py     # WorkerApiClient
│   └── scheduler.py      # run_scan_cycle()
├── .github/workflows/    # worker.yml / cleanup.yml / ci.yml
├── docs/                 # Landing page（GitHub Pages）
└── openspec/             # Spectra SDD artifacts
```

## 核心功能

- **關鍵字監控**：每 10 分鐘掃描多個平台，結果依建立時間排序（最新優先）；支援平台：露天、PChome、MOMO、Animate、Yahoo拍賣、Mandarake、買動漫、金石堂ACG、Melonbooks、虎之穴、Booth、DLsite（蝦皮暫停）
- **批次通知**：每個關鍵字 × 平台一次 API 呼叫（`POST /api/worker/notify/batch`）
- **去重機制**：`SeenItem(userId, platform, itemId)` 唯一鍵，避免重複通知
- **降價提醒**：`SeenItem.lastPrice` 追蹤歷史價格，降價時重新通知
- **禁詞過濾**：`Keyword.blocklist String[]`，Worker 端過濾商品名稱
- **Discord 通知**：Embed 格式，最多 10 個/次，超過分批送出，上限由 `MAX_NOTIFY_PER_BATCH` 控制
- **Email 通知**：Resend SDK，所有新商品彙整為一封表格 Email
- **Webhook 測試**：`POST /api/settings/test-webhook` 即時驗證 Discord Webhook
- **通知歷史**：`/history` 頁面顯示最近 50 筆通知記錄
- **掃描時間**：Dashboard 顯示「上次掃描：N 分鐘前」
- **資料清理**：GitHub Actions 每日 UTC 02:00 清理過期 SeenItem（30天）/ ScanLog（7天）

## 開發慣例

- **Commit 訊息**：繁體中文
- **不主動 git push**：變更 commit 後等待用戶確認再推送
- **API 認證**：Worker API 以 `WORKER_SECRET` Bearer token 驗證
- **環境變數**：參考 `webapp/.env.example`

## 環境變數（webapp）

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | Neon.tech PostgreSQL 連線字串 |
| `NEXTAUTH_SECRET` | NextAuth 簽名金鑰 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Email 發送 |
| `WORKER_SECRET` | Worker ↔ API 共用密鑰 |
| `MAX_NOTIFY_PER_BATCH` | Discord 批次通知上限（預設 10） |

## 環境變數（Worker / GitHub Actions Secrets）

| 變數 | 說明 |
|------|------|
| `WORKER_SECRET` | 與 Next.js API 相同密鑰 |
| `NEXT_PUBLIC_API_URL` | Next.js 部署網址（例：`https://shop-watcher.vercel.app`） |
