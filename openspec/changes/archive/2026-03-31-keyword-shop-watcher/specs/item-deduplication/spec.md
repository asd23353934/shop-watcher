## REMOVED Requirements

> **架構變更說明**：去重邏輯已從 Worker 移至 Next.js API。Worker 將所有爬取到的商品透過 `POST /api/worker/notify` 回報給 Next.js，由 Next.js 查詢 PostgreSQL 的 `seen_items` table 進行去重判斷。Worker 不再維護 SQLite `watcher.db`，也不再有 `is_new_item` 函式。`src/database.py` 模組已刪除。

### Requirement: Seen items are persisted in SQLite with platform and item_id as primary key

移除原因：去重責任轉移至 Next.js API（`seen_items` table 在 PostgreSQL）。Worker 保持無狀態，不維護任何本地持久化儲存。`src/database.py` 與 `watcher.db` 均已從 Worker 移除。

#### Scenario: SQLite database module is removed from the Worker codebase

- **WHEN** the Worker codebase is updated to the SaaS architecture
- **THEN** `src/database.py` SHALL NOT exist in the Worker repository
- **AND** `watcher.db` SHALL NOT be referenced in `requirements.txt`, `Dockerfile`, or `fly.toml`

---

### Requirement: New items are detected and recorded atomically

移除原因：`is_new_item` 函式不再存在於 Worker 端。Next.js API 在收到 `POST /api/worker/notify` 時執行去重（查詢 PostgreSQL `seen_items` table）。

#### Scenario: is_new_item function does not exist in the Worker

- **WHEN** the Worker codebase is updated to the SaaS architecture
- **THEN** no `is_new_item` function SHALL exist anywhere in the Worker source code
- **AND** deduplication logic SHALL reside exclusively in the Next.js API

---

### Requirement: Database path is configurable

移除原因：Worker 無 SQLite 依賴，`db_path` 設定項目不再存在。

#### Scenario: No db_path configuration exists in Worker environment

- **WHEN** the Worker environment is configured via `.env`
- **THEN** no `DB_PATH` or equivalent variable SHALL be present in `.env.example`
- **AND** `aiosqlite` SHALL NOT appear in `requirements.txt`
