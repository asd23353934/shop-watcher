## Context

目前 7 個 API route 以 `startsWith('https://discord.com/api/webhooks/')` 驗證 webhook URL，無法防止 path traversal 繞過；`isHttpUrl()` 接受任意 http/https URL 包含私有 IP；email subject 未過濾控制字元；history cursor 無格式驗證。這些問題跨越 `webapp/lib/`、多個 API routes，需統一修復。

## Goals / Non-Goals

**Goals:**

- 建立單一的 `isValidDiscordWebhookUrl()` 工具函式，所有 route 共用
- 防止 SSRF：webhook URL 嚴格限定 hostname = `discord.com`，封鎖私有 IP
- 防止 Email header injection：subject line 移除 `\r\n`
- 強化 `isHttpUrl()`：僅接受 `https://`，拒絕私有 IP
- Cursor 格式驗證：驗證是否為有效 CUID（`c` + 24 alphanumeric）

**Non-Goals:**

- 憑證輪換（操作任務，非程式碼）
- Rate limiting
- Webhook URL 加密儲存
- GDPR endpoint

## Decisions

### 集中 webhook URL 驗證邏輯至 `webapp/lib/webhook-validation.ts`

目前 7 個 route 各自重複相同的 `startsWith` 驗證。集中到一個函式後，所有 route import 同一來源，避免遺漏。

**替代方案**：在每個 route 各自修復 → 容易遺漏，維護困難。

```ts
// webapp/lib/webhook-validation.ts
const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

export function isValidDiscordWebhookUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  if (parsed.hostname !== 'discord.com') return false
  if (!parsed.pathname.startsWith('/api/webhooks/')) return false
  if (PRIVATE_IP_RANGES.some(r => r.test(parsed.hostname))) return false
  return true
}
```

### Email subject 使用 `replace(/[\r\n\t]/g, ' ')` 清理

移除 CRLF 字元（Email header injection 載體），同時以空格替換以保持可讀性。`\t` 也一併移除（某些 SMTP 實作允許 folded headers）。

### `isHttpUrl()` 改為 `https://` only + 私有 IP 封鎖

商品圖片 URL 來自第三方電商平台，正常情況下全為 HTTPS。拒絕 `http://` 不影響功能，同時防止 email client 載入私有網路資源。

```ts
const PRIVATE_IP_PATTERN = /^https?:\/\/(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/

export function isHttpUrl(url: string | null | undefined): url is string {
  if (typeof url !== 'string') return false
  if (!url.startsWith('https://')) return false
  if (PRIVATE_IP_PATTERN.test(url)) return false
  return true
}
```

### Cursor 驗證使用 CUID regex

Prisma 預設使用 CUID（`c` 開頭 + 24 個英數字）。用 regex 過濾無效 cursor，避免 Prisma 拋出無法預期的錯誤並洩漏 stack trace。

```ts
const CUID_RE = /^c[a-z0-9]{24}$/
```

## Risks / Trade-offs

- `isHttpUrl()` 改為 HTTPS only → 若有任何現有商品 URL 以 `http://` 開頭，email 中將不顯示圖片。風險極低（主要平台皆為 HTTPS），且屬可接受的安全取捨。
- Cursor regex 過嚴 → 若 Prisma 未來改用 nanoid 或 uuid，regex 需更新。目前 schema 未指定 `@default`，Prisma 預設為 CUID，風險極低。
