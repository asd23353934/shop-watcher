## 1. 資料庫 Schema 變更

- [x] 1.1 更新 `webapp/prisma/schema.prisma`：新增 PlatformScanStatus 記錄各平台健康狀態 model（`id String @id @default(cuid())`、`userId String`、`platform String`、`lastSuccess DateTime?`、`lastError String?`、`failCount Int @default(0)`、`updatedAt DateTime @updatedAt`、`@@unique([userId, platform])`）；實作 Worker records per-platform scan health status after each scan cycle 的資料層支援
- [x] 1.2 執行 `cd webapp && npx prisma migrate dev --name worker_scalability` 產生 migration SQL 並驗證 schema 無誤

## 2. 後端 API — 平台健康狀態

- [x] 2.1 建立 `webapp/app/api/worker/platform-status/route.ts`（PATCH handler）：接受 payload `{ platform: string, success: boolean, error?: string }`，以 `@@unique([userId, platform])` upsert PlatformScanStatus（成功時更新 lastSuccess 並重置 failCount 為 0，失敗時 failCount +1 並記錄 lastError）；需 WORKER_SECRET Bearer 驗證；實作 Worker platform-status API requires WORKER_SECRET authentication 與 Platform status is upserted, not appended
- [x] 2.2 建立 `webapp/app/api/platform-status/route.ts`（GET handler）：回傳目前登入用戶的所有 PlatformScanStatus 記錄；未登入回傳 HTTP 401；實作 Platform health data is fetched from dedicated API endpoint

## 3. Worker Python 端 — asyncio 平行化改寫

- [x] 3.1 更新 `src/watchers/base.py`：BaseWatcher 新增 `async def search_async()` 方法（以 `asyncio.to_thread` 包覆現有同步 `search()` 方法）；所有爬蟲透過此方法在 asyncio.gather 中執行；實作 All scrapers are async-compatible 的 base 層支援（asyncio.gather + per-platform Semaphore 限制並行數）
- [x] 3.2 更新 `src/scrapers/ruten.py`、`src/scrapers/yahoo_auction.py`、`src/scrapers/booth.py`、`src/scrapers/dlsite.py`、`src/scrapers/toranoana.py`、`src/scrapers/melonbooks.py` 等所有爬蟲：將同步 `search()` 改為 `async def search()` 使用 `async_playwright`；實作 All scrapers are async-compatible
- [x] 3.3 更新 `src/scheduler.py`：`run_scan_cycle()` 改為 async 函式，以 `asyncio.gather(return_exceptions=True)` 替換巢狀迴圈；為每個平台建立獨立 `asyncio.Semaphore(SEMAPHORE_PER_PLATFORM)`；`SEMAPHORE_PER_PLATFORM` 從環境變數讀取（預設 3）；實作 Scheduler executes all keyword-platform scans in parallel using asyncio 與 Scheduler runs all keyword searches on a configurable interval（改為 asyncio 平行執行）與 All keyword-platform tasks are gathered concurrently 與 Per-platform Semaphore limits concurrent connections 與 One platform failure does not block other platforms 與 SEMAPHORE_PER_PLATFORM is configurable via environment variable
- [x] 3.4 更新 `src/scheduler.py`：以 `asyncio.wait_for(run_scan_tasks(), timeout=SCAN_TIMEOUT_SECONDS)` 包覆掃描邏輯，`asyncio.TimeoutError` 時呼叫 `send_system_alert()` 送 Discord 通知；`SCAN_TIMEOUT_SECONDS` 從環境變數讀取（預設 300）；`main()` 改為呼叫 `asyncio.run(main_async())`；實作 Python scan cycle is protected by asyncio.wait_for timeout 與 Scan cycle exceeds timeout and triggers alert 與 SYSTEM_ALERT_WEBHOOK not set silences alert but does not crash 與 asyncio.wait_for(300s) Python 層逾時保護

## 4. Worker Python 端 — 系統告警與平台狀態回報

- [x] 4.1 更新 `src/api_client.py`：新增 `update_platform_scan_status(platform: str, success: bool, error: str | None = None)` 方法，呼叫 `PATCH /api/worker/platform-status`；實作 Worker records per-platform scan health status after each scan cycle 的 Worker 端支援（Successful platform scan updates lastSuccess and resets failCount；Failed platform scan increments failCount and records error）
- [x] 4.2 在 `src/scheduler.py` 中，每個平台的所有關鍵字掃描完成後呼叫 `api.update_platform_scan_status()`（成功或失敗皆回報）；收集 `asyncio.gather(return_exceptions=True)` 的結果，判斷各平台是否有 Exception 並傳入對應 success/error；實作 Successful platform scan updates lastSuccess and resets failCount 與 Failed platform scan increments failCount and records error
- [x] 4.3 在 `src/scheduler.py` 新增 `send_system_alert(message: str)` 函式：從環境變數讀取 `SYSTEM_ALERT_WEBHOOK`，POST Discord embed 至該 URL；若環境變數未設定則僅 log 至 stdout 不拋出例外；實作 SYSTEM_ALERT_WEBHOOK 與用戶 webhook 分離 的設計決策

