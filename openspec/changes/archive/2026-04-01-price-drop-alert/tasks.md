## 1. 資料模型（SeenItem 新增 lastPrice Float? 欄位，每次批次通知時更新）

- [x] 1.1 在 webapp/prisma/schema.prisma 的 SeenItem model 新增 lastPrice Float?；執行 npx prisma migrate dev --name add_seen_item_last_price（SeenItem table records notified items with user, platform, and item_id as unique key）

## 2. 批次通知端點降價判斷（降價通知使用獨立的 Discord Embed 顏色（綠色 0x57F287）與標題前綴 [降價]）

- [x] 2.1 在 webapp/app/api/worker/notify/batch/route.ts 的 SeenItem upsert 邏輯中：對每個 item 先 findUnique；若不存在則建立新 SeenItem（lastPrice = item.price）；若存在且 newPrice < existingLastPrice（均非 null），標記 isPriceDrop=true 並更新 lastPrice；將 isPriceDrop=true 的 item 加入通知陣列帶 originalPrice 欄位（Price drop on a known item triggers a re-notification）
- [x] 2.2 在 webapp/app/api/worker/notify/batch/route.ts 中，對已存在 SeenItem 且 price=null 或 price >= lastPrice 的 item，標記為 duplicate 不通知（Item with null price does not trigger price drop）
- [x] 2.3 在 webapp/lib/discord.ts 的 sendDiscordBatchNotification() 中，支援 item 攜帶 isPriceDrop 與 originalPrice：降價商品 embed color 為 0x57F287，title 前綴 "[降價]"，fields 新增「原價」與「現價」欄位（Price drop detected triggers notification）
- [x] 2.4 在 webapp/lib/email.ts 的 sendEmailBatchNotification() 中，降價商品列新增「↓ 降價」標示及原價欄位（Price drop detected triggers notification）

## 3. worker-api 端點回應更新（Already-seen item with price drop triggers re-notification）

- [x] 3.1 在 webapp/app/api/worker/notify/batch/route.ts 的回應中，降價商品回傳 { "status": "price_drop", "notified": true }，與新商品 { "status": "new" } 及重複商品 { "status": "duplicate" } 做區分（Already-seen item with price drop triggers re-notification）
- [x] 3.2 確認 POST /api/worker/notify receives a scraped item and triggers deduplication and notifications：驗證端點整體流程正確整合新商品建立（含 lastPrice）、降價判斷、duplicate 跳過三種路徑（POST /api/worker/notify receives a scraped item and triggers deduplication and notifications）
- [x] 3.3 確認 price 為 null 的商品不觸發降價通知：在批次端點的降價判斷邏輯中加入 null 守衛，確保 price = null 時跳過比較直接以 duplicate 處理（price 為 null 的商品不觸發降價通知）
