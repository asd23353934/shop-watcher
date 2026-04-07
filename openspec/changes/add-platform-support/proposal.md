## Why

蝦皮（Shopee）因 anti-bot 機制不穩定，暫時停止支援；同時系統缺乏對其他主流販售平台的監控能力。「販售平台」涵蓋台灣電商（PChome、MOMO）、拍賣（Yahoo拍賣）、動漫專門店（Animate TW、Mandarake、買動漫、金石堂）及同人誌販售平台（BOOTH、DLsite、Toranoana、Melonbooks）——性質各異但共同結構為「付費取得商品或作品」。擴充這些平台可大幅提升監控涵蓋範圍，直接服務動漫收藏玩家與同人誌愛好者。

## What Changes

- **移除** 蝦皮（Shopee）作為可選平台：前端不再顯示「蝦皮」選項；scheduler 移除 shopee 分支；shopee-session-cookie 相關邏輯停用
- **新增 Tier 1 平台**（優先實作）：
  - PChome 24h — 呼叫官方 JSON API，無需 Playwright
  - MOMO購物 — HTTP GET 解析 Next.js RSC payload（`RSC: 1` header），`verify=False` 繞過 SSL 憑證問題
  - Animate Taiwan — HTTP GET 解析 ASP.NET SSR HTML（動漫周邊專門店）
- **新增 Tier 2 平台**（次要實作）：
  - Yahoo拍賣 — HTTP GET 解析內嵌 isoredux-data Redux state JSON，`sort=ontime` 取最新上架
  - Mandarake — HTTP GET + cookie（`tr_mndrk_user=1`）解析 SSR HTML（日本中古動漫商品）
  - 買動漫（MyACG）— HTTP GET AJAX endpoint（`goods_list_show_002.php`），加 `ct18=1` 可取得 R18 動漫同人誌商品
  - 金石堂 ACG — HTTP GET SSR HTML（`/search/key/{keyword}/`），含折扣價，`verify=False` 繞過 SSL 憑證問題
- **新增同人誌/成人創作平台**：
  - BOOTH — HTTP GET SSR HTML，`adult=t` URL 參數解除年齡限制，解析 `li.item-card[data-product-*]` data 屬性
  - DLsite — AJAX JSON endpoint（`/maniax/fsr/ajax`），`age_category[0]=18` 包含 R18 成人作品；`order=release_d` 取最新發布；**關鍵字搜尋為全文搜尋（標題+標籤+說明），日語關鍵字效果遠優於中文或英文**
  - Toranoana — HTTP GET SSR HTML，`sort=newitem` 取最新上架
  - Melonbooks — HTTP GET SSR HTML，`AUTH_ADULT=1` cookie 解除年齡限制，`sort=new` 取最新上架
- 更新 scheduler 整合所有新平台的 scraper
- 前端平台選單更新為新平台清單
- 確認資料庫 `platform` 欄位無 enum 約束（目前為 `String`），無需 migration

## Non-Goals

- 不實作 AmiAmi、駿河屋（Suruga-ya）：AmiAmi 需 Playwright stealth；Suruga-ya 封鎖所有 HTTP 請求（403），維護成本高，列為未來考量
- 不修改通知邏輯（Discord / Email）
- 不調整去重機制（SeenItem 唯一鍵不變）
- 不為 Mandarake 做日圓→台幣匯率換算（直接儲存日圓原價）

## Capabilities

### New Capabilities

- `pchome-scraper`: PChome 24h 商品爬取，使用官方 JSON API（`ecshweb.pchome.com.tw/search/v3.3/all/results`），回傳 `WatcherItem` 列表
- `momo-scraper`: MOMO購物商品爬取，HTTP GET 解析 Next.js RSC payload（`goodsInfoList`），`verify=False` 繞過 SSL 憑證問題
- `animate-scraper`: Animate Taiwan 動漫周邊爬取，HTTP GET 解析 ASP.NET SSR HTML
- `yahoo-auction-scraper`: Yahoo拍賣商品爬取，HTTP GET 解析 isoredux-data Redux state JSON，`sort=ontime`
- `mandarake-scraper`: Mandarake 日本中古動漫爬取，HTTP GET + cookie 解析 SSR HTML
- `myacg-scraper`: 買動漫（MyACG）動漫周邊與同人誌爬取，HTTP GET AJAX endpoint，支援 R18 商品（`ct18=1`）
- `kingstone-scraper`: 金石堂 ACG 動漫書籍與周邊爬取，HTTP GET 解析 SSR HTML，`verify=False`
- `booth-scraper`: BOOTH 同人誌與創作商品爬取，HTTP GET SSR HTML，`adult=t` 解除年齡限制，解析 `li.item-card[data-product-*]` data 屬性
- `dlsite-scraper`: DLsite 數位同人誌與成人作品爬取，AJAX JSON endpoint（`/maniax/fsr/ajax`），`age_category[0]=18` 包含 R18；搜尋為全文搜尋，建議使用日語關鍵字
- `toranoana-scraper`: Toranoana 同人誌與動漫商品爬取，HTTP GET SSR HTML，`sort=newitem`
- `melonbooks-scraper`: Melonbooks 同人誌與動漫商品爬取，HTTP GET SSR HTML，`AUTH_ADULT=1` cookie 解除年齡限制

### Modified Capabilities

- `watcher-scheduler`: 新增十一個平台的 scraper 整合分支（含 BOOTH、DLsite、Toranoana、Melonbooks）；移除 shopee 分支與 session-cookie 邏輯
- `keyword-search`: 平台選項從 `[shopee, ruten]` 改為 `[ruten, pchome, momo, animate, yahoo-auction, mandarake, myacg, kingstone, booth, dlsite, toranoana, melonbooks]`

## Impact

- Affected specs: `pchome-scraper`（新）、`momo-scraper`（新）、`animate-scraper`（新）、`yahoo-auction-scraper`（新）、`mandarake-scraper`（新）、`myacg-scraper`（新）、`kingstone-scraper`（新）、`booth-scraper`（新）、`dlsite-scraper`（新）、`toranoana-scraper`（新）、`melonbooks-scraper`（新）、`watcher-scheduler`（delta）、`keyword-search`（delta）
- Affected code:
  - `src/scrapers/pchome.py`（新增）
  - `src/scrapers/momo.py`（新增）
  - `src/scrapers/animate.py`（新增）
  - `src/scrapers/yahoo_auction.py`（新增）
  - `src/scrapers/mandarake.py`（新增）
  - `src/scrapers/myacg.py`（新增）
  - `src/scrapers/kingstone.py`（新增）
  - `src/scrapers/booth.py`（新增）
  - `src/scrapers/dlsite.py`（新增）
  - `src/scrapers/toranoana.py`（新增）
  - `src/scrapers/melonbooks.py`（新增）
  - `src/scheduler.py`（修改：新增平台分支、移除 shopee）
  - `webapp/constants/platform.ts`（修改：新增平台標籤）
  - `webapp/components/KeywordForm.tsx`（修改：平台選單）
  - `webapp/components/KeywordList.tsx`（修改：平台選單）
