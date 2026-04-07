## Why

目前 Worker 以循序方式依序發送 HTTP 請求（10 個關鍵字 × 12 平台 = 120 次請求，約 480 秒），遠超過 GitHub Actions `timeout-minutes: 8` 的可用掃描時間（扣除 2–3 分鐘 setup 僅剩約 5 分鐘）。此外，`if: failure()` 無法捕捉 Actions timeout/cancelled 事件，導致逾時時不會發出任何失敗通知，問題無聲消失。

## What Changes

- **asyncio 平行化爬取**：將 `scheduler.py` 的循序迴圈改為 `asyncio.gather`，並以 `asyncio.Semaphore` 限制每平台最多 3 條並行連線，避免對同一平台造成速率限制或封鎖
- **Python 層逾時保護**：以 `asyncio.wait_for(timeout=300)` 包覆整個掃描 cycle，逾時時透過 `SYSTEM_ALERT_WEBHOOK` 發送 Discord 通知，內容標示「掃描逾時」與逾時時間
- **GitHub Actions 通知修正**：將 worker.yml 的 notify step 條件從 `if: failure()` 改為 `if: failure() || cancelled()`，確保 timeout/cancel 皆觸發通知；通知訊息區分「逾時/取消」與「崩潰」兩種情境
- **GitHub Actions concurrency 群組**：新增 `concurrency` 設定，`cancel-in-progress: false`，防止上一輪 job 尚未結束時下一輪重疊啟動
- **PlatformScanStatus 模型**：新增資料庫 model，記錄各平台（platform）的最後成功掃描時間（lastSuccess）、最後錯誤訊息（lastError）、連續失敗次數（failCount）
- **Dashboard 平台掃描健康狀態**：Dashboard 頁面顯示各平台最後成功時間與連續失敗次數，超過閾值時以視覺警示標示
- **SYSTEM_ALERT_WEBHOOK 環境變數**：新增開發者專用 Discord Webhook，用於爬取失敗與掃描逾時通知，與用戶 webhook 分離

## Non-Goals

- 不實作跨多台機器的分散式爬取（單一 GitHub Actions runner 已足夠）
- 不更改 cron 觸發頻率（維持 `*/10 * * * *`）
- 不為每個關鍵字/平台組合提供獨立的逾時設定
- 不實作自動重試失敗的平台掃描（僅記錄並通知）

## Capabilities

### New Capabilities

- `parallel-scraping`: Worker 以 asyncio 平行化爬取所有關鍵字×平台組合，Semaphore 限流每平台最多 3 條並行
- `worker-timeout-protection`: Python 層 asyncio.wait_for 逾時保護（300 秒），逾時時透過 SYSTEM_ALERT_WEBHOOK 發送 Discord 通知
- `platform-scan-health`: PlatformScanStatus model 記錄各平台最後成功掃描時間與失敗次數；Dashboard 顯示平台掃描健康狀態

### Modified Capabilities

- `watcher-scheduler`: 掃描執行架構由循序改為 asyncio 平行，新增 Semaphore 限流與逾時包覆邏輯

## Impact

- 影響規格：watcher-scheduler（執行架構變更）
- 新增規格：parallel-scraping、worker-timeout-protection、platform-scan-health
- 受影響程式碼：
  - `src/scheduler.py`：核心改寫為 asyncio，新增 Semaphore、wait_for、逾時通知
  - `src/api_client.py`：新增 `update_platform_scan_status()` 方法
  - `src/watchers/base.py`：BaseWatcher 改為 async scrape 方法
  - `src/scrapers/*.py`：所有爬蟲改為 async
  - `webapp/prisma/schema.prisma`：新增 PlatformScanStatus model
  - `webapp/app/api/worker/platform-status/route.ts`：Worker 回報平台掃描狀態
  - `webapp/app/dashboard/page.tsx`：顯示各平台健康狀態
  - `.github/workflows/worker.yml`：修正 if 條件與新增 concurrency 設定
  - `webapp/.env.example`：新增 SYSTEM_ALERT_WEBHOOK 說明
