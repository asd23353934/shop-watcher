## 1. 前端平台常數與 UI 更新

- [x] 1.1 更新 `webapp/constants/platform.ts`：實作 平台清單以常數檔集中管理（前後端分離）— 移除 `shopee`，新增 `pchome`（PChome 24h）、`momo`（MOMO購物）、`animate`（Animate台灣）、`yahoo-auction`（Yahoo拍賣）、`mandarake`（Mandarake）、`myacg`（買動漫）、`kingstone`（金石堂 ACG）的 `PLATFORM_LABELS` 與 `PLATFORM_BADGE_CLASS` 條目
- [x] 1.2 更新 `webapp/components/KeywordForm.tsx`：將硬編碼的 `['shopee', 'ruten']` 陣列改為 `Object.keys(PLATFORM_LABELS)`；將預設選取平台從 `['shopee', 'ruten']` 改為 `['ruten']`；確認 Platform selection UI shows all supported platforms
- [x] 1.3 更新 `webapp/components/KeywordList.tsx`：將硬編碼的 `['shopee', 'ruten']` 陣列改為 `Object.keys(PLATFORM_LABELS)`；確認 Edit keyword form shows all supported platforms

## 2. Python scraper — Tier 1 新平台

- [x] 2.1 建立 `src/scrapers/pchome.py`：實作 `async def scrape_pchome(page, keyword, min_price, max_price) -> list[WatcherItem]`，使用 `httpx.AsyncClient` 呼叫 `ecshweb.pchome.com.tw/search/v3.3/all/results?q={keyword}&sort=new&offset=0`，解析 `prods[]` 陣列，映射 `Id→item_id`、`name`、`price`、`picB→image_url`（前綴 `https://cs-b.ecimg.tw/items/`）、URL 格式 `https://24h.pchome.com.tw/prod/{Id}`；套用 `_apply_price_filter`；任何例外回傳 `[]`（PChome 24h search returns newest listings via JSON API）
- [x] 2.2 建立 `src/scrapers/momo.py`：實作 `async def scrape_momo(page, keyword, min_price, max_price) -> list[WatcherItem]`，使用 `httpx.AsyncClient` GET `momoshop.com.tw/search/searchShop.jsp?keyword={keyword}&searchType=1&cateLevel=0&ent=k&_isFuzzy=0`，以 `BeautifulSoup` 找 `<script type="application/ld+json">` 中 `@type=ItemList` 的區塊，解析 `itemListElement`，映射 `name`、`offers.price→price`、`url`、`image→image_url`、從 URL `/goods/{id}` 提取 `item_id`；任何例外回傳 `[]`（MOMO購物 search returns listings via SSR JSON-LD parsing）
- [x] 2.3 建立 `src/scrapers/animate.py`：實作 `async def scrape_animate(page, keyword, min_price, max_price) -> list[WatcherItem]`，使用 `httpx.AsyncClient` GET `animate-onlineshop.com.tw/Form/Product/ProductList.aspx?KeyWord={keyword}&sort=07&udns=1`，以 `BeautifulSoup` 解析商品卡片，從 `ProductDetail.aspx?shop=0&pid={pid}` 連結提取 `item_id`，解析 `NT$` 格式價格（取折扣後較低價），解析商品名稱與圖片 `src`；任何例外回傳 `[]`（Animate Taiwan search returns newest listings via ASP.NET SSR HTML parsing）

## 3. Python scraper — Tier 2 新平台

