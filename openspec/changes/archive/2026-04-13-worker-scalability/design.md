## Context

目前 Worker（`src/scheduler.py`）以三層巢狀迴圈循序執行：`for keyword → for platform → watcher.search()`。每次請求平均 4 秒，10 個關鍵字 × 12 平台 = 120 次請求 ≈ 480 秒，遠超過 GitHub Actions job 的 5 分鐘可用掃描時間（`timeout-minutes: 8` 扣除 2–3 分鐘 setup）。

目前已知的兩個問題：
1. **循序瓶頸**：掃描時間與關鍵字數量線性增長，10 個關鍵字已超時，未來 100 個關鍵字完全不可行
2. **無聲逾時**：GitHub Actions `timeout-minutes` 觸發時，job 狀態為 `cancelled`，但現有 `if: failure()` 條件不捕捉 `cancelled`，導致逾時通知永遠不觸發

所有爬蟲目前為同步 Playwright 操作（`browser.new_page()`），需改為 async Playwright（`async_playwright`）。

## Goals / Non-Goals

**Goals:**

- 將掃描 cycle 改為 asyncio 平行化，在 5 分鐘內支援 100 個關鍵字 × 12 平台
- 以 Semaphore 限制每平台並行數，避免觸發平台速率限制
- Python 層 asyncio.wait_for 逾時保護，超時時送開發者 Discord 通知
- 修正 GitHub Actions 通知條件，確保 timeout/cancel 皆觸發通知
- 新增 concurrency 設定防止 job 重疊
- 記錄各平台掃描健康狀態（PlatformScanStatus），Dashboard 可視化

**Non-Goals:**

- 不實作跨多台機器的分散式爬取
- 不更改 cron 觸發頻率（維持 `*/10 * * * *`）
- 不為每個關鍵字個別設定逾時
- 不實作失敗自動重試（僅記錄並通知）
- 不更改 Playwright 版本或瀏覽器引擎

## Decisions

### asyncio.gather + per-platform Semaphore 限制並行數

**決策**：使用 `asyncio.gather(*tasks)` 平行執行所有 keyword×platform 組合，並為每個平台建立獨立的 `asyncio.Semaphore(3)`，限制對同一平台最多 3 條並行連線。

**理由**：
- 120 個任務若不限流，同時 120 個 Playwright tab 會耗盡記憶體並觸發平台封鎖
- 每平台 3 條並行是保守值：爬蟲請求間隔約 1–2 秒，3 條可降低封鎖風險，同時達到有效加速
- 平行化後估算：1200 任務（100 關鍵字 × 12 平台）/ 30 並行（10 平台 × 3）× 4 秒 ≈ 160 秒，安全落在 5 分鐘內

**替代方案**：
- 全局單一 Semaphore（限制總並行數）→ 無法針對不同平台差異化配置，且不能防止單一平台被集中打擊
- ThreadPoolExecutor → 與現有 async 架構不一致，Playwright 原生支援 async

### asyncio.wait_for(300s) Python 層逾時保護

**決策**：以 `asyncio.wait_for(run_scan_tasks(), timeout=300)` 包覆整個掃描邏輯，`asyncio.TimeoutError` 時呼叫 `send_system_alert()` 送 Discord 通知。

**理由**：
- GitHub Actions `timeout-minutes: 8` 為外部硬截止，Python 層 300 秒保護可在 Actions 強制終止前先行通知並做清理
- 300 秒 = 5 分鐘，與 Actions 可用掃描時間相符；即使觸發 Actions timeout，也已在 Python 層先發出通知

**替代方案**：
- 只靠 GitHub Actions timeout → 觸發後 job 為 cancelled，無法在 Python 程式碼中執行通知邏輯

### GitHub Actions if: failure() || cancelled() 修正

**決策**：將 `worker.yml` 中所有通知 step 的條件從 `if: failure()` 改為 `if: failure() || cancelled()`。

**理由**：GitHub Actions `timeout-minutes` 超時後 job 狀態為 `cancelled`，不觸發 `failure()`。`cancelled()` 必須明確列出才會被捕捉。

