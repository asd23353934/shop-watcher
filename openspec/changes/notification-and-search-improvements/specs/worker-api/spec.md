## MODIFIED Requirements

### Requirement: GET /api/worker/keywords returns all active keywords with user notification settings

The system SHALL expose a `GET /api/worker/keywords` endpoint that returns all active keywords across all users, along with each user's notification configuration. Only requests bearing a valid `Authorization: Bearer {WORKER_SECRET}` header SHALL be authorized.

#### Scenario: Valid Bearer token returns active keyword list

- **WHEN** the Worker calls `GET /api/worker/keywords` with `Authorization: Bearer {WORKER_SECRET}`
- **THEN** the response SHALL be HTTP 200 with a JSON array
- **AND** each element SHALL contain: `id`, `keyword`, `platforms` (string array), `minPrice` (float or null), `maxPrice` (float or null), `blocklist` (string array, empty if none), `userId`, `discordWebhookUrl` (or null), `discordUserId` (or null), `emailAddress` (or null)
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

## ADDED Requirements

### Requirement: POST /api/worker/notify/batch accepts a batch of items and sends grouped notifications

The system SHALL expose a `POST /api/worker/notify/batch` endpoint that accepts an array of scraped items for a single keyword, deduplicates them against `SeenItem`, and sends one grouped Discord notification and one grouped Email for all new items in a single request.

#### Scenario: Batch notify with multiple new items

- **WHEN** the Worker calls `POST /api/worker/notify/batch` with `{ keyword_id, items: [item1, item2, item3] }` and none of the items exist in `SeenItem`
- **THEN** the response SHALL be HTTP 200
- **AND** a `SeenItem` row SHALL be inserted for each new item
- **AND** one Discord Webhook call SHALL be made containing all new items as embeds (max 10 per call, chunked if more)
- **AND** one Email SHALL be sent listing all new items

#### Scenario: Batch notify where some items are duplicates

- **WHEN** the Worker calls `POST /api/worker/notify/batch` with 5 items and 3 are already in `SeenItem`
- **THEN** only the 2 new items SHALL be inserted into `SeenItem`
- **AND** notifications SHALL only be sent for the 2 new items
- **AND** the response SHALL return `{ "new": 2, "duplicate": 3 }`

#### Scenario: Batch notify with all duplicate items

- **WHEN** all items in the batch already exist in `SeenItem`
- **THEN** no Discord or Email notification SHALL be sent
- **AND** the response SHALL return `{ "new": 0, "duplicate": N }`

#### Scenario: Batch notify with empty items array

- **WHEN** the Worker calls `POST /api/worker/notify/batch` with `{ keyword_id, items: [] }`
- **THEN** the response SHALL return HTTP 200 with `{ "new": 0, "duplicate": 0 }`
- **AND** no notifications SHALL be sent
