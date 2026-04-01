## Context

現有 `SeenItem` 以 `(userId, platform, itemId)` 為 unique key，僅記錄 `firstSeen`，不記錄價格。`notify/batch` 端點對已存在的 SeenItem 直接標記為 duplicate 並跳過通知，因此即使商品降價也不會再次通知。用戶因此無法得知已追蹤商品的價格變化。

## Goals / Non-Goals

**Goals:**

- SeenItem 新增 `lastPrice Float?` 欄位，記錄每次通知時的最後已知價格
- 在 `notify/batch` 端點中，若 itemId 已存在且新 price < lastPrice（均非 null），則標記為 price_drop，加入通知佇列並更新 lastPrice
- Discord 降價通知使用綠色（0x57F287）Embed 與 `[降價]` 標題前綴，fields 顯示原價與現價
- Email 降價通知在商品列中附加「↓ 降價」標示與原價

**Non-Goals:**

- 不實作最低降幅門檻（PRICE_DROP_MIN_PERCENT），本次任何降價均觸發通知
- 不追蹤價格歷史走勢，只比較 lastPrice 與當前價格
- 不對 `price = null` 的商品進行降價判斷

## Decisions

### SeenItem 新增 lastPrice Float? 欄位，每次批次通知時更新

在 `notify/batch` 端點的 upsert 邏輯中：
1. 對每個 item 先執行 `findUnique` 取得現有 SeenItem
2. 若不存在 → 建立新 SeenItem（lastPrice = item.price），視為新商品
3. 若已存在且 `item.price != null` 且 `item.price < existing.lastPrice` → 標記 `isPriceDrop = true`，更新 lastPrice，加入通知佇列
4. 其他情況 → 標記為 duplicate，跳過通知

**替代方案考慮：** 在 SeenItem 建立單獨的 PriceHistory 表記錄每次掃描到的價格。拒絕原因：增加資料庫複雜度，目前只需比較最後已知價格，單一欄位足夠。

### 降價通知使用獨立的 Discord Embed 顏色（綠色 0x57F287）與標題前綴 [降價]

`sendDiscordBatchNotification()` 接收的 item 攜帶 `isPriceDrop: boolean` 與 `originalPrice: number | null`。降價商品：
- embed `color` 為 `0x57F287`（與新商品通知的平台色做視覺區隔）
- embed `title` 前綴 `[降價] `
- embed fields 新增「原價」（`NT$ {originalPrice:,}`）與「現價」（`NT$ {price:,}`）

**替代方案考慮：** 單獨發送一則「降價摘要」Embed，不與新商品通知混合。拒絕原因：批次處理架構下難以拆分，混合在同一批次更簡單。

### price 為 null 的商品不觸發降價通知

若 `item.price == null`，跳過降價比較，直接以 duplicate 處理（不更新 lastPrice）。

## Risks / Trade-offs

- **[風險] 電商平台價格抓取不穩定，可能誤判降價（如抓到促銷標籤而非實際價格）** → 可接受；後續可透過 PRICE_DROP_MIN_PERCENT 設定最低降幅過濾
- **[風險] lastPrice 更新後若用戶長期未收到通知，舊 lastPrice 可能已過時** → 每次 price drop 均更新 lastPrice，確保比較基準為最後一次通知時的價格
- **[風險] findUnique 增加資料庫查詢次數** → 批次端點已有 N+1 問題，本次不額外優化（留待 performance change 處理）

## Migration Plan

1. 在 `schema.prisma` 的 SeenItem model 新增 `lastPrice Float?`
2. 執行 `npx prisma migrate dev --name add_seen_item_last_price`
3. 部署 `notify/batch` 端點（新舊 SeenItem 記錄的 lastPrice 預設為 null，不影響現有去重邏輯）
4. 部署 `discord.ts` 與 `email.ts` 更新

## Open Questions

- 是否需要在降價通知中顯示降幅百分比？（本次不實作，欄位已有原價/現價供用戶自行計算）
