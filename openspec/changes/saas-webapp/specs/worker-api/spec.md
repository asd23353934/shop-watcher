## ADDED Requirements

### Requirement: GET /api/worker/keywords returns all active keywords with user notification settings

The system SHALL expose a `GET /api/worker/keywords` endpoint that returns all active keywords across all users, along with each user's notification configuration. Only requests bearing a valid `Authorization: Bearer {WORKER_SECRET}` header SHALL be authorized.

#### Scenario: Valid Bearer token returns active keyword list

- **WHEN** the Worker calls `GET /api/worker/keywords` with `Authorization: Bearer {WORKER_SECRET}`
- **THEN** the response SHALL be HTTP 200 with a JSON array
- **AND** each element SHALL contain: `id`, `keyword`, `platforms` (string array), `minPrice` (float or null), `maxPrice` (float or null), `userId`, `discordWebhookUrl` (or null), `discordUserId` (or null), `emailAddress` (or null)
- **AND** only `Keyword` rows where `active = true` SHALL be included

#### Scenario: Missing Authorization header returns 401

- **WHEN** a request is made to `GET /api/worker/keywords` without an `Authorization` header
- **THEN** the response SHALL be HTTP 401

#### Scenario: Invalid Bearer token returns 401

- **WHEN** a request is made with `Authorization: Bearer wrong-secret`
- **THEN** the response SHALL be HTTP 401
- **AND** no keyword data SHALL be returned

#### Scenario: No active keywords returns empty array

- **WHEN** all keywords have `active = false` or no keywords exist
- **THEN** the response SHALL be HTTP 200 with an empty JSON array `[]`

---

### Requirement: POST /api/worker/notify receives a scraped item and triggers deduplication and notifications

The system SHALL expose a `POST /api/worker/notify` endpoint. Upon receiving a valid item payload, the system SHALL check for duplicates, record new items, and dispatch notifications (Discord and/or Email) as configured for the associated user.

#### Scenario: New item is recorded and notifications are triggered

- **WHEN** the Worker calls `POST /api/worker/notify` with a valid payload containing `keyword_id`, `platform`, `item_id`, `name`, `price`, `url`, `image_url`
- **THEN** the system SHALL check `SeenItem` for `(userId, platform, item_id)` uniqueness
- **AND** if not seen before, a new `SeenItem` row SHALL be inserted
- **AND** Discord notification SHALL be dispatched if `discordWebhookUrl` is configured for the keyword's owner
- **AND** Email notification SHALL be dispatched if `emailAddress` is configured for the keyword's owner
- **AND** the response SHALL be HTTP 200 with `{ "status": "new", "notified": true }`

#### Scenario: Already-seen item is silently skipped

- **WHEN** the Worker calls `POST /api/worker/notify` with an item whose `(userId, platform, item_id)` already exists in `SeenItem`
- **THEN** no new `SeenItem` row SHALL be inserted
- **AND** no Discord or Email notification SHALL be sent
- **AND** the response SHALL be HTTP 200 with `{ "status": "duplicate" }`

#### Scenario: Invalid payload returns 400

- **WHEN** the Worker calls `POST /api/worker/notify` with a missing `keyword_id` or `item_id`
- **THEN** the response SHALL be HTTP 400 with a descriptive error message

#### Scenario: Unknown keyword_id returns 404

- **WHEN** the Worker calls `POST /api/worker/notify` with a `keyword_id` that does not exist in the database
- **THEN** the response SHALL be HTTP 404
- **AND** no notification SHALL be sent

#### Scenario: Missing Authorization header returns 401

- **WHEN** a request is made to `POST /api/worker/notify` without an `Authorization` header
- **THEN** the response SHALL be HTTP 401
