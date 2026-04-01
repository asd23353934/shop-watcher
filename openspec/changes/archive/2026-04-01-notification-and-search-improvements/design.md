## Context

**現況爬蟲行為**：
- 蝦皮：URL 格式 `/{slug}-i.{shopId}.{itemId}`，從 URL slug 解析商品名稱（不夠精確），抓前 25 筆，已按 `sortBy=ctime&order=desc` 排序最新
- 露天：從卡片 `inner_text()` 抓取商品名稱，抓前 30 筆，已按 `sort=new` 排序最新
- `WatcherItem` dataclass 已有 `seller: Optional[str] = None` 欄位，但兩個 scraper 都沒有填入
- `api_client.py` 的 `notify_item()` payload 沒有傳遞 `seller`
- `POST /api/worker/notify` 不接收也不儲存賣家名稱

**去重機制**：SeenItem 表以 `(userId, platform, itemId)` 為 unique key，已通知的商品不重複通知。排序最新確保先看到新商品。

**通知發送方式**：每個商品各別呼叫一次 `notify_item()`，在 server 端各別送 Discord Embed / Email，不批次。

**目前無禁詞機制**：`Keyword` model 沒有 `blocklist` 欄位，Worker 拿到所有符合關鍵字的商品都會嘗試通知。

## Goals / Non-Goals

**Goals:**
- Shopee 與 Ruten scraper 填入 `seller_name`（賣家名稱）
- 批次通知：Worker 收集完一個關鍵字的所有商品後，整批送到新的 `POST /api/worker/notify/batch` 端點（一次請求取代 N 次）
- Discord：一次 Webhook 呼叫送出最多 10 個 Embed（超過 10 個時分多次送，但仍為批次）
- Email：一封彙整 Email 列出所有新商品
- `Keyword` 新增 `blocklist: String[]`，Worker 過濾後才回報商品
- Dashboard `KeywordForm` 新增禁詞輸入介面

**Non-Goals:**
- 不改變排序邏輯（已是最新優先）
- 不實作全域黑名單（禁詞為每個關鍵字獨立設定）
- 不儲存 `seller_name` 到資料庫（只在通知時傳遞，不持久化）
- 不保留舊的 `POST /api/worker/notify`（單商品端點）— 被 batch 端點取代

## Decisions

### WatcherItem 的 seller 欄位統一改名為 seller_name

**決策**：將 `WatcherItem.seller` 重新命名為 `seller_name`，並在 `notify_item()` payload 中以 `seller_name` 傳遞。

**理由**：API payload 現有欄位均使用 `snake_case` 複合詞（`image_url`、`item_id`），`seller_name` 比 `seller` 更明確，且與前端 TypeScript 端命名一致。

**替代方案（棄用）**：保留 `seller` → 易與其他欄位命名風格不一致。

---

### Shopee 賣家名稱從賣家 ID 連結或 shop 元素抓取

**決策**：在蝦皮搜尋結果頁面，優先從包含 `-s.{shopId}` 格式 href 的 `<a>` 元素或 `[class*="shop"]`、`[class*="seller"]` 元素抓取賣家名稱。若無法抓取則回傳 `None`（不強制）。

**理由**：蝦皮搜尋結果頁面的賣家資訊可能在 JS 延遲渲染的元素中，無法保證每次都能抓到。將 `seller_name` 設為可選，避免因抓不到賣家而影響整體通知流程。

---

### Ruten 賣家名稱從商品卡片文字第二行抓取

**決策**：露天搜尋結果的 `<a>` 卡片 `inner_text()` 通常格式為「商品名稱\n賣家名稱\n價格」，取第二行作為賣家名稱，若無則回傳 `None`。

**理由**：露天卡片結構較固定，第一行為商品名稱（現有邏輯），第二行通常為賣家名稱。

---

### 禁詞過濾在 Worker 端（Python）執行，不在 API 端

**決策**：`run_scan_cycle` 在呼叫 `notify_item()` 前，對每個 item 檢查其 `name` 是否包含 `blocklist` 中的任一詞（不區分大小寫）。若包含則跳過，不呼叫 API。

**理由**：過濾在 Worker 端執行，減少不必要的 API 請求，也減少 SeenItem 資料量。API 端不需要實作過濾邏輯，職責分離。

