## Context

蝦皮（shopee.tw）對自動化瀏覽器實施多層 fraud detection：

1. **JavaScript 指紋偵測**：偵測 `navigator.webdriver`、Canvas/WebGL 指紋、`SPC_F` cookie 與當前瀏覽器環境的一致性
2. **IP 信譽偵測**：GitHub Actions 機房 IP 被標記為高風險
3. **行為分析**：缺乏滑鼠移動、滾動等人類行為信號

結果：所有自動化瀏覽器（headless Chromium、headless 真 Chrome、非 headless 真 Chrome）訪問搜尋頁時，都會被 `fu_tracking_id` redirect 至登入頁，`search_items` API 回傳 error=90309999。

唯一可行方案是注入從真實 Chrome（使用者瀏覽器）匯出的已登入 session cookies，讓 `SPC_F` 等指紋 cookies 與 Shopee server 端記錄的裝置資料吻合。

## Goals / Non-Goals

**Goals:**

- 透過 `SHOPEE_COOKIES_JSON` 環境變數注入真實 session cookies，繞過 fraud detection
- 建立多層 fallback 策略，在 cookies 有效時能成功抓取商品
- 提供清楚的錯誤訊息，指引使用者在 cookies 失效時如何更新

**Non-Goals:**

- 自動登入或自動更新 cookies（需人工定期維護）
- 帳號封鎖防護（隨機延遲等）
- 繞過 TLS 指紋偵測（httpx 的 403 問題）——curl_cffi 等方案留待後續評估

## Decisions

### 注入點選在 browser context 層級而非 page 層級

在 `scheduler.py` 的 `context.add_cookies()` 注入，而非在 `shopee.py` 每個 page 注入。

**原因**：Context 層級注入只需執行一次，所有從該 context 建立的 page 自動繼承 cookies；且 `shopee.py` 不需要知道 cookies 的來源，保持模組職責分離。

### 五層 fallback 順序

`httpx 純 HTTP → Playwright 攔截 → browser fetch（Playwright csrftoken）→ page state → DOM`

**原因**：
- httpx 層最快，不需啟動瀏覽器；但因 TLS 指紋問題目前在無 cookies 時失敗
- Playwright 攔截層是有效 cookies 下的主要成功路徑（已驗證）
- browser fetch 和 page state 作為備援，應對 API 結構變動
- DOM 作為最後手段

### csrftoken 從 Python 端提取而非 JavaScript

在 `_fetch_via_browser` 中，改由 `page.context.cookies()` 取得 csrftoken，再作為參數傳入 `page.evaluate`。

**原因**：`csrftoken` 雖然 EditThisCookie 可匯出，但 Shopee 可能在不同頁面將其設為 HttpOnly；`document.cookie` 無法讀取 HttpOnly cookies，導致傳空值給 API 而失敗。Playwright 的 `context.cookies()` 可讀取所有 cookies 包含 HttpOnly。

### 已有 cookies 時跳過首頁預熱

**原因**：首頁預熱的目的是取得初始 session cookies；若已透過 `SHOPEE_COOKIES_JSON` 注入，重複造訪首頁只是浪費時間，且可能觸發 session 重置。

## Risks / Trade-offs

- **[風險] Cookie 過期** → 使用者需定期（約每月）重新登入蝦皮並重新匯出 cookies 更新 GitHub Actions secret `SHOPEE_COOKIES_JSON`
- **[風險] SPC_F 裝置指紋不符** → 若 Shopee server 端偵測到 `SPC_F` 與當前瀏覽環境不符，仍會拒絕請求；緩解方式：使用者在匯出 cookies 後立即更新 secret
- **[風險] 帳號關聯風險** → 使用個人帳號 cookies 進行自動化操作有被封號風險；緩解方式：建議使用專用帳號
- **[取捨] httpx 403 未解決** → 純 HTTP 路徑因 TLS 指紋問題始終失敗，此層目前無實際效果但保留作為未來（如 curl_cffi）升級的插槽

## Migration Plan

1. 使用者在 Chrome 登入 shopee.tw
2. 安裝 EditThisCookie (fork) 擴充功能
3. 在蝦皮搜尋頁匯出 cookies（JSON 格式）
4. 將 JSON 存入 GitHub Actions secret `SHOPEE_COOKIES_JSON`
5. 觸發 Worker 確認抓取成功

**Rollback**：移除 `SHOPEE_COOKIES_JSON` secret 即可回到無 cookie 模式（功能失效但不影響其他平台）
