## Why

資安審查發現多項中高危漏洞：SSRF、Email header injection、私有 IP 存取風險及 cursor 格式注入。這些問題存在於生產環境中，需立即修復以防止資料外洩與服務濫用。

## What Changes

- **SSRF 防護**：Discord webhook URL 驗證由 `startsWith` 改為嚴格的 URL 解析（`new URL()`），確認 hostname 完全等於 `discord.com`，並封鎖私有 IP 範圍（127.x、169.254.x、10.x、172.16-31.x、192.168.x）
- **Email header injection 防護**：Email subject line 過濾 `\r\n` 字元，防止攻擊者注入任意 Email header
- **URL 安全強化**：`isHttpUrl()` 改為僅接受 `https://`，拒絕 `http://` 及私有 IP
- **Cursor 格式驗證**：History API cursor 參數驗證必須為有效 CUID 格式
- **`env.local` 移除**：確認 `.env.local` 已加入 `.gitignore`，避免憑證再次被 commit

## Non-Goals

- 憑證輪換（NEXTAUTH_SECRET、GOOGLE OAuth、DATABASE_URL、WORKER_SECRET）：屬操作性任務，**需使用者手動執行**（見下方清單）
- Rate limiting 實作：屬獨立功能需求，不在本次範圍
- Discord webhook URL 加密儲存：屬中期優化，不在本次範圍
- GDPR 資料匯出/刪除 endpoint：屬獨立功能需求，不在本次範圍

---

> ⚠️ **使用者需手動執行的憑證輪換清單（程式碼修復完成後）：**
> 1. Google Cloud Console → 撤銷並重新產生 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
> 2. Neon.tech → 重設資料庫密碼，更新 `DATABASE_URL`
> 3. 重新產生 `NEXTAUTH_SECRET`：`openssl rand -base64 32`
> 4. 重新產生 `WORKER_SECRET`：`openssl rand -base64 32`（同步更新 GitHub Actions Secrets）
> 5. 用 `git filter-repo` 從 git 歷史清除 `.env.local`

## Capabilities

### New Capabilities

- `webhook-url-security`: 嚴格的 Discord webhook URL 驗證工具函式，防止 SSRF 攻擊

### Modified Capabilities

- `notification-settings`: webhook URL 驗證改為嚴格解析；email subject 須過濾 `\r\n`
- `notification-history`: cursor 參數須通過 CUID 格式驗證
- `email-notify`: subject line 強制過濾控制字元；imageUrl 僅接受 `https://`

## Impact

- Affected code:
  - `webapp/lib/utils.ts` — `isHttpUrl()` 強化
  - `webapp/lib/email.ts` — subject sanitization
  - `webapp/lib/webhook-validation.ts` — 新工具函式（`isValidDiscordWebhookUrl()`）
  - `webapp/app/api/settings/test-webhook/route.ts` — SSRF 修復
  - `webapp/app/api/settings/route.ts` — webhook URL 驗證
  - `webapp/app/api/keywords/route.ts` — webhook URL 驗證
  - `webapp/app/api/keywords/[id]/route.ts` — webhook URL 驗證
  - `webapp/app/api/circles/route.ts` — webhook URL 驗證
  - `webapp/app/api/circles/[id]/route.ts` — webhook URL 驗證
  - `webapp/app/api/history/route.ts` — cursor 驗證
  - `.gitignore` — 確認 `.env.local` 已排除
