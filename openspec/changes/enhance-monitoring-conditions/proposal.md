## Why

用戶使用情境為「IP / 作品名稱跨平台監控」（周邊新品、絕版品、同人誌），目前系統缺乏對黃牛賣家的過濾、對不感興趣社團的排除、對不同 IP 的通知分流，以及對同人誌創作者的直接追蹤能力。歷史紀錄頁面也因缺少商品名稱與連結而幾乎無法使用。

## What Changes

- **新增 賣家/社團黑名單**：Keyword 層級新增 `sellerBlocklist: String[]`；User 層級新增 `globalSellerBlocklist: String[]`。Worker 掃描時過濾符合黑名單的商品，統一涵蓋 C2C 賣家（Ruten、Yahoo拍賣）與同人平台社團（BOOTH、DLsite、Toranoana、Melonbooks）
- **新增 per-keyword Discord Webhook**：Keyword 新增 `discordWebhookUrl: String?`，通知時優先使用此值，null 時 fallback 至用戶全域 webhook。讓用戶將不同 IP 的通知路由至不同 Discord 頻道
- **新增 每次掃描通知上限**：Keyword 新增 `maxNotifyPerScan: Int?`，限制單次掃描對同一關鍵字的最大通知筆數，防止熱門 IP 造成通知爆炸。null 時使用系統預設值（`MAX_NOTIFY_PER_BATCH`）
- **新增 社團/創作者追蹤**：新增 `CircleFollow` model，讓用戶直接訂閱 BOOTH 店家或 DLsite 社團的所有新作，不依賴關鍵字比對。Worker 另行掃描社團新作頁面並通知
- **強化 歷史紀錄**：`SeenItem` 補存 `itemName: String?` 與 `itemUrl: String?`；`/history` 頁面新增商品名稱連結欄位、按關鍵字/平台篩選、移除 50 筆硬限制改為分頁（每頁 50 筆）
- **強化 WatcherItem**：新增 `seller_id: str | None` 與 `seller_name: str | None` 欄位，讓各 scraper 可選填賣家/社團資訊

## Capabilities

### New Capabilities

- `seller-blocklist`: 賣家/社團黑名單過濾，含全域（user-level）與 per-keyword 兩層，Worker 端在通知前過濾
- `circle-follow`: 社團/創作者訂閱追蹤，不依賴關鍵字，直接監控 BOOTH 店家或 DLsite 社團的新作頁面
- `per-keyword-webhook`: 每個關鍵字可指定獨立 Discord Webhook URL，null 時 fallback 全域 webhook
- `notify-rate-limit`: 每次掃描 per-keyword 通知上限，防止單一關鍵字產生通知爆炸

### Modified Capabilities

- `keyword-management`: Keyword model 新增 `sellerBlocklist`、`discordWebhookUrl`、`maxNotifyPerScan` 欄位；API 與表單需支援新欄位
- `notification-history`: SeenItem 補存 `itemName` / `itemUrl`；歷史頁面新增商品連結、篩選器、分頁
- `notification-settings`: User / NotificationSetting 新增 `globalSellerBlocklist: String[]`
- `discord-notify`: 通知前套用 per-keyword webhook 路由與 `maxNotifyPerScan` 上限

## Impact

- Affected specs: `seller-blocklist`（新）、`circle-follow`（新）、`per-keyword-webhook`（新）、`notify-rate-limit`（新）、`keyword-management`（delta）、`notification-history`（delta）、`notification-settings`（delta）、`discord-notify`（delta）
- Affected code:
  - `webapp/prisma/schema.prisma`（Keyword、User/NotificationSetting、SeenItem、新增 CircleFollow）
  - `webapp/prisma/migrations/`（新增 migration）
  - `webapp/app/api/keywords/route.ts`（支援新欄位）
  - `webapp/app/api/keywords/[id]/route.ts`（支援新欄位）
  - `webapp/app/api/worker/notify/batch/route.ts`（seller 過濾、webhook 路由、rate limit）
  - `webapp/app/history/page.tsx`（商品名稱連結、篩選、分頁）
  - `webapp/components/KeywordForm.tsx`（新增欄位 UI）
  - `webapp/components/KeywordList.tsx`（顯示新欄位）
  - `webapp/app/settings/page.tsx`（全域賣家黑名單設定）
  - `webapp/app/api/settings/route.ts`（儲存 globalSellerBlocklist）
  - `webapp/app/api/circles/route.ts`（新增 CircleFollow CRUD）
  - `src/watchers/base.py`（WatcherItem 新增 seller_id、seller_name）
  - `src/scheduler.py`（CircleFollow 掃描邏輯）
  - `src/scrapers/ruten.py`（填入 seller 資訊）
  - `src/scrapers/yahoo_auction.py`（填入 seller 資訊）
  - `src/scrapers/booth.py`（填入 circle 資訊）
  - `src/scrapers/dlsite.py`（填入 circle 資訊）
  - `src/scrapers/toranoana.py`（填入 circle 資訊）
  - `src/scrapers/melonbooks.py`（填入 circle 資訊）
  - `src/api_client.py`（get_keywords 回傳新欄位；新增 get_circle_follows）
