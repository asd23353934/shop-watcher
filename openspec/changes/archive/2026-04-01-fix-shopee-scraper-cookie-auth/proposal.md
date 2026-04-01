## Why

蝦皮（shopee.tw）的 fraud detection 系統會偵測自動化瀏覽器，將搜尋頁強制導向登入頁，導致 `search_items` API 始終回傳 error=90309999，Worker 無法抓取任何商品。此問題影響所有啟用蝦皮平台的關鍵字監控，需要立即修復。

## What Changes

- **playwright_stealth API 升級**：舊版 `stealth_async` 已從 `playwright_stealth` 1.0.6 移除，改用新 API `Stealth(chrome_runtime=True).apply_stealth_async(page)`
- **蝦皮爬蟲多層 fallback 策略**：新增純 httpx HTTP 請求層（第一層）與 Playwright cookie → httpx 混合層（第三層），在 Playwright 攔截失敗時依序嘗試
- **csrftoken HttpOnly 修正**：`_fetch_via_browser` 改從 Playwright Python 端提取 csrftoken（可讀 HttpOnly cookie），而非從 JavaScript `document.cookie` 讀取（無法讀取 HttpOnly）
- **SHOPEE_COOKIES_JSON 注入機制**：`scheduler.py` 讀取環境變數並在每次掃描前注入真實 session cookies，繞過 fraud detection；`worker.yml` 新增對應 secret 設定
- **首頁預熱最佳化**：已有 cookies 時跳過首頁預載，減少不必要的網路請求
- **fraud detection 清楚錯誤訊息**：偵測到 `fu_tracking_id` redirect 時輸出明確說明，提示需設定 `SHOPEE_COOKIES_JSON`
- **requirements.txt 補齊**：補上 `playwright-stealth==1.0.6`（已安裝但未列入）

## Non-Goals

- 不實作自動 cookie 更新或登入流程（需人工定期匯出）
- 不處理帳號封鎖防護（隨機延遲等）——留待後續 change
- 不變更露天（Ruten）爬蟲邏輯

## Capabilities

### New Capabilities

- `shopee-session-cookie-auth`：透過環境變數注入真實 Shopee session cookies，使 Worker 能在 headless 環境中通過 fraud detection 並成功呼叫 search_items API

### Modified Capabilities

- `keyword-search`：蝦皮搜尋策略由「Playwright 攔截 + DOM fallback」改為「httpx 純 HTTP → Playwright 攔截（含 HttpOnly csrftoken 注入）→ browser fetch（Playwright cookie）→ page state → DOM」五層 fallback；且需要有效的 session cookies 才能正常運作

## Impact

- Affected code:
  - `src/scrapers/shopee.py`（主要修改）
  - `src/scheduler.py`（新增 cookie 注入邏輯）
  - `.github/workflows/worker.yml`（新增 SHOPEE_COOKIES_JSON secret）
  - `requirements.txt`（補上 playwright-stealth）
- Affected dependencies: `playwright-stealth==1.0.6`（新 API）、`httpx==0.27.0`（已有）
