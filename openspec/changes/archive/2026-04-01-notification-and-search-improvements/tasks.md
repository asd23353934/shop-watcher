## 1. 資料模型與 Migration（Keyword blocklist 欄位）

- [x] 1.1 在 `webapp/prisma/schema.prisma` 的 `Keyword` model 中新增 `blocklist String[] @default([])`（Keyword supports a blocklist of forbidden terms）
- [x] 1.2 執行 `npx prisma migrate dev --name add_keyword_blocklist` 產生 migration SQL 並提交至版本控制（禁詞過濾在 Worker 端執行，不在 API 端）

## 2. WatcherItem 與 scraper 新增賣家名稱

- [x] 2.1 將 `src/watchers/base.py` 的 `WatcherItem` dataclass 欄位 `seller` 重新命名為 `seller_name`（WatcherItem 的 seller 欄位統一改名為 seller_name）
- [x] 2.2 在 `src/scrapers/shopee.py` 的 `scrape_shopee()` 中，對每個商品 `<a>` 元素查詢 `[class*="shop"]` 或 `[class*="seller"]` 元素取賣家名稱；若無則嘗試從 `<a href*="-s.{shopId}">` 相鄰元素取名稱；填入 `WatcherItem.seller_name`，抓不到時填 `None`（Shopee 賣家名稱從賣家 ID 連結或 shop 元素抓取）
- [x] 2.3 在 `src/scrapers/ruten.py` 的 `scrape_ruten()` 中，取 `inner_text()` 分行結果的第二行作為賣家名稱，若無則填 `None`；填入 `WatcherItem.seller_name`（Ruten 賣家名稱從商品卡片文字第二行抓取）

## 3. Worker 批次送出與禁詞過濾

- [x] 3.1 依照「批次通知：新增 POST /api/worker/notify/batch 端點，Worker 整批送出」設計決策：在 `src/api_client.py` 中新增 `notify_batch(keyword_id: str, items: list[WatcherItem]) -> dict` 方法，以單次 POST 送出商品陣列到 `/api/worker/notify/batch`；payload 格式：`{ "keyword_id": ..., "items": [{ "platform", "item_id", "name", "price", "url", "image_url", "seller_name" }, ...] }`（POST /api/worker/notify/batch accepts a batch of items and sends grouped notifications）
- [x] 3.2 在 `src/api_client.py` 中保留 `notify_item()` 方法但標記為棄用（或直接移除），更新 `src/scheduler.py` 的 `run_scan_cycle()`：不再逐一呼叫 `notify_item()`，改為先收集整個 keyword × platform 的所有過濾後商品，再一次呼叫 `notify_batch()`
- [x] 3.3 依照「禁詞過濾在 Worker 端（Python）執行，不在 API 端」設計決策：在 `src/scheduler.py` 的 `run_scan_cycle()` 中，於呼叫 `notify_batch()` 前，取 `kw.get("blocklist", [])` 的小寫版本，過濾掉 `item.name.lower()` 包含任一禁詞的商品（Scraped items are filtered by keyword blocklist before notification）

## 4. Next.js API — 批次端點與 keywords 更新

- [x] 4.1 在 `webapp/app/api/worker/keywords/route.ts` 的 GET handler 回傳的每個 keyword 物件中新增 `blocklist` 欄位（GET /api/worker/keywords returns all active keywords with user notification settings）
- [x] 4.2 建立 `webapp/app/api/worker/notify/batch/route.ts`：POST handler 接收 `{ keyword_id: string, items: Item[] }`；對每個 item 執行 `prisma.seenItem.upsert` 偵測新舊（`skipDuplicates` 或 `createMany`）；收集新商品陣列；若有新商品則呼叫 `sendDiscordBatchNotification()` 與 `sendEmailBatchNotification()`；回傳 `{ new: N, duplicate: M }`（POST /api/worker/notify/batch accepts a batch of items and sends grouped notifications）

## 5. Discord 與 Email 批次通知函式

- [x] 5.1 依照「Discord 批次：一次 Webhook 呼叫最多送 10 個 Embed，超過 10 個時分批」設計決策：在 `webapp/lib/discord.ts` 新增 `sendDiscordBatchNotification(webhookUrl, discordUserId, items, keyword)` 函式：將 items 依 10 個一組分批（`chunk(items, 10)`），每批呼叫一次 Webhook POST，payload 為 `{ content, embeds: chunk.map(toEmbed) }`；每個 embed 含 title(連結)、color(平台顏色)、thumbnail(image_url)、fields(平台/價格/關鍵字/賣家)（New item triggers a Discord Embed notification via the user's Webhook URL、More than 10 new items are chunked into multiple Webhook calls、Seller name is unknown）
- [x] 5.2 依照「Email 批次：所有新商品彙整為一封 Email」設計決策：在 `webapp/lib/email.ts` 新增 `sendEmailBatchNotification(emailAddress, items, keyword)` 函式：主旨為 `[Shop Watcher] 關鍵字「{keyword}」發現 {N} 個新商品`；HTML body 為一個表格，每列對應一個商品，欄位包含商品圖片（thumbnail）、名稱（連結）、平台、價格、賣家（`seller_name ?? '未知'`）（New item triggers an Email notification via Resend、Batch email lists all new items with seller name）

## 6. Dashboard 禁詞 UI

- [x] 6.1 依照「Keyword 的 blocklist 欄位為 String[]，前端以逗號分隔輸入」設計決策：在 `webapp/components/KeywordForm.tsx` 新增禁詞輸入欄位（`<input type="text" placeholder="廣告,整組,代工">`）；POST payload 中新增 `blocklist`（逗號分隔字串 split 後 trim 空白，移除空字串）（Keyword is created with a blocklist、Keyword is created without a blocklist）
- [x] 6.2 在 `webapp/app/api/keywords/route.ts` 的 POST handler 中，解析 `blocklist` 欄位（預設 `[]`）並存入 Prisma；在 `webapp/app/api/keywords/[id]/route.ts` 的 PATCH handler 中，允許更新 `blocklist`（Keyword blocklist is updated）
