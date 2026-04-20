## 1. 基礎工具函式

- [x] 1.1 建立 `webapp/lib/webhook-validation.ts`，集中 webhook URL 驗證邏輯至 `webapp/lib/webhook-validation.ts`，實作 `isValidDiscordWebhookUrl(url: unknown): url is string`：使用 `new URL()` 解析，驗證 `protocol === 'https:'`、`hostname === 'discord.com'`、`pathname.startsWith('/api/webhooks/')`，並用私有 IP regex 封鎖 127.x/10.x/172.16-31.x/192.168.x/169.254.x/::1/fc00:/fe80:
- [x] 1.2 修改 `webapp/lib/utils.ts` 的 `isHttpUrl()`，`isHttpUrl()` 改為 `https://` only + 私有 IP 封鎖：移除 `http://` 分支，加入 PRIVATE_IP_PATTERN regex 拒絕私有 IP

## 2. Discord Webhook URL 驗證修復（SSRF 防護）

- [x] 2.1 修改 `webapp/app/api/settings/route.ts`：將兩處 `webhookUrl.startsWith(...)` 替換為 `isValidDiscordWebhookUrl(webhookUrl)`（匯入自 `webapp/lib/webhook-validation.ts`），實作「All API routes use shared validator」、「Invalid Discord Webhook URL is rejected」及「User can save Discord notification settings」驗證路徑
- [x] 2.2 修改 `webapp/app/api/settings/test-webhook/route.ts`：替換 `startsWith` 為 `isValidDiscordWebhookUrl(webhookUrl)`，實作「Discord webhook URL validation prevents SSRF」
- [x] 2.3 修改 `webapp/app/api/keywords/route.ts`：替換 webhook URL 的 `startsWith` 檢查為 `isValidDiscordWebhookUrl()`
- [x] 2.4 修改 `webapp/app/api/keywords/[id]/route.ts`：替換 webhook URL 的 `startsWith` 檢查為 `isValidDiscordWebhookUrl()`
- [x] 2.5 修改 `webapp/app/api/circles/route.ts`：替換 webhook URL 的 `startsWith` 檢查為 `isValidDiscordWebhookUrl()`
- [x] 2.6 修改 `webapp/app/api/circles/[id]/route.ts`：替換 webhook URL 的 `startsWith` 檢查為 `isValidDiscordWebhookUrl()`

## 3. Email 安全修復

- [x] 3.1 修改 `webapp/lib/email.ts`：在 subject 組合後套用設計決策「Email subject 使用 `replace(/[\r\n\t]/g, ' ')` 清理」，以 replace 將控制字元替換為空格，實作「Email subject line is sanitized to prevent header injection」
- [x] 3.2 修改 `webapp/lib/email.ts`：在 `<img>` tag 渲染處包裝 `isHttpUrl()` 條件判斷，僅當 image_url 通過 HTTPS-only 驗證時才輸出 `<img>` tag，實作「Item image URLs in email are HTTPS-only」

## 4. History Cursor 驗證

- [x] 4.1 修改 `webapp/app/api/history/route.ts`：在讀取 cursor query param 後加入 CUID format 驗證（`/^c[a-z0-9]{24}$/`），空字串視為無 cursor，非空且不符合格式則回傳 HTTP 400 `{ error: '無效的 cursor 格式' }`，實作「History API cursor parameter is validated as CUID format」，`Cursor 驗證使用 CUID regex`

## 5. 設定檔修復

- [x] 5.1 確認 `.gitignore` 已包含 `.env.local`（若未包含則加入），防止憑證再次被 commit
