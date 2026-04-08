## Context

目前 Worker 只支援蝦皮（Shopee）與露天（Ruten）兩個平台。蝦皮因 anti-bot 機制複雜且不穩定（需 session cookie 注入、多層 fallback），維護成本過高，決定暫時停用。同時，系統缺乏對其他販售平台的支援——「販售平台」在本專案中為上位詞，涵蓋台灣電商、拍賣、動漫專門店及同人誌販售平台（含數位作品），共同特徵為「付費取得商品或作品」。

本次新增十一個販售平台，均採用純 HTTP 請求（非 Playwright），以降低資源消耗並提升穩定性。

## Goals / Non-Goals

**Goals:**

- 新增 PChome 24h、MOMO購物、Animate Taiwan、Yahoo拍賣、Mandarake、買動漫（MyACG）、金石堂 ACG 七個平台的 scraper
- 移除 Shopee scraper 的主動呼叫（保留檔案，不刪除）
- 前端平台選單改為新平台清單
- 統一 scraper 介面（與現有 `scrape_ruten` 相同簽名）

**Non-Goals:**

- 不刪除 `src/scrapers/shopee.py`（保留供未來恢復使用）
- 不實作 AmiAmi、駿河屋（需 stealth Playwright）
- 不做日圓→台幣匯率換算（Mandarake 價格以日圓原價儲存）
- 不修改 `notify/batch` API 或去重邏輯

## Decisions

### 所有新 scraper 使用 httpx 純 HTTP 請求，不使用 Playwright

**Rationale**: 五個新平台均可透過 HTTP GET 取得商品資料（JSON API 或 SSR HTML），無需真實瀏覽器。Playwright 資源消耗大、CI 時間長，能省則省。

**Alternatives considered**: 用現有的 Playwright page 物件（與 Ruten 相同）→ 沒有必要，HTTP 已足夠，且允許並行請求。

**Implementation**: 各 scraper 仍接受 `page: Page` 參數（維持統一介面），但內部用 `httpx.AsyncClient` 發請求，`page` 參數不使用。

### 平台清單以常數檔集中管理（前後端分離）

**Rationale**: 前端 `webapp/constants/platform.ts` 已有 `PLATFORM_LABELS` 與 `PLATFORM_BADGE_CLASS`，只需更新此檔，其他元件自動適用。

**Alternatives considered**: 從 API 動態取得平台清單 → 過度工程，平台清單變動頻率低。

### Mandarake 使用固定 cookie `tr_mndrk_user=1`

**Rationale**: Mandarake 需要此 cookie 才不會被重定向至首頁，cookie 值無須真實身分驗證，任意值均可通過。

**Implementation**: 在 `httpx.AsyncClient` 的 `cookies` 參數中設定 `{"tr_mndrk_user": "1"}`。

### PChome 使用官方 JSON API，其餘 SSR 平台使用 BeautifulSoup 解析 HTML

**Rationale**:
- PChome：`ecshweb.pchome.com.tw/search/v3.3/all/results` 回傳乾淨 JSON，直接解析 `prods[]`
- MOMO：SSR HTML 內含 JSON-LD `ItemList`，用 `json.loads` 解析比 CSS selector 更穩定
- Animate TW：標準 ASP.NET HTML，CSS selector 足夠
- Yahoo拍賣：HTML 內嵌 `__NEXT_DATA__` JSON 或 JS 物件，用 regex 提取
- Mandarake：標準 SSR HTML，CSS selector 解析
- 買動漫（MyACG）：呼叫 AJAX 子端點（`goods_list_show_002.php`）直接取得 HTML fragment，無需渲染完整頁面；年齡 modal 是純前端，AJAX endpoint 完全不驗證；`ct18=1` 參數啟用 R18 商品
- 金石堂 ACG：完整 SSR HTML，BeautifulSoup CSS selector 解析；折扣價（`special-price`）優先於原價

### Shopee 分支改為「已停用」警告，不執行掃描

**Rationale**: 保留 scheduler 中 `if platform == "shopee"` 分支，記錄警告 log 後直接 `continue`，讓現有使用蝦皮的 keyword 不會靜默失敗，而是能在 log 中看到明確訊息。

## Risks / Trade-offs

- **[Risk] 各平台 HTML 結構改版導致 scraper 失效** → Mitigation: scraper 內 try/except 捕獲所有例外，失敗時回傳空列表並記錄警告，不中斷其他平台掃描
- **[Risk] MOMO / Yahoo JSON-LD 格式調整** → Mitigation: 解析失敗時 fallback 至 CSS selector 擷取；任一方法失敗均回傳 `[]`
- **[Risk] Mandarake IP 封鎖** → Mitigation: 加入 `User-Agent` 偽裝，未來可加隨機延遲
- **[Risk] 買動漫 AJAX endpoint price 欄位缺失** → Mitigation: 實作時若 AJAX fragment 無價格，改為解析商品列表頁 HTML 中其他 class；若仍無法取得則 `price=null`（去重與通知機制允許 null price）
- **[Risk] 現有使用蝦皮的 Keyword 無法掃描** → Mitigation: scheduler 記錄 WARNING，前端未來可提示使用者切換平台

## Migration Plan

1. 新增 7 個 scraper 檔案（`src/scrapers/pchome.py`、`momo.py`、`animate.py`、`yahoo_auction.py`、`mandarake.py`、`myacg.py`、`kingstone.py`）
2. 更新 `src/scheduler.py`：停用 shopee 分支，加入新平台 elif
3. 更新前端常數 `webapp/constants/platform.ts`
4. 更新前端元件硬編碼的平台陣列（`KeywordForm.tsx`、`KeywordList.tsx`）
5. 現有資料庫中 `platform="shopee"` 的 SeenItem / Keyword 資料不需處理（保留，不刪除）

無需 DB migration（`platform` 欄位為 `String`，無 enum 約束）。

## Open Questions

- Yahoo拍賣拍賣價格（已結標、目前出價）是否都適合通知？→ 暫定：只通知「目前出價」(`currentPrice`)，不區分結標狀態
- Mandarake 是否需要支援繁體中文搜尋？→ 暫定：支援，Mandarake 搜尋接受中文 keyword
- 買動漫 price 欄位確切位置？→ 實作時確認（AJAX fragment 或列表頁 HTML）；無法取得時允許 `null`
