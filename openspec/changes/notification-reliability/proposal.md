## Why

用戶輸入錯誤的 Discord Webhook URL 後系統毫無反饋，無從得知設定是否正確。此外，廣泛關鍵字（如「鍵盤」）可能一次觸發多達 25 筆通知，造成 Discord 頻道被大量訊息洗版。

## What Changes

- 設定頁新增「測試 Webhook」按鈕，儲存前可發送測試訊息至已填入的 Webhook URL，並即時顯示成功或失敗結果
- 批次通知新增每次上限（預設 10 筆，可透過環境變數調整），超過上限時通知訊息中顯示「還有 X 筆未顯示，請縮小關鍵字範圍」

## Non-Goals (optional)

## Capabilities

### New Capabilities

### Modified Capabilities

- `notification-settings`: 新增 Webhook 測試驗證需求，設定頁提供測試按鈕
- `discord-notify`: 新增每批次通知上限需求，防止洗版

## Impact

- webapp/app/api/settings/test-webhook/route.ts（新增）
- webapp/app/settings/page.tsx
- webapp/lib/discord.ts
- webapp/app/api/worker/notify/batch/route.ts
