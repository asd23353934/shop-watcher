## REMOVED Requirements

> **架構變更說明**：Discord 通知（以及 Email 通知）已從 Worker 移至 Next.js API。Worker 只負責爬蟲與透過 `POST /api/worker/notify` 回報商品資料。Next.js API 收到商品後，依用戶設定決定是否發送 Discord Webhook 或 Resend Email。`src/notifier.py` 模組已從 Worker 移除。

### Requirement: New item notification is sent as a Discord Embed

移除原因：Discord 通知邏輯移至 Next.js API。Worker 不持有 Discord Webhook URL，不發送任何通知。

#### Scenario: Discord notifier module is removed from the Worker codebase

- **WHEN** the Worker codebase is updated to the SaaS architecture
- **THEN** `src/notifier.py` SHALL NOT exist in the Worker repository
- **AND** no `DISCORD_WEBHOOK_URL` variable SHALL appear in `requirements.txt` or `.env.example`

---

### Requirement: Per-keyword user mention notifies the correct Discord user

移除原因：per-user Discord mention 邏輯移至 Next.js API。Next.js 依各用戶在 dashboard 設定的 `discord_webhook_url` 與 `discord_user_id` 決定通知方式。Worker 端不再有 `discord_user_id` 欄位的概念。

#### Scenario: discord_user_id is not a field in the Worker keyword configuration

- **WHEN** the Worker receives a keyword object from `GET /api/worker/keywords`
- **THEN** the Worker SHALL NOT read or use a `discord_user_id` field
- **AND** user mention logic SHALL reside exclusively in the Next.js API

---

### Requirement: Discord errors do not block the watcher loop

移除原因：Worker 不再呼叫 Discord Webhook，此需求不再適用。Worker 對外的唯一 HTTP 呼叫是 Next.js API，相關錯誤處理由 `worker-api-client` 規格定義。

#### Scenario: Worker has no Discord HTTP calls to fail

- **WHEN** the Worker executes a scan cycle
- **THEN** the Worker SHALL make no HTTP calls to `discord.com` or any Discord endpoint
- **AND** all outgoing HTTP calls SHALL target the `NEXT_PUBLIC_API_URL` base URL only

---

### Requirement: Startup notification confirms the watcher is active

移除原因：Worker 不再直接發送 Discord 通知。啟動狀態透過 Worker 的 stdout log 與 Fly.io 監控確認。

#### Scenario: Worker logs startup status to stdout instead of Discord

- **WHEN** the Worker application starts
- **THEN** a startup message SHALL be printed to stdout (e.g. `Shop Watcher started`)
- **AND** no Discord Webhook call SHALL be made during startup