- [x] 3.1 建立 `src/scrapers/yahoo_auction.py`：實作 `async def scrape_yahoo_auction(page, keyword, min_price, max_price) -> list[WatcherItem]`，使用 `httpx.AsyncClient` GET `tw.bid.yahoo.com/search/auction/product?p={keyword}&sort=ontime`，以 regex 提取 `<script id="__NEXT_DATA__">` JSON 或等效 JS state 物件，解析商品 title、currentPrice、itemUrl，從 URL 提取 `item_id`；任何例外回傳 `[]`（Yahoo拍賣 search returns newest listings via embedded JSON parsing）
- [x] 3.2 建立 `src/scrapers/mandarake.py`：實作 `async def scrape_mandarake(page, keyword, min_price, max_price) -> list[WatcherItem]`，套用 Mandarake 使用固定 cookie `tr_mndrk_user=1` 設計決策 — 使用 `httpx.AsyncClient` GET `order.mandarake.co.jp/order/listPage/list?keyword={keyword}&sort=arrival&sortOrder=1&dispCount=24&lang=en&soldOut=1`，帶 `cookies={"tr_mndrk_user": "1"}`；若回應為 302 或重定向至首頁則記錄 warning 並回傳 `[]`；以 `BeautifulSoup` 解析商品卡，提取 `itemCode`、商品名稱、日圓價格（解析 `¥N,NNN` 格式儲存為 float，不做匯率換算）、`price_text`、圖片；任何例外回傳 `[]`（Mandarake search returns newest listings via cookie-gated SSR HTML parsing）

## 3b. Python scraper — 買動漫與金石堂

- [x] 3b.1 建立 `src/scrapers/myacg.py`：實作 `async def scrape_myacg(page, keyword, min_price, max_price) -> list[WatcherItem]`，使用 `httpx.AsyncClient` GET `https://www.myacg.com.tw/goods_list_show_002.php?keyword_body={keyword}&sort=1&page=1&ct18=1`；以 `BeautifulSoup` 解析 HTML fragment，從 `goods_detail.php?gid={gid}` 連結提取 `item_id`，解析商品名稱與 CDN 圖片 URL（`cdn.myacg.com.tw`）；price 欄位優先從 AJAX fragment 解析，若不存在則設 `null`（允許 null price）；R18 products are included via ct18 parameter；任何例外回傳 `[]`（買動漫（MyACG）search returns newest listings via AJAX endpoint）
- [x] 3b.2 建立 `src/scrapers/kingstone.py`：實作 `async def scrape_kingstone(page, keyword, min_price, max_price) -> list[WatcherItem]`，使用 `httpx.AsyncClient` GET `https://www.kingstone.com.tw/search/key/{keyword}/lid/search`；以 `BeautifulSoup` 解析商品列表，從 `/basic/{id}/` URL 提取 `item_id`，優先取折扣價（Discounted price takes priority over original price），解析 NT$ 格式數字，解析商品名稱與縮圖；任何例外回傳 `[]`（金石堂 ACG search returns newest listings via SSR HTML parsing）

## 4. Scheduler 整合與 Shopee 停用

- [x] 4.1 更新 `src/scheduler.py` 新增所有平台的 elif 分支（pchome、momo、animate、yahoo-auction、mandarake、myacg、kingstone）：實作 Scheduler runs all keyword searches on a configurable interval 支援新平台；各 scraper 使用 PChome 使用官方 JSON API，其餘 SSR 平台使用 BeautifulSoup 解析 HTML 的策略；所有新 scraper 使用 httpx 純 HTTP 請求，不使用 Playwright（page 參數仍傳遞保持介面統一但不使用）
- [x] 4.2 更新 `src/scheduler.py` Shopee 分支：將 `if platform == "shopee":` 改為 Shopee 分支改為「已停用」警告，不執行掃描 — 記錄 `WARNING: shopee platform is suspended, skipping` 並 `continue`；移除 Shopee session-cookie injection into browser context 相關邏輯（ShopeeBlockedError/ShopeeSessionExpiredError catch 區塊、storage state 刪除）；確認 Shopee search navigates to homepage first to obtain session cookies 與 Shopee search returns newest listings sorted by creation time 邏輯皆已移除
- [x] 4.3 在 `src/scheduler.py` 頂部新增對所有新 scraper 的 import 語句（`from src.scrapers.pchome import scrape_pchome`、`scrape_momo`、`scrape_animate`、`scrape_yahoo_auction`、`scrape_mandarake`、`scrape_myacg`、`scrape_kingstone`）

## 4b. 同人誌平台 Scraper 實作

