# 🛍️ Shop Watcher

自動監控台灣電商、拍賣、動漫專門店及同人誌販售平台最新商品上架，關鍵字命中時透過 **Discord** 或 **Email** 即時通知你。

支援平台：**露天、PChome、MOMO、Animate、Yahoo拍賣、Mandarake、買動漫、金石堂ACG、Melonbooks、虎之穴、Booth、DLsite**（蝦皮暫停）

🔗 **線上使用**：[shop-watcher.vercel.app](https://shop-watcher.vercel.app)

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 🔍 多平台監控 | 同時監控 12 個平台，每 10 分鐘自動掃描 |
| 🎮 Discord 通知 | Webhook Embed 格式，含商品圖片、名稱、價格、賣家、連結 |
| 📧 Email 通知 | 彙整所有新商品為一封表格信件（Resend 發送） |
| 💰 降價提醒 | 已通知商品若降價，自動重新通知並標示原價 |
| 🚫 禁詞過濾 | 關鍵字層級設定禁詞，過濾不想要的商品 |
| 📋 通知記錄 | 查看最近 50 筆已通知商品記錄 |
| 🧹 自動清理 | 每日清理過期 SeenItem（30天）與 ScanLog（7天） |

---

## 技術架構

```
shop-watcher/
├── webapp/          # Next.js 15 SaaS 應用（Vercel 部署）
├── src/             # Python 3.12 Worker 程式碼
├── run_once.py      # GitHub Actions 入口（單次掃描）
├── requirements.txt # Python 依賴
├── .github/
│   └── workflows/
│       ├── worker.yml   # 每 10 分鐘掃描
│       └── cleanup.yml  # 每日清理過期資料
└── docs/            # Landing page（GitHub Pages）
```

| 層級 | 技術 |
|------|------|
| 前端 / API | Next.js 15、TypeScript、Tailwind CSS、Prisma v5 |
| 資料庫 | Neon.tech PostgreSQL |
| 認證 | NextAuth.js v5（Google OAuth） |
| Worker | Python 3.12 + Playwright（Chromium headless） |
| 排程 | GitHub Actions cron |
| 通知 | Discord Webhook + Resend（Email） |

---

## 快速開始（本地開發）

### 前置需求

- Node.js 22+
- Python 3.12+
- Neon.tech PostgreSQL 資料庫
- Google OAuth 憑證
- Resend API Key（Email 通知）
- Discord Webhook URL（Discord 通知）

### 1. 設定 Next.js webapp

```bash
cd webapp
cp .env.example .env
# 填入 .env 中所有必要環境變數
npm install
npx prisma migrate deploy
npm run dev
```

### 2. 設定 Python Worker

```bash
pip install -r requirements.txt
python -m playwright install chromium --with-deps

# 設定環境變數
export WORKER_SECRET=your_secret
export NEXT_PUBLIC_API_URL=http://localhost:3000

# 執行單次掃描
python run_once.py
```

### GitHub Actions Secrets 設定

在 GitHub repo Settings → Secrets and variables → Actions 新增：

| Secret | 說明 |
|--------|------|
| `WORKER_SECRET` | Worker ↔ API 共用密鑰（同 webapp .env） |
| `NEXT_PUBLIC_API_URL` | Vercel 部署網址 |
| `DATABASE_URL` | Neon.tech 連線字串（cleanup workflow 使用） |
| `DISCORD_ERROR_WEBHOOK` | （選填）逐筆爬取失敗通知 Discord Webhook |
| `SYSTEM_ALERT_WEBHOOK` | （選填）系統級告警 Discord Webhook（逾時、嚴重錯誤），與用戶 webhook 分離 |
| `SHOPEE_COOKIES_JSON` | （選填）蝦皮 session cookies（JSON 陣列），用於繞過 fraud detection |

**Worker 行為調整環境變數（可設於 GitHub Actions Variables）：**

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `SCAN_TIMEOUT_SECONDS` | `300` | 整個掃描 cycle 的 Python 層逾時秒數 |
| `SEMAPHORE_PER_PLATFORM` | `3` | 每平台最大並行爬取數（asyncio.Semaphore） |
| `CHECK_INTERVAL` | `300` | 掃描間隔秒數（scheduler 模式使用） |

---

## API 端點

### Worker API（需要 `WORKER_SECRET` Bearer token）

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET` | `/api/worker/keywords` | 取得所有啟用的關鍵字與通知設定 |
| `POST` | `/api/worker/notify/batch` | 批次回報商品，回傳 `{new, price_drop, duplicate}` |
| `POST` | `/api/worker/scan-log` | 記錄掃描完成時間 |

### 用戶 API（需要登入 Session）

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET/POST` | `/api/keywords` | 列出 / 新增關鍵字 |
| `PATCH/DELETE` | `/api/keywords/[id]` | 更新 / 刪除關鍵字 |
| `GET/POST` | `/api/settings` | 讀取 / 儲存通知設定 |
| `POST` | `/api/settings/test-webhook` | 測試 Discord Webhook |
| `GET` | `/api/history` | 通知記錄（最近 50 筆） |

---

## 資料模型

```prisma
Keyword     # 關鍵字（含 platforms[], blocklist[], minPrice, maxPrice）
SeenItem    # 已通知紀錄（userId + platform + itemId 唯一，含 lastPrice）
NotificationSetting  # Discord Webhook / User ID / Email
ScanLog     # 掃描完成時間（單一 global 記錄）
```

---

## License

MIT
