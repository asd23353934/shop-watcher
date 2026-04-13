## ADDED Requirements

### Requirement: Per-keyword scan notification cap prevents notification floods

The system SHALL support a `maxNotifyPerScan: Int?` field on `Keyword`. When a batch notification request is processed for a keyword, if the number of new (non-duplicate) items exceeds `maxNotifyPerScan`, the system SHALL truncate to the first `maxNotifyPerScan` items (preserving scraper-returned order, newest first) and skip the remainder. Items beyond the cap SHALL NOT be inserted into `SeenItem` and SHALL NOT trigger any notification. When `maxNotifyPerScan` is null, the system-level `MAX_NOTIFY_PER_BATCH` environment variable applies as the default.

#### Scenario: Batch exceeds per-keyword maxNotifyPerScan cap

- **WHEN** `POST /api/worker/notify/batch` receives 20 new items for keyword K
- **AND** keyword K has `maxNotifyPerScan: 5`
- **THEN** only the first 5 items SHALL be inserted into SeenItem
- **AND** only those 5 items SHALL trigger Discord / Email notification
- **AND** the remaining 15 items SHALL be silently dropped (not recorded, not notified)
- **AND** the API response SHALL indicate 5 notified and 15 capped

#### Scenario: Batch within cap notifies all items

- **WHEN** `POST /api/worker/notify/batch` receives 3 new items for keyword K
- **AND** keyword K has `maxNotifyPerScan: 5`
- **THEN** all 3 items SHALL be inserted into SeenItem and notified

#### Scenario: maxNotifyPerScan null uses system default MAX_NOTIFY_PER_BATCH

- **WHEN** keyword K has `maxNotifyPerScan: null`
- **AND** environment variable `MAX_NOTIFY_PER_BATCH` is `10`
- **THEN** the effective cap for that keyword SHALL be 10

#### Scenario: Keyword created with maxNotifyPerScan

- **WHEN** a user submits `POST /api/keywords` with `{ "maxNotifyPerScan": 3 }`
- **THEN** the `Keyword` row SHALL be created with `maxNotifyPerScan: 3`

#### Scenario: maxNotifyPerScan must be a positive integer

- **WHEN** a user submits `POST /api/keywords` with `{ "maxNotifyPerScan": 0 }` or `{ "maxNotifyPerScan": -1 }`
- **THEN** the API SHALL return HTTP 400
- **AND** no `Keyword` row SHALL be created

#### Scenario: Keyword maxNotifyPerScan updated via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "maxNotifyPerScan": 10 }`
- **THEN** `Keyword.maxNotifyPerScan` SHALL be updated to 10
- **AND** subsequent batch notifications SHALL apply the new cap
