# discord-notify Specification

## Purpose

TBD - created by archiving change 'saas-webapp'. Update Purpose after archive.

## Requirements

### Requirement: New item triggers a Discord Embed notification via the user's Webhook URL

When new items pass deduplication in a batch, the system SHALL send one Discord Webhook POST request containing all new items as embeds (max 10 per call). If there are more than 10 new items, multiple Webhook calls SHALL be made in chunks of 10.

#### Scenario: Batch of new items produces Discord Embeds with seller name

- **WHEN** a batch of new items passes deduplication and the user has a `discordWebhookUrl` configured
- **THEN** the system SHALL POST to `discordWebhookUrl` with a JSON payload containing an `embeds` array of up to 10 embeds
- **AND** each embed `title` SHALL be the item name (truncated to 256 characters) and SHALL link to the item URL
- **AND** each embed SHALL include inline fields: platform label, price formatted as `NT$ {n:,}` (or `價格未知` if null), matched keyword, and seller name (or `未知` if null)
- **AND** if `image_url` is non-null, the embed SHALL include a `thumbnail` with that URL

#### Scenario: More than 10 new items are chunked into multiple Webhook calls

- **WHEN** a batch contains 15 new items and the user has a `discordWebhookUrl` configured
- **THEN** the system SHALL make 2 Webhook POST calls: one with 10 embeds and one with 5 embeds

#### Scenario: Embed color reflects the platform

- **WHEN** an item platform is `shopee`
- **THEN** the embed `color` SHALL be `0xEE4D2D`
- **WHEN** an item platform is `ruten`
- **THEN** the embed `color` SHALL be `0x0066CC`

#### Scenario: User mention is included when discordUserId is set

- **WHEN** the user's `NotificationSetting.discordUserId` is non-null
- **THEN** the Discord message `content` field SHALL be `<@{discordUserId}> 發現新商品！`

#### Scenario: No mention when discordUserId is null

- **WHEN** the user's `NotificationSetting.discordUserId` is null or empty
- **THEN** the Discord message `content` field SHALL be `發現新商品！` with no `<@>` mention

#### Scenario: Seller name is unknown

- **WHEN** an item `seller_name` is null
- **THEN** the seller embed field value SHALL be `未知`


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
### Requirement: Discord Webhook errors do not block the notify response

The system SHALL NOT propagate Discord Webhook HTTP errors to the Worker. If the Webhook call fails, the item is still recorded as seen and the API returns a success response.

#### Scenario: Non-2xx Discord Webhook response is logged and does not block

- **WHEN** the Discord Webhook POST returns a non-2xx HTTP status
- **THEN** the error SHALL be logged server-side
- **AND** the `POST /api/worker/notify` response SHALL still return HTTP 200
- **AND** the `SeenItem` row SHALL have already been inserted before the Webhook call

#### Scenario: Discord notification is skipped when no Webhook URL is configured

- **WHEN** a user's `NotificationSetting.discordWebhookUrl` is null
- **THEN** no HTTP request to Discord SHALL be made
- **AND** the system SHALL proceed to check Email notification settings

<!-- @trace
source: saas-webapp
updated: 2026-03-31
code:
  - webapp/app/api/keywords/[id]/route.ts
  - src/scrapers/ruten.py
  - webapp/app/globals.css
  - webapp/package.json
  - webapp/app/favicon.ico
  - webapp/public/file.svg
  - webapp/tsconfig.json
  - webapp/middleware.ts
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/login/page.tsx
  - webapp/eslint.config.mjs
  - webapp/public/globe.svg
  - webapp/types/next-auth.d.ts
  - webapp/next.config.ts
  - webapp/public/vercel.svg
  - webapp/vercel.json
  - main.py
  - poc/screenshots/shopee.png
  - webapp/app/dashboard/layout.tsx
  - .github/workflows/worker.yml
  - .env.example
  - webapp/lib/email.ts
  - webapp/lib/prisma.ts
  - webapp/components/KeywordForm.tsx
  - webapp/app/api/worker/keywords/route.ts
  - webapp/components/NotificationForm.tsx
  - fly.toml
  - src/database.py
  - webapp/app/api/keywords/route.ts
  - src/api_client.py
  - webapp/app/api/settings/route.ts
  - webapp/postcss.config.mjs
  - webapp/app/dashboard/page.tsx
  - config.example.yaml
  - webapp/app/page.tsx
  - webapp/components/KeywordFormWrapper.tsx
  - poc/screenshots/ruten.png
  - webapp/lib/worker-auth.ts
  - src/config.py
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - requirements.txt
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - .github/workflows/ci.yml
  - src/scheduler.py
  - src/scrapers/shopee.py
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/auth.ts
  - webapp/lib/discord.ts
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/public/next.svg
  - src/scrapers/__init__.py
  - src/notifier.py
  - Dockerfile
  - run_once.py
  - webapp/README.md
-->

---
### Requirement: Batch notification is capped at MAX_NOTIFY_PER_BATCH items

The Discord batch notification function SHALL limit the number of items notified per batch to MAX_NOTIFY_PER_BATCH (default 10, configurable via environment variable). If the batch contains more items than the cap, the notification SHALL include a note indicating how many items were omitted.

#### Scenario: Batch exceeds cap

- **WHEN** sendDiscordBatchNotification is called with 15 items and MAX_NOTIFY_PER_BATCH is 10
- **THEN** only the first 10 items SHALL be included in the Discord embeds
- **AND** the last embed SHALL include a field noting "還有 5 筆未顯示，請縮小關鍵字範圍"

#### Scenario: Batch within cap

- **WHEN** sendDiscordBatchNotification is called with 8 items and MAX_NOTIFY_PER_BATCH is 10
- **THEN** all 8 items SHALL be included with no omission note

<!-- @trace
source: notification-reliability
updated: 2026-04-01
code:
  - webapp/app/api/worker/keywords/route.ts
  - src/api_client.py
  - webapp/prisma/schema.prisma
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/app/api/history/route.ts
  - webapp/components/NotificationForm.tsx
  - .github/workflows/cleanup.yml
  - src/watchers/base.py
  - webapp/app/dashboard/layout.tsx
  - webapp/app/history/page.tsx
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
  - webapp/components/KeywordForm.tsx
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/lib/email.ts
  - src/scheduler.py
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - webapp/app/settings/page.tsx
  - src/scrapers/ruten.py
  - webapp/lib/discord.ts
  - webapp/scripts/cleanup.ts
  - webapp/app/api/worker/scan-log/route.ts
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/package.json
  - src/scrapers/shopee.py
-->