## 1. 專案環境準備

- [x] 1.1 確認 Python 3.12 已安裝；執行 `python --version` 確認版本
- [x] 1.2 更新 `requirements.txt`：加入 `playwright`、`httpx`、`python-dotenv`；移除 `aiosqlite`、`pyyaml`、`beautifulsoup4`；執行 `pip install -r requirements.txt` 確認安裝成功（使用 asyncio + playwright async API 進行非同步排程，不需 Celery/Redis）
- [x] 1.3 執行 `playwright install --with-deps chromium` 安裝 Playwright headless browser；確認 `playwright --version` 輸出版本號
- [x] 1.4 複製 `.env.example` 為 `.env`，填入 `WORKER_SECRET`（與 Next.js 共享）與 `NEXT_PUBLIC_API_URL`（Next.js API base URL）；確認 `.env` 已列於 `.gitignore`

## 2. Worker API Client（worker-api-client）

- [x] 2.1 建立 `src/api_client.py`，實作 `WorkerApiClient.__init__`：讀取 `WORKER_SECRET` 與 `NEXT_PUBLIC_API_URL` 環境變數；缺少任一時拋出 `ValueError`（訊息分別為 `WORKER_SECRET is required` / `NEXT_PUBLIC_API_URL is required`），實作 `WorkerApiClient uses the NEXT_PUBLIC_API_URL environment variable as the base URL`
- [x] 2.2 實作 `Worker authenticates every API request with a Bearer token`（`WorkerApiClient authenticates every API request with a Bearer token`）：所有 `httpx` 請求 header 加入 `Authorization: Bearer {WORKER_SECRET}`；建立 `httpx.AsyncClient` 時設為預設 header
- [x] 2.3 實作 `WorkerApiClient.get_keywords()`（`GET /api/worker/keywords`）：HTTP 200 時回傳 keyword dict 陣列（含 `id`、`keyword`、`platforms`、`min_price`、`max_price`）；非 2xx 時 log 狀態碼與回應內容並回傳空列表；網路例外時 log 錯誤並回傳空列表，實作 `Worker fetches the active keyword list from Next.js API`（Worker 透過 HTTP API 與 Next.js 通訊（取代直接 DB 存取））
- [x] 2.4 實作 `WorkerApiClient.notify_item(keyword_id, item)`（`POST /api/worker/notify`）：POST body 包含 `keyword_id`、`platform`、`item_id`、`name`、`price`、`url`、`image_url`；HTTP 200/201 回傳 `True`；非 2xx 時 log 並回傳 `False`；網路例外時 log 並回傳 `False`，實作 `Worker reports each found item to Next.js API`

## 3. 蝦皮關鍵字搜尋（keyword-search — Shopee Playwright）

- [x] 3.1 建立 `src/scrapers/shopee.py`，實作 `Shopee search navigates to homepage first to obtain session cookies`（蝦皮搜尋採「先訪問首頁取 cookie」策略）：呼叫 `page.goto("https://shopee.tw/")` 並等待至少 3 秒；若 `page.url` 含 `"login"` 則 log 並回傳空列表
- [x] 3.2 實作 `Shopee search returns newest listings sorted by creation time`：使用 Playwright headless browser 進行平台搜尋（取代 httpx 直接 API 呼叫）；導航至 `https://shopee.tw/search?keyword={keyword}&sortBy=ctime&order=desc`，`wait_for_selector` 等待 `[data-sqe="item"]` / `.shopee-search-item-result__item` / `a[href*="-i."]`（timeout 15 秒）
- [x] 3.3 驗證 `WatcherItem.item_id` 從 `href` 解析（`/{slug}-i.{shopid}.{itemid}` 格式），`WatcherItem.url` 為 `https://shopee.tw/{slug}-i.{shopid}.{itemid}`，`platform` 為 `"shopee"`
- [x] 3.4 驗證蝦皮價格從 `[class*="price"]` 元素解析為 TWD float（"NT$15" → `15.0`）；無法解析時 `price` 為 `null`
- [x] 3.5 驗證 `WatcherItem.image_url` 從 `<img>` 的 `src` 取得；selector 15 秒內未命中時回傳空列表，不拋出例外（`Shopee search timeout returns empty list`）

## 4. 露天拍賣關鍵字搜尋（keyword-search — Ruten Playwright）

- [x] 4.1 建立 `src/scrapers/ruten.py`，實作 `Ruten search returns newest listings via Playwright`：以 Playwright headless Chromium 開啟 `https://www.ruten.com.tw/find/?q={keyword}&sort=new`，等待 domcontentloaded 後再 sleep 4 秒讓 SPA 渲染
- [x] 4.2 實作 `Ruten item ID and URL are extracted from the product card link`：selector `a[href*="ruten.com.tw/item/"]`，從 href 解析數字 ID（10 位以上），`WatcherItem.url` 格式為 `https://www.ruten.com.tw/item/{id}/`（非舊版 goods.ruten.com.tw）
- [x] 4.3 實作 `Ruten item name is extracted from the card text`：過濾 `inner_text()` 的純數字行，取第一個有意義行；空則從 `img[alt]` 取；仍空則 `"item-{item_id}"`
- [x] 4.4 驗證露天價格從父容器（`li`/`article`/`parentElement`）的 `[class*="price"]` 元素解析；圖片從 `src` 或 `data-src` 取得（`src` 為 `data:` 時改用 `data-src`）（`Ruten product image is extracted from the card`）
- [x] 4.5 驗證 selector 無結果時 fallback 至 `a[href*="goods.ruten"]`；仍無結果時 log warning 並回傳空列表，不拋出例外（`Ruten search timeout returns empty list`）

