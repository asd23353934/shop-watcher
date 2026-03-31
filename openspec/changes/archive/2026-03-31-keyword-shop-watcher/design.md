## Context

架構從「個人 CLI Daemon」轉型為「多人 SaaS 平台的後端 Worker 服務」。

**P1 PoC 已驗證（2026-03-31）**：
- 蝦皮：先訪問首頁（shopee.tw）取 cookie，再導航至搜尋頁，可繞過 bot 偵測（不需 playwright-stealth）。`[data-sqe="item"]` 與 `a[href*="-i."]` 命中。
- 露天：SPA 渲染後 `a[href*="ruten.com.tw/item/"]` 命中 31 筆，URL 格式為 `https://www.ruten.com.tw/item/{22-digit-id}/`，價格與圖片均可取得。

**主要挑戰**：
1. Shopee / Ruten 均需真實瀏覽器（API 封鎖）
2. Worker 必須保持無狀態（stateless），不直接讀寫 PostgreSQL
3. 去重、通知、用戶管理均由 Next.js API 負責；Worker 只爬蟲與回報

## Goals / Non-Goals

**Goals:**
- Worker 使用 Playwright headless Chromium 對蝦皮與露天執行關鍵字搜尋
- Worker 透過 HTTP API 從 Next.js 取得關鍵字清單，並將商品結果回報給 Next.js
- asyncio 排程迴圈，每 `CHECK_INTERVAL` 秒執行一次全域掃描
- 每次掃描共用一個 Playwright browser instance
- Docker 化部署（Playwright 官方映像）+ Fly.io + GitHub Actions CD
- Bearer token（`WORKER_SECRET`）驗證 Worker 身份

**Non-Goals:**
- Worker 不直接存取 PostgreSQL（無 DB client 依賴）
- Worker 不發送 Discord / Email 通知（由 Next.js 統一處理）
- Worker 不做去重（`seen_items` 在 Next.js PostgreSQL）
- Worker 不管理用戶帳號或 keyword CRUD
- 不支援 Shopee 以外的東南亞站（只針對 shopee.tw）
- 不支援 Line / Telegram 等其他通知管道

## Decisions

### 使用 Playwright headless browser 進行平台搜尋

**決策**：蝦皮與露天拍賣均使用 `playwright-python` async Chromium headless browser 執行搜尋。

**理由**：
- P1 PoC 驗證確認：兩個平台的 API 端點均被封鎖（Shopee 403 / Ruten 400），只有真實瀏覽器可行
- Playwright async API 原生支援 asyncio event loop
- Playwright 內建 `wait_for_selector` 可可靠等待 SPA 渲染完成
- 官方映像 `mcr.microsoft.com/playwright/python` 包含所有瀏覽器依賴，零手動安裝

**替代方案考慮**：
- `httpx` + Header 模擬 → 已驗證失敗（403 / 400）
- `requests-html` → 底層仍 Chromium，API 較舊且維護不活躍
- Selenium → 較 Playwright 重，WebDriver 管理麻煩

### 蝦皮搜尋採「先訪問首頁取 cookie」策略

**決策**：蝦皮搜尋前先 `page.goto("https://shopee.tw/")` 等待 3 秒，再導航至搜尋頁。

**理由**：
- PoC v3 驗證：直接訪問搜尋頁被導向登入頁；先訪問首頁讓 Shopee 設定必要 cookie（如 SPC_CDS），搜尋頁即可正常渲染
- 不需 playwright-stealth 或付費代理，降低依賴複雜度

### Worker 透過 HTTP API 與 Next.js 通訊（取代直接 DB 存取）

**決策**：Worker 透過兩支 API 端點與 Next.js 通訊：
- `GET /api/worker/keywords` — 取得所有 active keyword + 用戶通知設定
- `POST /api/worker/notify` — 回報每筆爬取到的商品（含 keyword_id）

所有請求帶 `Authorization: Bearer {WORKER_SECRET}` header。