**替代方案**：
- `if: always()` → 成功也會觸發通知，造成噪音

### GitHub Actions concurrency 防止 job 重疊

**決策**：在 `worker.yml` workflow 層新增 `concurrency: { group: "worker-scan", cancel-in-progress: false }`。

**理由**：
- `cancel-in-progress: false` 確保正在執行的掃描不被下一個 cron trigger 強制取消，避免部分掃描被截斷
- 若上一輪超時仍在執行，新一輪 job 會等待（而非立即取消上一輪），保留掃描完整性

**替代方案**：
- `cancel-in-progress: true` → 導致舊 job 被取消，掃描中斷；且 Python 層逾時保護已能在 5 分鐘內完成

### PlatformScanStatus 記錄各平台健康狀態

**決策**：新增 `PlatformScanStatus` model（`platform String @unique`、`userId String`、`lastSuccess DateTime?`、`lastError String?`、`failCount Int @default(0)`、`updatedAt DateTime @updatedAt`），Worker 在每次平台掃描完成後透過 `PATCH /api/worker/platform-status` 更新。

**理由**：
- 不使用 ScanLog（現有 model）是因為 ScanLog 以 scan cycle 為單位，而平台健康狀態需要以平台為維度查詢
- 以 `platform` 為 unique key，每次更新為 upsert，不產生歷史累積資料

**替代方案**：
- 沿用 ScanLog 加 platform 欄位 → 查詢時需聚合，Dashboard 呈現複雜度增加
- 純 Dashboard 前端 polling（不存 DB）→ 重整後失去狀態，無法顯示跨 cycle 的健康趨勢

### SYSTEM_ALERT_WEBHOOK 與用戶 webhook 分離

**決策**：新增 `SYSTEM_ALERT_WEBHOOK` 環境變數（Worker secrets），專用於 Python 層逾時與爬蟲嚴重錯誤通知，不使用任何用戶的 Discord webhook。

**理由**：
- 系統告警通知開發者，不應混入用戶通知頻道
- 若 `SYSTEM_ALERT_WEBHOOK` 未設定，告警改為僅 log 到 stdout，不中斷掃描流程

## Risks / Trade-offs

- **Playwright async 改寫成本高**：所有爬蟲需從同步 API 改為 `async_playwright` async API，改寫量大。緩解：逐一改寫，先改 scheduler 層為 asyncio wrapper，再逐個爬蟲 migrate。
- **Semaphore 值難以確定最優**：每平台 3 條是保守估計，實際值需根據平台速率限制測試調整。緩解：以環境變數 `SEMAPHORE_PER_PLATFORM`（預設 3）允許調整，不需改程式碼。
- **asyncio.gather 中任一任務例外不阻止其他任務**：使用 `return_exceptions=True` 確保單一平台失敗不影響其他。緩解：在 gather 結果中過濾 Exception 並記錄。
- **PlatformScanStatus 產生大量 DB 寫入**：每個 keyword×platform 掃描後皆 upsert，100 關鍵字 × 12 平台 = 1200 次。緩解：改為 per-platform 一次性 upsert（掃描完該平台所有關鍵字後），降至 12 次/cycle。

## Migration Plan

1. 新增 `PlatformScanStatus` model 並執行 migration
2. 建立 `PATCH /api/worker/platform-status` API endpoint
3. 將所有爬蟲改為 async（`async_playwright`）
4. 改寫 `scheduler.py` 為 asyncio + Semaphore + wait_for
5. 更新 `api_client.py` 新增 `update_platform_scan_status()`
6. 更新 `worker.yml`：concurrency + `if: failure() || cancelled()`
7. 更新 Dashboard 顯示平台健康狀態
8. 新增 `SYSTEM_ALERT_WEBHOOK` 至 `.env.example` 與 GitHub Secrets 說明

**回滾策略**：若平行化後出現穩定性問題，可透過設定 `SEMAPHORE_PER_PLATFORM=1` 降回接近循序行為，無需回滾程式碼。