## 5. Playwright Browser 共用機制（keyword-search — shared browser instance）

- [x] 5.1 實作 `A single Playwright browser instance is shared across all searches in one scan cycle`（asyncio 非同步排程，每次掃描共用一個 browser instance）：一次掃描週期只呼叫 `async_playwright().start()` 一次，同一 browser instance 傳入所有 watcher
- [x] 5.2 驗證掃描週期結束後 `browser.close()` 必定被呼叫（含某一平台拋出例外的情況）（`Browser is always closed after a scan cycle`）

## 6. 價格篩選（keyword-search — price range filter）

- [x] 6.1 實作 `Price range filter is applied before returning results`：`min_price` 非 null 時過濾低於下限的商品；`max_price` 非 null 時過濾高於上限的商品
- [x] 6.2 驗證 `price: null` 的商品不被過濾（`Item with null price is not filtered out`）；`min_price: null` 且 `max_price: null` 時所有商品通過（`No price filter returns all items`）

## 7. 排程執行器（watcher-scheduler）

- [x] 7.1 建立 `src/scheduler.py`，實作 `Application environment is validated before the scheduler starts`：啟動時檢查 `WORKER_SECRET` 與 `NEXT_PUBLIC_API_URL` 是否存在；缺少時輸出對應訊息並退出（不進入排程迴圈）
- [x] 7.2 實作 `Scheduler fetches keyword list from Next.js API before each scan cycle`：每次掃描開始前呼叫 `WorkerApiClient.get_keywords()`；回傳空陣列時 log `"No active keywords, skipping scan"` 且不啟動 browser；API 錯誤時 log 錯誤並跳過本輪掃描
- [x] 7.3 實作 `Scheduler runs all keyword searches on a configurable interval`：asyncio 迴圈，每 `CHECK_INTERVAL` 秒執行一次全域掃描；`CHECK_INTERVAL` 從環境變數讀取，預設 `300`；確認各關鍵字×平台組合獨立執行，一個平台失敗不中斷其他（`Each keyword-platform pair is searched independently`）
- [x] 7.4 實作 `Found items are reported to Next.js API immediately after each search`：每筆商品呼叫 `WorkerApiClient.notify_item(keyword_id, item)`；單筆 notify 失敗不中止後續商品（`Notify API call failure does not abort remaining items`）
- [x] 7.5 實作 `Per-scan summary is logged to stdout`：每個 keyword×platform 搜尋後 log `[{platform}] {keyword} — {n} found, {m} reported`；即使 `0 found` 也輸出（`Log line shows zero items found`）
- [x] 7.6 實作 `Scheduler runs indefinitely until interrupted`：Ctrl+C（`KeyboardInterrupt`）與 `SIGTERM` 均能乾淨結束，Playwright browser 被關閉，無殘留 process

## 8. Docker 與部署（deployment-setup）

- [x] 8.1 更新 `Dockerfile`：實作 `Application runs in a Docker container based on the official Playwright Python image`（部署至 Fly.io，使用 Playwright 官方 Docker 映像）：基礎映像改為 `mcr.microsoft.com/playwright/python:v1.44.0-focal`；移除 `VOLUME ["/data"]` 宣告（無狀態設計，`No persistent volume is declared`）；entrypoint 為 `python main.py`；確認 `docker build -t shop-watcher .` 成功（`Docker image builds without errors`）
- [x] 8.2 更新 `.env.example`：實作 `.env file configures the three required environment variables`，包含 `WORKER_SECRET=`、`NEXT_PUBLIC_API_URL=`、`CHECK_INTERVAL=300` 三個欄位；確認 `.env` 列於 `.gitignore`（`.env is excluded from version control`）
- [x] 8.3 更新 `fly.toml`：`[processes] app = "python main.py"`；移除 `[mounts]` section（無狀態，不需 SQLite volume）（`fly.toml configures the Fly.io deployment without a volume mount`）；Fly.io secrets 設定指令 `fly secrets set WORKER_SECRET=... NEXT_PUBLIC_API_URL=...`
- [x] 8.4 建立或更新 `.github/workflows/ci.yml`：push to main 時觸發，執行 `pip install -r requirements.txt` + `flake8 src/ main.py`（`GitHub Actions CI pipeline runs lint on every push`）
- [x] 8.5 在 CI pipeline 加入 deploy job：CI 通過後執行 `flyctl deploy --remote-only`，使用 `FLY_API_TOKEN` GitHub secret（`GitHub Actions CD pipeline deploys to Fly.io on main branch`）

## 9. 舊架構清理

- [x] 9.1 刪除 `src/database.py`，確認 `Seen items are persisted in SQLite with platform and item_id as primary key`、`New items are detected and recorded atomically`、`Database path is configurable` 等 SQLite 去重需求均已不存在於 Worker；更新 `requirements.txt` 移除 `aiosqlite`；確認 `watcher.db` 未被追蹤且列於 `.gitignore`
- [x] 9.2 刪除 `src/notifier.py`，確認 `New item notification is sent as a Discord Embed`、`Per-keyword user mention notifies the correct Discord user`、`Discord errors do not block the watcher loop`、`Startup notification confirms the watcher is active` 等 Discord 通知需求均已不存在於 Worker；確認 `DISCORD_WEBHOOK_URL` 不在 `.env.example` 中
- [x] 9.3 刪除 `config.yaml` 與 `config.example.yaml`（關鍵字設定改由 Next.js API 動態提供）；更新 `requirements.txt` 移除 `pyyaml`、`beautifulsoup4`
- [x] 9.4 在 Worker 啟動時輸出 stdout 啟動訊息（e.g. `Shop Watcher started`），確認 `Worker logs startup status to stdout instead of Discord`（無 Discord HTTP call）
