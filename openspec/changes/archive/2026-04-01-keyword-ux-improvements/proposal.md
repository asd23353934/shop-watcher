## Why

目前關鍵字管理流程存在多個 UX 缺陷：新增關鍵字後畫面不刷新、未設定通知方式就可新增關鍵字、允許同一用戶建立重複關鍵字，導致用戶困惑與資源浪費。

## What Changes

- 新增關鍵字後，關鍵字列表立即刷新顯示新項目（不需重新整理頁面）
- 用戶在尚未設定任何通知方式（Discord Webhook 或 Email）時，新增關鍵字前顯示引導提示，告知需先完成通知設定
- 同一用戶不得建立重複的關鍵字（相同 keyword 文字 + 相同 platforms 組合），後端 API 回傳明確錯誤，前端顯示提示訊息
- 不同用戶之間允許建立相同的關鍵字（各自獨立）

## Non-Goals（選填）

- 不實作全域關鍵字黑名單或禁詞功能（範圍外，可作為後續獨立變更）
- 不修改關鍵字的價格區間或平台選擇邏輯
- 不改動 Worker 掃描行為

## Capabilities

### New Capabilities

（無新 capability）

### Modified Capabilities

- `keyword-management`：新增重複關鍵字驗證規則（同一用戶不得建立相同 keyword + platforms 組合）；新增關鍵字後前端立即刷新列表
- `notification-settings`：新增「未設定通知方式時顯示引導提示」需求（在關鍵字新增流程中檢查）

## Impact

- Affected specs: `keyword-management`、`notification-settings`
- Affected code:
  - `webapp/app/api/keywords/route.ts` — POST 新增重複檢查邏輯
  - `webapp/app/dashboard/page.tsx` 或相關 client component — 新增後刷新列表、通知設定檢查引導
  - `webapp/prisma/schema.prisma` — 可能新增 `@@unique([userId, keyword, platforms])` 約束
