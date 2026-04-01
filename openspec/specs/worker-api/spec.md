# worker-api Specification

## Purpose

TBD - created by archiving change 'saas-webapp'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: notification-and-search-improvements
updated: 2026-04-01
code:
  - src/scheduler.py
  - webapp/components/KeywordForm.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/scripts/cleanup.ts
  - src/scrapers/ruten.py
  - webapp/app/settings/page.tsx
  - src/watchers/base.py
  - webapp/package.json
  - webapp/app/api/history/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/lib/email.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/dashboard/layout.tsx
  - .github/workflows/cleanup.yml
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - src/scrapers/shopee.py
  - webapp/app/api/worker/scan-log/route.ts
  - src/api_client.py
  - webapp/lib/discord.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
-->

---
### Requirement: POST /api/worker/notify receives a scraped item and triggers deduplication and notifications

The system SHALL expose a POST /api/worker/notify endpoint. Upon receiving a valid item payload, the system SHALL check for duplicates, record new items, and dispatch notifications (Discord and/or Email) as configured for the associated user. For already-seen items, the system SHALL additionally check for price drops and re-notify if the current price is lower than the last known price.

#### Scenario: New item is recorded and notifications are triggered

- **WHEN** the Worker calls POST /api/worker/notify with a valid payload containing keyword_id, platform, item_id, name, price, url, image_url
- **THEN** the system SHALL check SeenItem for (userId, platform, item_id) uniqueness
- **AND** if not seen before, a new SeenItem row SHALL be inserted with lastPrice set to the item's price
- **AND** Discord notification SHALL be dispatched if discordWebhookUrl is configured for the keyword's owner
- **AND** Email notification SHALL be dispatched if emailAddress is configured for the keyword's owner
- **AND** the response SHALL be HTTP 200 with { "status": "new", "notified": true }

#### Scenario: Already-seen item with price drop triggers re-notification

- **WHEN** the Worker calls POST /api/worker/notify with an item whose (userId, platform, item_id) already exists in SeenItem
- **AND** the new price is non-null and lower than SeenItem.lastPrice
- **THEN** SeenItem.lastPrice SHALL be updated to the new price
- **AND** a price drop notification SHALL be dispatched with isPriceDrop flag and originalPrice
- **AND** the response SHALL be HTTP 200 with { "status": "price_drop", "notified": true }

#### Scenario: Already-seen item is silently skipped

- **WHEN** the Worker calls POST /api/worker/notify with an item whose (userId, platform, item_id) already exists in SeenItem
- **AND** the price has not dropped or is null
- **THEN** no new SeenItem row SHALL be inserted
- **AND** no Discord or Email notification SHALL be sent
- **AND** the response SHALL be HTTP 200 with { "status": "duplicate" }

#### Scenario: Invalid payload returns 400

- **WHEN** the Worker calls POST /api/worker/notify with a missing keyword_id or item_id
- **THEN** the response SHALL be HTTP 400 with a descriptive error message

#### Scenario: Unknown keyword_id returns 404

- **WHEN** the Worker calls POST /api/worker/notify with a keyword_id that does not exist in the database
- **THEN** the response SHALL be HTTP 404
- **AND** no notification SHALL be sent

#### Scenario: Missing Authorization header returns 401

- **WHEN** a request is made to POST /api/worker/notify without an Authorization header
- **THEN** the response SHALL be HTTP 401


<!-- @trace
source: price-drop-alert
updated: 2026-04-01
code:
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/history/route.ts
  - webapp/app/api/worker/notify/batch/route.ts
  - src/scrapers/ruten.py
  - webapp/app/api/keywords/route.ts
  - src/scheduler.py
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/scan-log/route.ts
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
  - webapp/app/dashboard/layout.tsx
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/api/worker/keywords/route.ts
  - webapp/lib/email.ts
  - webapp/package.json
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - webapp/scripts/cleanup.ts
  - webapp/lib/discord.ts
  - webapp/app/history/page.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/app/settings/page.tsx
  - src/api_client.py
  - webapp/components/KeywordForm.tsx
  - webapp/components/NotificationForm.tsx
  - .github/workflows/cleanup.yml
  - src/watchers/base.py
  - src/scrapers/shopee.py
-->

---
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

<!-- @trace
source: notification-and-search-improvements
updated: 2026-04-01
code:
  - src/scheduler.py
  - webapp/components/KeywordForm.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/scripts/cleanup.ts
  - src/scrapers/ruten.py
  - webapp/app/settings/page.tsx
  - src/watchers/base.py
  - webapp/package.json
  - webapp/app/api/history/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/lib/email.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/dashboard/layout.tsx
  - .github/workflows/cleanup.yml
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - src/scrapers/shopee.py
  - webapp/app/api/worker/scan-log/route.ts
  - src/api_client.py
  - webapp/lib/discord.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
-->