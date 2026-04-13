## 1. 資料庫 Schema 變更

- [x] 1.1 更新 `webapp/prisma/schema.prisma`：Keyword model 新增三個選填欄位 `sellerBlocklist String[] @default([])`, `discordWebhookUrl String?`, `maxNotifyPerScan Int?`；同時實作 Keyword creation accepts sellerBlocklist, discordWebhookUrl, and maxNotifyPerScan 的資料層支援
- [x] 1.2 更新 `webapp/prisma/schema.prisma`：全域賣家黑名單放在 NotificationSetting，新增 `globalSellerBlocklist String[] @default([])`；實作 User can manage global seller blocklist in notification settings 與 Global seller blocklist filters items across all keywords 的資料層支援
- [x] 1.3 更新 `webapp/prisma/schema.prisma`：SeenItem 新增 itemName 與 itemUrl（`itemName String?`、`itemUrl String?`）；實作 SeenItem stores itemName and itemUrl from batch payload；User can view notification history 歷史頁面商品名稱連結的資料層支援
- [x] 1.4 更新 `webapp/prisma/schema.prisma`：CircleFollow 獨立 model，Worker 獨立掃描邏輯的資料層支援，新增 CircleFollow model（id、userId、platform、circleId、circleName、webhookUrl、active、createdAt、@@unique([userId, platform, circleId])）；User can follow a BOOTH shop or DLsite circle for new work alerts 的資料層支援
- [x] 1.5 執行 `cd webapp && npx prisma migrate dev --name enhance_monitoring_conditions` 產生 migration SQL 並驗證 schema 無誤

## 2. 後端 API — Keyword 新欄位

- [x] 2.1 更新 `webapp/app/api/keywords/route.ts`（POST handler）：解析並驗證 `sellerBlocklist`（array）、`discordWebhookUrl`（需以 `https://discord.com/api/webhooks/` 開頭或 null）、`maxNotifyPerScan`（正整數或 null）；無效值回傳 HTTP 400；實作 Keyword creation accepts sellerBlocklist, discordWebhookUrl, and maxNotifyPerScan 與 Keyword edit accepts sellerBlocklist, discordWebhookUrl, and maxNotifyPerScan
- [x] 2.2 更新 `webapp/app/api/keywords/[id]/route.ts`（PATCH handler）：接受並驗證三個新欄位，驗證規則同 POST；正確更新資料庫
- [x] 2.3 更新 `webapp/app/api/worker/keywords/route.ts`：在回應 payload 中加入 `sellerBlocklist`、`discordWebhookUrl`、`maxNotifyPerScan`；實作 Worker keywords API includes new fields in response 與 GET /api/worker/keywords includes discordWebhookUrl
- [x] 2.4 更新 `webapp/types/keyword.ts`：TypeScript Keyword type 新增三個欄位的型別定義

## 3. 後端 API — 設定頁面新欄位

- [x] 3.1 更新 `webapp/app/api/settings/route.ts`（GET handler）：回應中加入 `globalSellerBlocklist`；實作 GET /api/settings includes globalSellerBlocklist
- [x] 3.2 更新 `webapp/app/api/settings/route.ts`（PATCH handler）：解析並儲存 `globalSellerBlocklist`；接受空陣列作為清除操作；實作 Settings API accepts globalSellerBlocklist

## 4. 後端 API — 社團追蹤 CRUD

- [x] 4.1 建立 `webapp/app/api/circles/route.ts`：POST（建立 CircleFollow，驗證 platform 僅允許 "booth" / "dlsite"，重複時回傳 HTTP 409）、GET（回傳目前用戶的所有 CircleFollow）；實作 User can follow a BOOTH shop or DLsite circle for new work alerts 與 Duplicate CircleFollow is rejected 與 CircleFollow is isolated per user
- [x] 4.2 建立 `webapp/app/api/circles/[id]/route.ts`：PATCH（更新 active 與 webhookUrl 欄位，驗證 webhookUrl 格式）、DELETE（刪除 CircleFollow，保留 SeenItem）；實作 User can toggle CircleFollow active status 與 User can delete a CircleFollow
- [x] 4.3 建立 `webapp/app/api/worker/circles/route.ts`：回傳所有 active 的 CircleFollow 含 userId、platform、circleId、circleName、webhookUrl；需 WORKER_SECRET Bearer 驗證；Worker scans CircleFollow new-arrival pages each cycle 的 API 端支援

## 5. 後端 API — notify/batch 強化

