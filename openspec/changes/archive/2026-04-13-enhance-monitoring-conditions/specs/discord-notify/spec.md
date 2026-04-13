## ADDED Requirements

### Requirement: notify/batch applies seller blocklist before notifying

The system SHALL apply seller filtering in `POST /api/worker/notify/batch` before inserting SeenItem or sending notifications. The filter order SHALL be: (1) global seller blocklist, (2) per-keyword seller blocklist. An item is dropped if it matches either list.

#### Scenario: Global seller blocklist drops item before per-keyword check

- **WHEN** an item arrives with `seller_name: "ScalperShop"`
- **AND** user's `globalSellerBlocklist` contains `"scalper"` (case-insensitive substring)
- **THEN** the item SHALL be dropped immediately, before per-keyword seller check
- **AND** no SeenItem row SHALL be created

#### Scenario: Per-keyword seller blocklist drops item not caught by global

- **WHEN** an item arrives with `seller_name: "CircleB"`
- **AND** user's `globalSellerBlocklist` does NOT match
- **AND** the keyword's `sellerBlocklist` contains `"circleb"`
- **THEN** the item SHALL be dropped by per-keyword filter
- **AND** no SeenItem row SHALL be created

---

### Requirement: notify/batch routes Discord notification to per-keyword webhook

The system SHALL use the keyword's `discordWebhookUrl` (from the batch request payload) as the Discord notification target when non-null, falling back to `NotificationSetting.discordWebhookUrl`.

#### Scenario: Batch request with keyword webhookUrl routes to that URL

- **WHEN** `POST /api/worker/notify/batch` includes `{ "keywordWebhookUrl": "https://discord.com/api/webhooks/111/aaa" }`
- **AND** the user's global webhook is `"https://discord.com/api/webhooks/999/zzz"`
- **THEN** the Discord notification SHALL be POSTed to `https://discord.com/api/webhooks/111/aaa`

#### Scenario: Null keyword webhookUrl falls back to global webhook

- **WHEN** `POST /api/worker/notify/batch` includes `{ "keywordWebhookUrl": null }`
- **THEN** the Discord notification SHALL be POSTed to the user's `NotificationSetting.discordWebhookUrl`

---

### Requirement: notify/batch enforces maxNotifyPerScan cap per keyword

The system SHALL truncate new items to `maxNotifyPerScan` (from the batch payload, or `MAX_NOTIFY_PER_BATCH` if null) after deduplication and seller filtering, before inserting SeenItem or sending notifications.

#### Scenario: New items after filtering are capped at maxNotifyPerScan

- **WHEN** 20 items pass deduplication and seller filtering
- **AND** `maxNotifyPerScan: 5` is provided in the batch payload
- **THEN** only the first 5 items SHALL be inserted into SeenItem
- **AND** only those 5 items SHALL trigger Discord notification
- **AND** the remaining 15 SHALL be silently dropped

#### Scenario: SeenItem stores itemName and itemUrl from batch payload

- **WHEN** `POST /api/worker/notify/batch` includes items with `name` and `url` fields
- **THEN** `SeenItem.itemName` SHALL be set to the item's `name` (truncated to 255 characters)
- **AND** `SeenItem.itemUrl` SHALL be set to the item's `url`
- **AND** these values SHALL be available for display in the notification history page