**替代方案（棄用）**：在 API 端過濾 → 增加無效請求數量，且會將 SeenItem row 插入後才發現要過濾，邏輯複雜。

---

### Keyword 的 blocklist 欄位為 String[]，前端以逗號分隔輸入

**決策**：`Keyword` model 新增 `blocklist String[]`，預設 `[]`。前端 `KeywordForm` 新增一個文字輸入框，用戶以逗號分隔輸入禁詞（如 `廣告,整組,代工`）。送出前 split by `,` 並 trim 空白。

**理由**：與現有 `platforms String[]` 欄位設計一致；逗號分隔比多個輸入框更簡潔，適合禁詞數量少（一般 3-10 個）的場景。

### 批次通知：新增 POST /api/worker/notify/batch 端點，Worker 整批送出

**決策**：廢除 `notify_item()`（單商品）改為 `notify_batch(keyword_id, items)`（商品陣列）。Worker 在一個 keyword × platform 掃描完成、通過 blocklist 過濾後，把所有商品整批 POST 到 `/api/worker/notify/batch`。Server 端在一個 request 內完成所有 SeenItem upsert、過濾出新商品、觸發 Discord 批次 Embed 與彙整 Email。

**API payload**：
```json
{
  "keyword_id": "...",
  "items": [
    { "platform": "shopee", "item_id": "...", "name": "...", "price": 1000, "url": "...", "image_url": "...", "seller_name": "..." },
    ...
  ]
}
```

**理由**：N 個商品原需 N 次 HTTP 請求，改為 1 次請求減少流量與延遲；Server 端可在同一 transaction context 中批次處理 SeenItem，減少 DB round-trips。

**替代方案（棄用）**：保留 `notify_item()` 並平行發送 → 並行 HTTP 請求數量不可控，且 Discord Webhook 有 rate limit（30 req/min），容易被封鎖。

---

### Discord 批次：一次 Webhook 呼叫最多送 10 個 Embed，超過 10 個時分批

**決策**：Discord Webhook 支援單次 POST 最多 10 個 embeds。`sendDiscordBatchNotification()` 接收商品陣列，依 10 個一組分批（chunk）呼叫 Webhook。每批為一次 POST，各自含 `content`（mention）與 embeds 陣列。

**理由**：Discord 官方限制每則訊息最多 10 個 embeds。一次關鍵字掃描最多 25–30 筆，最壞情況為 3 次 Webhook 呼叫（遠少於原本的 30 次）。

---

### Email 批次：所有新商品彙整為一封 Email

**決策**：`sendEmailBatchNotification()` 接收商品陣列，以一封 HTML Email 列出所有新商品（每個商品一列表格行）。主旨為 `[Shop Watcher] 關鍵字「{keyword}」發現 {n} 個新商品`。

**理由**：多商品各別寄信會造成收件匣爆炸；彙整信更易閱讀，也避免 Resend 計費（按封計費）被放大。

---

## Risks / Trade-offs

- **賣家名稱爬取不穩定**：`seller_name` 為 Optional，抓不到時通知中顯示「未知」，不影響整體流程。
- **禁詞 case-sensitivity**：不區分大小寫，可能誤過濾（如「廣告」也過濾「廣告牌架」）。`[Risk]` → 用戶需注意禁詞精確度。
- **批次端點若部分商品失敗**：整批 request 中個別 SeenItem upsert 採 `skipDuplicates`，不影響其他商品。`[Risk]` → 若 Discord/Email 送出時中途失敗，已 upsert 的 SeenItem 不會重送通知（可接受）。
- **Discord rate limit（批次後）**：每個關鍵字最壞情況 3 次 Webhook 呼叫（30 商品 ÷ 10 = 3 批），遠低於每分鐘 30 次上限。
- **Migration**：`blocklist String[]` 預設 `[]`，向後相容。

## Migration Plan

1. 新增 Prisma migration：`Keyword` 新增 `blocklist String[] @default([])`
2. `vercel.json` build command 已包含 `prisma migrate deploy`，Vercel 部署時自動執行 migration
3. Rollback：若需回滾，將 `blocklist` 欄位從 schema 移除並執行新 migration 即可
