## 1. Webhook 測試端點（Webhook 測試端點以 POST /api/settings/test-webhook 實作）

- [x] 1.1 建立 webapp/app/api/settings/test-webhook/route.ts：POST handler 接收 { webhookUrl: string }，呼叫 Discord Webhook 送出固定測試 Embed（title: "Shop Watcher 連線測試"，color: 0x5865F2，description: "✅ Webhook 設定成功！"），回傳 { ok: true } 或 { ok: false, error: string }（User can test Discord Webhook URL before saving）
- [x] 1.2 在 webapp/app/settings/page.tsx 的 NotificationForm 中，在 Discord Webhook URL 輸入框旁新增「測試」按鈕；按下後呼叫 POST /api/settings/test-webhook，顯示載入中→成功（綠色✓）或失敗（紅色✗ + 錯誤訊息）（Invalid Webhook URL returns error to user）

## 2. 批次通知上限（批次通知上限以 MAX_NOTIFY_PER_BATCH 環境變數控制，預設 10）

- [x] 2.1 在 webapp/lib/discord.ts 的 sendDiscordBatchNotification() 中，於 chunk 前先 slice items：const capped = items.slice(0, maxBatch); const omitted = items.length - capped.length；若 omitted > 0，在最後一個 embed chunk 新增一個 field { name: '⚠️ 提示', value: `還有 ${omitted} 筆未顯示，請縮小關鍵字範圍`, inline: false }（Batch notification is capped at MAX_NOTIFY_PER_BATCH items）
- [x] 2.2 在 webapp/.env.example 中新增 MAX_NOTIFY_PER_BATCH=10 說明；在 discord.ts 中讀取 process.env.MAX_NOTIFY_PER_BATCH ?? '10' 作為上限（Batch notification is capped at MAX_NOTIFY_PER_BATCH items）