## 5. GitHub Actions 修正

- [x] 5.1 更新 `.github/workflows/worker.yml`：所有通知 step 的條件從 `if: failure()` 改為 `if: failure() || cancelled()`；實作 GitHub Actions worker job notifies on timeout and cancellation 與 Job timeout triggers notification step 與 Job crash triggers notification step 與 Job success does not trigger notification step 與 GitHub Actions if: failure() || cancelled() 修正
- [x] 5.2 更新 `.github/workflows/worker.yml`：在 workflow 頂層新增 `concurrency: { group: "worker-scan", cancel-in-progress: false }`；實作 GitHub Actions concurrency group prevents overlapping worker jobs 與 New cron trigger waits when previous job is still running 與 GitHub Actions concurrency 防止 job 重疊

## 6. 環境變數文件更新

- [x] 6.1 更新 `webapp/.env.example`：新增 `SYSTEM_ALERT_WEBHOOK` 說明（`# 開發者專用 Discord Webhook，用於 Worker 逾時與爬蟲嚴重錯誤通知（選填）`）
- [x] 6.2 更新 `.env.example`（Worker 根目錄）或相關說明文件：新增 `SYSTEM_ALERT_WEBHOOK`、`SCAN_TIMEOUT_SECONDS`（預設 300）、`SEMAPHORE_PER_PLATFORM`（預設 3）三個環境變數說明

## 7. 前端 — Dashboard 平台健康狀態

- [x] 7.1 更新 `webapp/app/dashboard/page.tsx`（或轉為 Client Component）：新增「平台掃描狀態」區塊，從 `GET /api/platform-status` 取得資料；以表格或卡片列出各平台的 lastSuccess 相對時間（"N 分鐘前"）與 failCount；實作 Dashboard displays per-platform scan health status 與 Dashboard shows last success time for each platform
- [x] 7.2 更新 `webapp/app/dashboard/page.tsx`：failCount >= 3 的平台顯示視覺警示標示（橙色或紅色 badge）並展示 lastError 訊息；無 PlatformScanStatus 記錄時顯示「尚無掃描記錄」；實作 Dashboard shows warning indicator for platforms with failCount >= 3 與 Dashboard shows no data state for platform with no scan record

## 8. 驗證測試

- [x] 8.1 驗證 asyncio 平行化效能：本機執行 `python main.py` 一個 scan cycle，確認 5 個以上關鍵字 × 多平台在 5 分鐘內完成；確認 log 中出現多個平台同時在執行（非循序）；實作 All keyword-platform tasks are gathered concurrently 的驗證
- [x] 8.2 驗證 Semaphore 限流：設定 `SEMAPHORE_PER_PLATFORM=1`，確認同一平台的請求變為循序（log 時間戳可觀察），確認 One platform failure does not block other platforms 仍然成立
- [x] 8.3 驗證逾時保護：設定 `SCAN_TIMEOUT_SECONDS=5` 並執行掃描，確認觸發 asyncio.TimeoutError 後有「⏱ 掃描逾時」Discord 通知（若設定 SYSTEM_ALERT_WEBHOOK）或 stdout log；確認未設定 SYSTEM_ALERT_WEBHOOK 時程序不崩潰；實作 Scan cycle exceeds timeout and triggers alert 與 SYSTEM_ALERT_WEBHOOK not set silences alert but does not crash 的驗證
- [x] 8.4 驗證 GitHub Actions if 條件修正：在 worker.yml 中模擬 cancelled 狀態（手動觸發並立即取消），確認通知 step 有執行；實作 Job timeout triggers notification step 的驗證
- [x] 8.5 驗證 concurrency 防重疊：手動同時觸發兩次 workflow，確認第二個 job 進入 queued 狀態而非同時執行，且第一個 job 未被取消；實作 New cron trigger waits when previous job is still running 的驗證
- [x] 8.6 驗證 PlatformScanStatus 寫入：執行一個 scan cycle 後查詢 DB，確認 PlatformScanStatus 各平台有 lastSuccess 更新；人工讓某平台失敗，確認 failCount 遞增、lastError 有值、lastSuccess 不變；實作 Successful platform scan updates lastSuccess and resets failCount 與 Failed platform scan increments failCount and records error 的驗證
- [x] 8.7 驗證 Dashboard 健康狀態顯示：前往 `/` Dashboard，確認各平台顯示「N 分鐘前」；將某平台 failCount 手動設為 3，確認 Dashboard 顯示警示標示與 lastError；確認無記錄平台顯示「尚無掃描記錄」；實作 Dashboard displays per-platform scan health status 的驗證
- [x] 8.8 驗證 Worker platform-status API 認證：不帶 WORKER_SECRET 呼叫 `PATCH /api/worker/platform-status`，確認回傳 HTTP 401；Worker platform-status API requires WORKER_SECRET authentication
- [x] 8.9 執行 `npm run build` 確認前端無 TypeScript 編譯錯誤