- [x] 4b.1 建立 `src/scrapers/booth.py`：實作 `async def scrape_booth(page, keyword, min_price, max_price) -> list[WatcherItem]`，URL `https://booth.pm/zh-tw/search/{keyword}?adult=t&sort=new_arrival`；`adult=t` 解除年齡限制（BOOTH age bypass via adult=t URL parameter）；解析 `li.item-card[data-product-id]` data 屬性（`data-product-id`、`data-product-name`、`data-product-price`、`[data-original]` 圖片）；任何例外回傳 `[]`
- [x] 4b.2 建立 `src/scrapers/dlsite.py`：實作 `async def scrape_dlsite(page, keyword, min_price, max_price) -> list[WatcherItem]`，使用 AJAX endpoint `https://www.dlsite.com/maniax/fsr/ajax`；params `age_category[0]=18`（DLsite R18 age bypass via maniax domain + age_category parameter）、`order=release_d`（release date descending，最新發布優先；`order=release` 為舊作品，不可使用）；header `X-Requested-With: XMLHttpRequest` 必須；回應 JSON 中 `search_result` 為 HTML 字串，解析 `li.search_result_img_box_inner[data-list_item_product_id]`；**DLsite 搜尋為全文搜尋（標題+標籤+說明），非僅標題比對；日語關鍵字效果遠優於中文（鋼彈=2筆 vs ガンダム=1594筆）或英文**；任何例外回傳 `[]`
- [x] 4b.3 建立 `src/scrapers/toranoana.py`：實作 `async def scrape_toranoana(page, keyword, min_price, max_price) -> list[WatcherItem]`；Toranoana search returns newest listings via SSR HTML，URL `https://ecs.toranoana.jp/tora/ec/app/catalog/list?searchWord={keyword}&sort=newitem`；解析 `li.product-list-item`，從 `a[href*="/item/{id}/"]` 提取 item_id，名稱優先取 `a[title]` 屬性；任何例外回傳 `[]`
- [x] 4b.4 建立 `src/scrapers/melonbooks.py`：實作 `async def scrape_melonbooks(page, keyword, min_price, max_price) -> list[WatcherItem]`，URL `https://www.melonbooks.co.jp/search/search.php?search_all={keyword}&sort=new`；cookie `AUTH_ADULT=1` 解除年齡限制（Melonbooks R18 age bypass via AUTH_ADULT cookie）；解析 `.item-list li`，從 `a[href*="product_id="]` 提取 item_id，名稱優先取 `a[title]` 屬性；任何例外回傳 `[]`
- [x] 4b.5 更新 `src/scheduler.py` 新增 booth、dlsite、toranoana、melonbooks 的 elif 分支與 import 語句；更新 `webapp/constants/platform.ts` 新增四平台的 `PLATFORM_LABELS` 與 `PLATFORM_BADGE_CLASS` 條目

## 5. 驗證

- [x] 5.1 手動執行 `python -c "import asyncio; from src.scrapers.pchome import scrape_pchome; ..."` 驗證 PChome scraper 能回傳非空列表（無 Playwright 依賴）
- [x] 5.2 手動執行驗證 MOMO scraper 能回傳非空列表（改用 RSC payload 解析，verify=False）
- [x] 5.3 手動執行驗證 Animate scraper 能回傳非空列表（修正 img alt 名稱提取）
- [x] 5.4 手動執行驗證 Yahoo拍賣 scraper 能回傳非空列表（改用 isoredux-data）
- [x] 5.5 手動執行驗證 Mandarake scraper 能回傳非空列表（確認 cookie 機制正確）
- [x] 5.6 手動執行驗證 買動漫 scraper 能回傳非空列表（確認 AJAX endpoint + ct18=1 正確；修正 img alt 名稱提取；price 為 null）
- [x] 5.7 手動執行驗證 金石堂 scraper 能回傳非空列表（加 verify=False 繞過 SSL 憑證問題）
- [x] 5.8 多輪次驗證 BOOTH、DLsite、Toranoana、Melonbooks scraper 穩定性（無 session 過期問題，每次獨立 HTTP 請求無狀態依賴）
- [x] 5.9 在本地執行 `npm run build` 確認前端編譯通過，平台常數正確（無蝦皮、含十一個新平台含 booth、dlsite、toranoana、melonbooks）
