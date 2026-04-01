## Why

目前通知內容缺少賣家名稱，用戶無法在 Discord / Email 中直接判斷賣家；且無法過濾不想要的商品名稱；另外目前每個商品各別呼叫一次 API（N 個商品 = N 次請求），造成流量浪費，改為批次送出可大幅降低 API 請求數。

## What Changes

- **新增賣家名稱**：Shopee 與 Ruten 爬蟲抓取賣家名稱（`seller_name`），隨通知一起傳遞，顯示於 Discord 與 Email 中
- **新增關鍵字禁詞功能**：每個關鍵字可設定禁詞列表（`blocklist: String[]`），Worker 在回報前過濾掉名稱含任一禁詞的商品；Dashboard 提供禁詞輸入介面
- **資料庫 migration**：`Keyword` model 新增 `blocklist String[]` 欄位（預設空陣列）
- **批次通知（Batch Notify）**：Worker 將一個關鍵字掃描到的所有商品整批送到 `POST /api/worker/notify/batch`（一次請求），取代原本每個商品各別送一次的方式；Server 端在一次請求中完成去重、Discord 批次 Embed、Email 彙整列表

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `discord-notify`：Discord Embed 新增「賣家」欄位顯示 `seller_name`
- `email-notify`：Email HTML 表格新增賣家名稱列
- `keyword-management`：關鍵字新增 / 編輯支援 `blocklist` 欄位（禁詞列表）
- `keyword-search`：Worker 在回報商品前，以 `blocklist` 過濾商品名稱
- `worker-api`：`GET /api/worker/keywords` 回傳 `blocklist`；新增 `POST /api/worker/notify/batch` 批次端點，取代原有 `POST /api/worker/notify`

## Impact

- Affected specs: `discord-notify`、`email-notify`、`keyword-management`、`keyword-search`、`worker-api`
- Affected code:
  - `src/scrapers/shopee.py` — 新增 seller_name 抓取邏輯
  - `src/scrapers/ruten.py` — 新增 seller_name 抓取邏輯
  - `src/watchers/base.py` — `WatcherItem` dataclass 新增 `seller_name` 欄位
  - `src/api_client.py` — 新增 `notify_batch()` 方法，取代 `notify_item()`
  - `src/scheduler.py` — 收集完所有商品後整批呼叫 `notify_batch()`；過濾 blocklist
  - `webapp/app/api/worker/keywords/route.ts` — 回傳 `blocklist`
  - `webapp/app/api/worker/notify/batch/route.ts` — 新批次端點（接收商品陣列、去重、批次通知）
  - `webapp/lib/discord.ts` — 新增批次 Embed 發送（最多 10 個 embeds/訊息）
  - `webapp/lib/email.ts` — 新增批次彙整 Email（一封列出所有新商品）
  - `webapp/prisma/schema.prisma` — `Keyword` 新增 `blocklist String[]`
  - `webapp/prisma/migrations/` — 新增 migration
  - `webapp/components/KeywordForm.tsx` — 新增禁詞輸入 UI
