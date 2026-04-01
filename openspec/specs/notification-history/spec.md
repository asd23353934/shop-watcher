# notification-history Specification

## Purpose

TBD - created by archiving change 'dashboard-observability'. Update Purpose after archive.

## Requirements

### Requirement: User can view notification history

The system SHALL provide a notification history page at /history listing the most recent notified items for the authenticated user.

#### Scenario: History page lists recent notified items

- **WHEN** an authenticated user navigates to /history
- **THEN** the page SHALL display a list of SeenItem rows belonging to that user
- **AND** each row SHALL show: keyword, platform label, item ID, and firstSeen timestamp
- **AND** results SHALL be sorted by firstSeen descending (newest first)
- **AND** at most 50 items SHALL be shown per page

#### Scenario: Empty history shows placeholder

- **WHEN** an authenticated user has no SeenItem rows
- **THEN** the history page SHALL display a message indicating no notifications have been sent yet

<!-- @trace
source: dashboard-observability
updated: 2026-04-01
code:
  - webapp/app/api/history/route.ts
  - src/scrapers/ruten.py
  - webapp/app/dashboard/page.tsx
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - webapp/prisma/schema.prisma
  - webapp/app/api/keywords/route.ts
  - webapp/app/api/worker/keywords/route.ts
  - src/api_client.py
  - src/scheduler.py
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/lib/discord.ts
  - src/scrapers/shopee.py
  - webapp/package.json
  - webapp/scripts/cleanup.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/test-webhook/route.ts
  - .github/workflows/cleanup.yml
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/dashboard/layout.tsx
  - src/watchers/base.py
  - webapp/app/settings/page.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/lib/email.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
  - webapp/app/api/worker/scan-log/route.ts
-->