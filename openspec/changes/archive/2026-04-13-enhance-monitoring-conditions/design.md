## Context

目前 `Keyword` model 只支援商品名稱層級的過濾（`blocklist`、`mustInclude`），通知一律送至用戶唯一的全域 Discord webhook，且 `SeenItem` 不儲存商品名稱或連結，導致歷史紀錄頁面幾乎無法使用。平台擴充至 12 個後，監控對象從「搜尋特定商品」演進為「IP / 作品跨平台追蹤」，賣家過濾與通知分類管理變得不可或缺。

## Goals / Non-Goals

**Goals:**

- 新增賣家/社團黑名單（全域 + per-keyword）並在 Worker 通知前過濾
- 新增 per-keyword Discord Webhook 路由（null 時 fallback 全域）
- 新增 per-keyword 每次掃描通知上限（`maxNotifyPerScan`）
- 新增 CircleFollow model 支援社團/創作者直接追蹤
- SeenItem 補存商品名稱與連結；歷史頁面新增篩選與分頁

**Non-Goals:**

- 不實作跨平台比價（同一商品在不同平台的價格對照）
- 不實作拍賣截標時間顯示（Yahoo拍賣 / Ruten），列為未來考量
- 不實作 Email per-keyword 分流（Email 維持全域一個收件地址）
- 不實作商品狀態過濾（全新 / 二手），用戶需兩種都看
- CircleFollow 僅支援 BOOTH 與 DLsite（其他平台無公開社團頁面 API）

## Decisions

### Keyword model 新增三個選填欄位

`sellerBlocklist: String[] @default([])`、`discordWebhookUrl: String?`、`maxNotifyPerScan: Int?` 直接加到現有 `Keyword` model。不建立獨立 KeywordConfig table，避免 JOIN 增加查詢複雜度。

**Alternatives considered**: 建立 `KeywordNotificationConfig` table → over-engineering，欄位數量少且一對一關係不需要獨立表。

### 全域賣家黑名單放在 NotificationSetting

`globalSellerBlocklist: String[] @default([])` 加到現有 `NotificationSetting` model。不放在 `User` model，維持通知相關設定集中管理的慣例。

**Alternatives considered**: 建立獨立 `GlobalBlocklist` model → 不必要，未來不需要多筆 global blocklist。

### 賣家過濾在 API 端（notify/batch）執行，非 Worker 端

Worker 只負責爬取與送出，`POST /api/worker/notify/batch` 在儲存 SeenItem 與觸發 Discord 通知之前，套用 `globalSellerBlocklist` 與 keyword 的 `sellerBlocklist`。

**Rationale**: 過濾規則存在資料庫，API 端已有完整資料，Worker 無需額外查詢。Worker 端過濾需要把完整黑名單下傳，增加傳輸量。

**Alternatives considered**: Worker 端過濾 → 需要 API 回傳完整 sellerBlocklist，增加 get_keywords payload 大小，且 Worker 不需要知道通知路由細節。

### per-keyword webhook 路由在 discord.ts 函式層

`lib/discord.ts` 的 `sendDiscordNotification` 接受 optional `webhookUrl` 參數，呼叫端（notify/batch route）根據 keyword 的 `discordWebhookUrl` 或 user 的全域 webhook 決定傳入哪個 URL。

**Alternatives considered**: 在 notify/batch route 直接決定 URL → 可行，但 discord.ts 應封裝所有 webhook 邏輯。

### maxNotifyPerScan 限制在 notify/batch route 執行

每次 batch 請求帶有 `keywordId`，route 查詢該 keyword 的 `maxNotifyPerScan`，若本次傳入的商品數量超過上限，截斷後只通知前 N 筆（依原始順序，即 scraper 回傳的新品優先順序）。

**Alternatives considered**: Worker 端截斷 → Worker 不需要知道每個 keyword 的上限，讓 API 端集中管理更一致。

### SeenItem 新增 itemName 與 itemUrl

`itemName: String?` 與 `itemUrl: String?` 直接加到 SeenItem，`notify/batch` 路由從 WatcherItem payload 取得並儲存。這是 append-only，對現有資料不影響（null 值向下相容）。

### CircleFollow 獨立 model，Worker 獨立掃描邏輯

```
model CircleFollow {
  id         String   @id @default(cuid())
  userId     String
  platform   String   // "booth" | "dlsite"
  circleId   String   // 平台上的店家/社團 ID
  circleName String
  webhookUrl String?
  active     Boolean  @default(true)
  createdAt  DateTime @default(now())
  user       User     @relation(...)
  @@unique([userId, platform, circleId])
}
```

Worker 在 `run_scan_cycle` 中額外呼叫 `api.get_circle_follows()` 並執行社團新作頁面掃描。社團追蹤的去重仍使用現有 `SeenItem(userId, platform, itemId)` 唯一鍵，`keyword` 欄位存社團名稱（`circle:{circleName}`）作為區分。

### 歷史紀錄分頁：cursor-based pagination

歷史頁面改用 cursor（`lastId` query param）而非 offset pagination，避免大量 SeenItem 時 offset 效能問題。每頁回傳 50 筆，前端顯示「載入更多」按鈕。

## Risks / Trade-offs

- **SeenItem 歷史資料無 itemName / itemUrl**：既有記錄的兩個欄位為 null，歷史頁面顯示時需有 fallback（顯示 itemId 或「—」）→ 視覺上可接受，用戶理解新功能上線前的資料較少
- **CircleFollow 初始版本僅支援 BOOTH / DLsite**：Toranoana / Melonbooks 的社團頁面結構需另行研究，留待後續 → 在 UI 中明確標示支援平台即可
- **全域 sellerBlocklist 增加 notify/batch 查詢複雜度**：每次 batch 需 join NotificationSetting → 影響微小，可接受；或快取在 Worker 記憶體中每輪掃描取一次
- **maxNotifyPerScan 截斷可能遺漏商品**：超過上限的商品不會觸發 SeenItem 記錄，下次掃描會再出現 → 設計上可接受，用戶可調高上限或接受分散通知

## Migration Plan

1. 執行 Prisma migration（新增欄位，全部 nullable / default，無 breaking change）
2. 部署 Next.js（API route 與頁面更新）
3. 部署 Worker（WatcherItem 新欄位、CircleFollow 掃描邏輯）
4. 既有 Keyword 的 `sellerBlocklist` 預設為空陣列，行為不變
5. 既有 SeenItem 的 `itemName` / `itemUrl` 為 null，歷史頁面顯示 fallback
