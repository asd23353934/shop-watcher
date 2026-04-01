## Context

現有的 `NotificationForm` 元件僅儲存 Webhook URL，不進行任何有效性驗證；用戶必須等到下次通知觸發才能發現 URL 填錯。`sendDiscordBatchNotification` 函式目前對批次大小無任何上限保護，單一廣泛關鍵字（如「鍵盤」）可能在一次掃描中返回數十筆商品，全數推送至 Discord。

## Goals / Non-Goals

**Goals:**

- 新增 `POST /api/settings/test-webhook` 端點：接收 Webhook URL，送出固定測試 Embed，並回傳成功或失敗狀態
- 在設定頁的 Webhook URL 輸入框旁加入「測試」按鈕，即時顯示測試結果
- 新增 `MAX_NOTIFY_PER_BATCH` 環境變數（預設 10），限制每批次最多發送的通知筆數
- 若批次被截斷，在通知訊息中附加說明文字引導用戶縮小關鍵字範圍

**Non-Goals:**

- 不驗證 Webhook URL 的格式（交由實際請求失敗來反映）
- 不實作 Webhook URL 的加密儲存（現有儲存方式不變）
- 不限制「測試」按鈕的呼叫頻率（本次不處理防濫用）

## Decisions

### Webhook 測試端點以 POST /api/settings/test-webhook 實作

接收 `{ webhookUrl: string }` 請求體，使用 `fetch` 直接向該 URL 發送一則固定的 Discord Embed（title: "Shop Watcher 連線測試"，color: 0x5865F2，description: "✅ Webhook 設定成功！"）。若 Discord 回傳 2xx 則回傳 `{ ok: true }`；否則回傳 `{ ok: false, error: string }`（含 HTTP 狀態碼）。

前端按鈕依序顯示「載入中 → 成功（綠色 ✓）或失敗（紅色 ✗ + 錯誤訊息）」三種狀態。

**替代方案考慮：** 改在前端直接呼叫 Discord Webhook。拒絕原因：Discord Webhook URL 若暴露在前端請求中會洩漏給 browser devtools，此外 CORS 限制可能阻擋直接呼叫。

### 批次通知上限以 MAX_NOTIFY_PER_BATCH 環境變數控制，預設 10

在 `sendDiscordBatchNotification` 的 chunk 邏輯前，先以 `items.slice(0, maxBatch)` 截斷輸入。若有截斷（`omitted > 0`），在最後一個 embed chunk 的 fields 陣列末尾附加一個額外 field：`{ name: '⚠️ 提示', value: '還有 ${omitted} 筆未顯示，請縮小關鍵字範圍', inline: false }`。

**替代方案考慮：** 將上限設定存入資料庫，允許每位用戶個別設定。拒絕原因：增加複雜度，且洗版問題是全域性的，環境變數已足夠應對目前規模。

## Risks / Trade-offs

- **[風險] Webhook 測試會實際發送訊息到用戶頻道** → 可接受；UI 上加入說明文字提示用戶這是一則測試訊息
- **[風險] 上限截斷可能讓用戶錯過部分商品** → 說明文字引導縮小關鍵字範圍；上限可透過環境變數提升
- **[風險] `MAX_NOTIFY_PER_BATCH` 值過小可能影響正常低流量關鍵字** → 預設值 10 已大於多數正常使用情境

## Migration Plan

1. 部署新端點 `POST /api/settings/test-webhook`（無資料庫變更，無需 migration）
2. 更新 `.env.example` 加入 `MAX_NOTIFY_PER_BATCH=10`
3. 在 `discord.ts` 中讀取環境變數並套用截斷邏輯
4. 部署設定頁前端變更

## Open Questions

- 是否需要在測試 Embed 中加入時間戳，方便用戶確認訊息是剛才觸發的？（暫時不加，保持簡單）