- [x] 5.1 更新 `webapp/app/api/worker/notify/batch/route.ts`：接受 payload 新欄位 `keywordWebhookUrl`、`maxNotifyPerScan`、`globalSellerBlocklist`（從 NotificationSetting 查詢或由 Worker 傳入）；實作 Keyword notification routes to per-keyword Discord webhook when set 與 notify/batch routes Discord notification to per-keyword webhook
- [x] 5.2 更新 `webapp/app/api/worker/notify/batch/route.ts`：賣家過濾在 API 端（notify/batch）執行，非 Worker 端；在 deduplication 後、SeenItem 插入前，依序套用 notify/batch applies seller blocklist before notifying、Global seller blocklist filters items across all keywords 與 Per-keyword seller blocklist filters items for that keyword only；case-insensitive substring 比對 seller_name 與 seller_id；Global seller blocklist drops item before per-keyword check 與 Per-keyword seller blocklist drops item not caught by global
- [x] 5.3 更新 `webapp/app/api/worker/notify/batch/route.ts`：maxNotifyPerScan 限制在 notify/batch route 執行，seller 過濾後截斷至 `maxNotifyPerScan`（null 時用 `MAX_NOTIFY_PER_BATCH`）；實作 Per-keyword scan notification cap prevents notification floods、notify/batch enforces maxNotifyPerScan cap per keyword 與 New items after filtering are capped at maxNotifyPerScan
- [x] 5.4 更新 `webapp/app/api/worker/notify/batch/route.ts`：從 payload 的 `name` 與 `url` 欄位儲存至 `SeenItem.itemName`（截斷 255 字元）與 `SeenItem.itemUrl`；實作 SeenItem stores itemName and itemUrl from batch payload
- [x] 5.5 更新 `webapp/lib/discord.ts`：per-keyword webhook 路由在 discord.ts 函式層，`sendDiscordBatchNotification` 函式接受 optional `webhookUrl` 參數（string 或 null），null 時使用 `NotificationSetting.discordWebhookUrl`；實作 notify/batch routes Discord notification to per-keyword webhook

## 6. Worker Python 端強化

- [x] 6.1 更新 `src/watchers/base.py`：WatcherItem dataclass 新增 `seller_id: str | None = None` 與 `seller_name: str | None = None` 欄位
- [x] 6.2 更新 `src/scrapers/ruten.py` 與 `src/scrapers/yahoo_auction.py`：在 WatcherItem 中填入 `seller_id` 與 `seller_name`（從現有 HTML 解析賣家資訊）
- [x] 6.3 更新 `src/scrapers/booth.py`：填入 `seller_name`（BOOTH 店家名稱，從 `data-shop-name` 或頁面元素解析）
- [x] 6.4 更新 `src/scrapers/dlsite.py`、`src/scrapers/toranoana.py`、`src/scrapers/melonbooks.py`：填入 `seller_name`（社團/サークル名稱）
- [x] 6.5 更新 `src/api_client.py`：`get_keywords()` 回應解析新增 `seller_blocklist`、`discord_webhook_url`、`max_notify_per_scan` 欄位；新增 `get_circle_follows()` 方法（GET /api/worker/circles）；Worker scans CircleFollow new-arrival pages each cycle 的 Worker 端支援
- [x] 6.6 更新 `src/scheduler.py`：`run_scan_cycle` 新增 CircleFollow 掃描循環，呼叫 `api.get_circle_follows()` 後對每個 follow 執行對應平台的社團頁面爬取；BOOTH shop new-arrival page is scraped for followed circle 與 DLsite circle new-arrival page is scraped for followed circle
- [x] 6.7 更新 `src/scheduler.py`：`run_scan_cycle` 中 `api.notify_batch()` 呼叫加入 `keyword_webhook_url`（來自 keyword.discord_webhook_url）與 `max_notify_per_scan`（來自 keyword.max_notify_per_scan）欄位

## 7. 前端 — 關鍵字表單新欄位

- [x] 7.1 更新 `webapp/components/KeywordForm.tsx`：新增 Discord Webhook URL 輸入欄位（選填，格式驗證提示）、每次掃描通知上限數字輸入（選填，正整數）；前端顯示對應說明文字
- [x] 7.2 更新 `webapp/components/KeywordForm.tsx`：新增賣家/社團黑名單 tag 輸入 UI（同現有 blocklist 樣式，使用紅色系）；Enter 或按鈕新增，× 刪除
- [x] 7.3 更新 `webapp/components/KeywordList.tsx`：關鍵字卡片顯示已設定的 `discordWebhookUrl`（截斷顯示）、`maxNotifyPerScan`（如已設定）、`sellerBlocklist` tag 列表

