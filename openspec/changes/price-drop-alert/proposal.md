## Why

目前系統只通知「新上架」商品，無法追蹤已知商品的價格變動，用戶因此錯過降價購買機會，與用戶購物監控的核心需求不符。

## What Changes

- SeenItem 新增 `lastPrice` 欄位（Float?），每次批次通知時更新
- 每次掃描時若發現已存在的 SeenItem 但價格下降，則重新通知（觸發降價通知）
- 降價通知在 Discord 以不同顏色（綠色 0x57F287）與標題前綴 `[降價]` 顯示，並附上原價與現價欄位
- 降價通知同樣透過 Email 發送，列中附加「↓ 降價」標示

## Non-Goals (optional)

## Capabilities

### New Capabilities

- `price-drop-alert`: 偵測已知商品降價並重新通知用戶

### Modified Capabilities

- `item-deduplication`: SeenItem 新增 lastPrice 欄位，允許價格下降時重新通知（而非僅以 itemId 判斷重複）
- `worker-api`: notify/batch 端點支援 price drop 判斷與通知場景

## Impact

- webapp/prisma/schema.prisma（SeenItem.lastPrice 欄位）
- webapp/prisma/migrations/
- webapp/app/api/worker/notify/batch/route.ts
- webapp/lib/discord.ts
- webapp/lib/email.ts
