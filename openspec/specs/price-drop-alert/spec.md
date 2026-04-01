# price-drop-alert Specification

## Purpose

TBD - created by archiving change 'price-drop-alert'. Update Purpose after archive.

## Requirements

### Requirement: Price drop on a known item triggers a re-notification

The system SHALL re-notify the user when a previously seen item's current price is lower than its last recorded price in SeenItem.

#### Scenario: Price drop detected triggers notification

- **WHEN** POST /api/worker/notify/batch receives an item whose (userId, platform, itemId) already exists in SeenItem
- **AND** the new price is non-null AND lower than SeenItem.lastPrice
- **THEN** the SeenItem.lastPrice SHALL be updated to the new price
- **AND** the item SHALL be included in the Discord and Email notification as a price drop
- **AND** the Discord embed title SHALL be prefixed with "[降價]" and color SHALL be 0x57F287
- **AND** the embed SHALL include fields showing original price and new price

#### Scenario: Duplicate item with no price change is not re-notified

- **WHEN** POST /api/worker/notify/batch receives an item that already exists in SeenItem
- **AND** the new price equals or exceeds SeenItem.lastPrice, or both prices are null
- **THEN** the item SHALL be treated as a duplicate and SHALL NOT trigger a notification

#### Scenario: Item with null price does not trigger price drop

- **WHEN** an item has null price
- **THEN** no price drop comparison SHALL be performed for that item
- **AND** the item SHALL be treated as a duplicate if it already exists in SeenItem

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