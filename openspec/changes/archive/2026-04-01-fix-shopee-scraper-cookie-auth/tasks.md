## 1. 依賴與套件更新

- [x] 1.1 在 `requirements.txt` 補上 `playwright-stealth==1.0.6`（已安裝但未列入）

## 2. shopee.py — playwright_stealth API 升級

- [x] 2.1 將 `from playwright_stealth import stealth_async` 改為 `from playwright_stealth import Stealth`，並在模組頂層初始化 `_stealth = Stealth(chrome_runtime=True)`；移除所有 `await stealth_async(page)` 呼叫，改為 `await _stealth.apply_stealth_async(page)`

## 3. shopee.py — 五層 fallback 順序

- [x] 3.1 新增 `_HTTP_HEADERS` 常數，模擬瀏覽器 User-Agent、Accept、Accept-Language 等標頭，供 httpx 請求使用
- [x] 3.2 新增 `_call_search_api_with_cookies(keyword, cookies)` 非同步函式（Layer 1 / Layer 4 共用）：從 cookie 列表提取 `csrftoken`，組合 `Cookie` header，以 httpx 呼叫 `search_items` API，回傳 item list 或空列表（涵蓋 Requirement: Shopee search returns newest listings sorted by creation time — Layer 1 pure HTTP 部分）
- [x] 3.3 修改 `_intercept_search_api` 的 `on_response` 處理器：移除只有 `raw.get("items")` 非空才捕捉的限制，改為捕捉任何非錯誤的 `search_items` 回應（涵蓋 Requirement: Shopee search returns newest listings sorted by creation time — Layer 2 Playwright 攔截部分）；補上 `api_urls_seen` 列表記錄所有 `/api/v4/` URL
- [x] 3.4 修改 `_fetch_via_browser`（csrftoken 從 Python 端提取而非 JavaScript）：移除從 `document.cookie` 讀取 csrftoken 的邏輯，改為在 Python 端呼叫 `page.context.cookies(["https://shopee.tw"])` 提取 csrftoken，再以參數形式傳入 `page.evaluate()`（涵蓋 Requirement: Shopee search returns newest listings sorted by creation time — Layer 3 browser fetch 部分）
- [x] 3.5 修改 `scrape_shopee` 主函式，依五層 fallback 順序依序執行：(1) `_scrape_shopee_http`、(2) `_intercept_search_api`、(3) `_fetch_via_browser`、(4) page state（context cookies → httpx）、(5) DOM；任一層回傳非空 list 即停止（涵蓋 Requirement: Shopee search returns newest listings sorted by creation time 完整流程）

## 4. shopee.py — 首頁預熱最佳化與 fraud detection 錯誤訊息

- [x] 4.1 在 `scrape_shopee` 中實作「Shopee search navigates to homepage first to obtain session cookies」的條件邏輯：進入 Playwright 策略前呼叫 `page.context.cookies(["https://shopee.tw"])`；注入點選在 browser context 層級而非 page 層級（已有 cookies 時跳過首頁預熱），已有 cookies 則跳過首頁 `https://shopee.tw/` 預載並記錄 INFO 日誌；無 cookies 則照原邏輯訪問首頁
- [x] 4.2 在 Playwright 導覽至搜尋 URL 後實作「Shopee scraper detects fraud-detection redirect and emits clear error」：檢查 `page.url` 是否包含 `fu_tracking_id`；若是則記錄 WARNING 說明 fraud detection 攔截並指示使用者設定 `SHOPEE_COOKIES_JSON`

## 5. scheduler.py — SHOPEE_COOKIES_JSON 注入機制

- [x] 5.1 在 `run_scan_cycle()` 建立 Playwright `context` 後實作「Scheduler injects Shopee session cookies into browser context before scanning」：讀取 `os.environ.get("SHOPEE_COOKIES_JSON", "")`；若非空則以 `json.loads()` 解析並呼叫 `context.add_cookies(cookies)`（注入點選在 browser context 層級而非 page 層級），記錄注入的 cookie 數量；解析失敗時記錄 WARNING 並繼續

## 6. worker.yml — CI 環境變數

- [x] 6.1 在 `.github/workflows/worker.yml` 的 scan step `env` 區塊實作「Worker CI workflow exposes SHOPEE_COOKIES_JSON secret to the scan step」：新增 `SHOPEE_COOKIES_JSON: ${{ secrets.SHOPEE_COOKIES_JSON }}`，並附上說明此為選用的 secret