## 8. 前端 — 設定頁面全域賣家黑名單

- [x] 8.1 更新 `webapp/app/settings/page.tsx`：新增「全域賣家/社團黑名單」區塊，使用 tag 輸入 UI（同 keyword 表單樣式）；從 GET /api/settings 預填現有值；User can manage global seller blocklist in notification settings 與 Global seller blocklist is pre-filled on settings page load

## 9. 前端 — 社團追蹤頁面

- [x] 9.1 建立 `webapp/app/circles/page.tsx`：顯示用戶的 CircleFollow 列表（平台、社團名稱、啟用狀態、指定 webhook）；空列表時顯示 EmptyState
- [x] 9.2 建立 `webapp/components/CircleFollowForm.tsx`：新增社團追蹤表單（平台下拉選單限 booth / dlsite、社團 ID 輸入、社團名稱輸入、選填 webhook URL）；POST /api/circles；Duplicate CircleFollow is rejected 的錯誤訊息顯示
- [x] 9.3 更新 `webapp/components/Navbar.tsx`：新增「社團追蹤」導覽連結至 `/circles`

## 10. 前端 — 歷史紀錄強化

- [x] 10.1 更新 `webapp/app/history/page.tsx`（或轉為 Client Component）：歷史頁面顯示 `itemName`（linked to `itemUrl`），itemName null 時 fallback 顯示 itemId；實作 History page lists notified items with item name and link 與 History row shows item ID fallback when itemName is null
- [x] 10.2 更新 `webapp/app/history/page.tsx`：新增關鍵字篩選下拉選單（從 GET /api/keywords 取得選項）與平台篩選下拉選單；實作 History supports filtering by keyword 與 History supports filtering by platform
- [x] 10.3 建立 `webapp/app/api/history/route.ts`（或更新現有）：歷史紀錄分頁：cursor-based pagination，支援 `?keywordId=`、`?platform=`、`?cursor=`（lastId）查詢參數；回傳 50 筆 + `nextCursor`；實作 History pagination loads next 50 items

## 11. 驗證測試

- [x] 11.1 驗證 Global seller blocklist 完整流程：設定 globalSellerBlocklist → Worker 送出含該賣家的 item → 確認無 SeenItem 記錄、無 Discord 通知；Global seller blocklist drops item before per-keyword check
- [x] 11.2 驗證 per-keyword sellerBlocklist 流程：keyword A 加入賣家黑名單 → keyword B 無黑名單 → 同賣家 item 對 A 被過濾、對 B 正常通知；Per-keyword seller blocklist drops item not caught by global
- [x] 11.3 驗證 per-keyword Discord webhook 路由：keyword 設定 webhookUrl → 觸發掃描 → 確認通知送至 keyword webhook，不送至全域 webhook；Notification uses keyword-level webhook when set
- [x] 11.4 驗證 maxNotifyPerScan 截斷：keyword 設定 maxNotifyPerScan=2 → 模擬 5 個新 item → 確認 SeenItem 只新增 2 筆、Discord 通知只有 2 則；Batch exceeds per-keyword maxNotifyPerScan cap
- [x] 11.5 驗證 CircleFollow BOOTH 掃描：新增 BOOTH 社團追蹤 → 執行 run_scan_cycle → 確認社團新作出現在 SeenItem 和 Discord 通知中；BOOTH shop new-arrival page is scraped for followed circle
- [x] 11.6 驗證 CircleFollow DLsite 掃描：新增 DLsite 社團追蹤 → 執行 run_scan_cycle → 確認社團新作正確抓取；DLsite circle new-arrival page is scraped for followed circle
- [x] 11.7 驗證歷史紀錄頁面：新通知後至 /history 確認顯示商品名稱連結、可按關鍵字/平台篩選、載入更多正常運作；History page lists notified items with item name and link 與 History supports filtering by keyword 與 History pagination loads next 50 items
- [x] 11.8 驗證 SeenItem itemName/itemUrl 儲存：掃描後查詢 DB 確認 SeenItem 的 itemName 與 itemUrl 欄位有值（非 null）；SeenItem stores itemName and itemUrl from batch payload
- [x] 11.9 執行 `npm run build` 確認前端無 TypeScript 編譯錯誤
- [x] 11.10 驗證全域賣家黑名單設定頁面 UI：前往 /settings → 新增賣家 tag → 儲存 → 重整頁面後 tag 仍顯示；User can manage global seller blocklist in notification settings
