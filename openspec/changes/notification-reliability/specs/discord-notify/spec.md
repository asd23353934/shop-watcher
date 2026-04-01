## ADDED Requirements

### Requirement: Batch notification is capped at MAX_NOTIFY_PER_BATCH items

The Discord batch notification function SHALL limit the number of items notified per batch to MAX_NOTIFY_PER_BATCH (default 10, configurable via environment variable). If the batch contains more items than the cap, the notification SHALL include a note indicating how many items were omitted.

#### Scenario: Batch exceeds cap

- **WHEN** sendDiscordBatchNotification is called with 15 items and MAX_NOTIFY_PER_BATCH is 10
- **THEN** only the first 10 items SHALL be included in the Discord embeds
- **AND** the last embed SHALL include a field noting "還有 5 筆未顯示，請縮小關鍵字範圍"

#### Scenario: Batch within cap

- **WHEN** sendDiscordBatchNotification is called with 8 items and MAX_NOTIFY_PER_BATCH is 10
- **THEN** all 8 items SHALL be included with no omission note