**理由**：
- Worker 保持無狀態（stateless），可水平擴展，無 DB 連線問題
- 去重邏輯集中在 Next.js API（`seen_items` table），避免 Worker 直接操作 PostgreSQL
- Email / Discord 通知集中在 Next.js，日後加新管道只改一個地方
- Worker 與 Next.js 解耦：可獨立部署、獨立擴展

**替代方案考慮**：
- Worker 直接連 PostgreSQL → 拒絕，Worker 需攜帶 DB credentials，難以無狀態化
- Worker 寫入 Redis Queue → 拒絕，增加外部依賴，MVP 過重

### asyncio 非同步排程，每次掃描共用一個 browser instance

**決策**：排程迴圈採 Python `asyncio`；每次掃描開始時啟動一個 Playwright browser，掃描結束後關閉。`httpx.AsyncClient` 用於 API 通訊。

**理由**：
- Playwright async API 原生支援 asyncio，共用 event loop
- 共用 browser instance 降低啟動開銷（避免每個 keyword 各自啟動 browser）
- 不需引入 Celery / Redis 等重型排程框架
- `httpx` 支援 async HTTP，與 asyncio 整合良好

### 部署至 Fly.io，使用 Playwright 官方 Docker 映像

**決策**：Worker 容器基於 `mcr.microsoft.com/playwright/python:v1.44.0-focal`，部署至 Fly.io。不掛載 SQLite volume（無狀態設計）。

**理由**：
- 官方映像已包含 Chromium 及所有系統依賴，避免手動安裝問題
- Fly.io 支援常駐執行（persistent VM），適合長時間排程 daemon
- 無狀態設計不需要 persistent volume，簡化 Fly.io 設定

**替代方案考慮**：
- `python:3.12-slim` + 手動安裝 Playwright → 拒絕，映像建置複雜且容易缺少系統依賴
- Railway → 備選，若 Fly.io 免費額度不足時使用

## Risks / Trade-offs

- **[Risk] Playwright 啟動時間（約 2–3 秒）** → 每次掃描共用一個 browser instance，不影響掃描間隔精確度
- **[Risk] 蝦皮/露天更新前端 DOM 結構** → selector 失效時 log 明確標示平台與選擇器；只影響單一平台，不中斷其他平台或 API 通訊
- **[Risk] Next.js API 不可用時 Worker 無法取得 keyword 清單** → Worker 應 log 錯誤並跳過本輪掃描，下一輪重試；不應 crash
- **[Risk] Playwright Docker 映像體積大（~1GB）** → 使用 `--only chromium` 安裝，映像約 600MB，Fly.io 支援
- **[Risk] 蝦皮 cookie 失效導致再次被導向登入** → 每次掃描週期重新建立 browser context，確保取得新 cookie
- **[Risk] Worker Secret 洩漏** → 透過 Fly.io secrets 管理，不寫入程式碼或 git

## Migration Plan

1. 移除 `config.yaml`、`watcher.db`、`src/database.py`、`src/notifier.py`（舊架構產物）
2. 建立 `src/scrapers/shopee.py`、`src/scrapers/ruten.py`（Playwright 搜尋模組）
3. 建立 `src/api_client.py`（Worker→Next.js HTTP 通訊模組）
4. 建立 `src/scheduler.py`（asyncio 排程迴圈）
5. 建立 `.env.example`（`WORKER_SECRET`、`NEXT_PUBLIC_API_URL`、`CHECK_INTERVAL`）
6. 更新 `Dockerfile` → 基於 `mcr.microsoft.com/playwright/python:v1.44.0-focal`，移除 SQLite volume
7. 更新 `fly.toml` → 移除 `[mounts]` section
8. 更新 `requirements.txt` → 加入 `playwright`、`httpx`、`python-dotenv`；移除 `aiosqlite`、`pyyaml`、`beautifulsoup4`

## Open Questions

- Next.js `GET /api/worker/keywords` 回傳格式需與 saas-webapp change 協商確定（建議 `{id, keyword, platforms, min_price, max_price, user_id}` 陣列）
- Fly.io 免費方案是否能持續執行 300 秒間隔的 daemon？（需確認 auto-sleep 行為）
