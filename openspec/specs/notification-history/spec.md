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

---
### Requirement: History page shows a quick-add-to-blocklist action per notification

Each notification record on the /history page SHALL display a "加入禁詞" button. When the associated keyword still exists (`keywordId` is non-null), the button SHALL be interactive. When `keywordId` is null (keyword deleted), the button SHALL be disabled with a tooltip explaining why.

#### Scenario: User adds a word to blocklist from history item

- **WHEN** an authenticated user clicks "加入禁詞" on a history record that has a non-null `keywordId`
- **THEN** an inline input field SHALL appear for the user to type a custom word
- **AND** on submit (Enter or button click), `PATCH /api/keywords/{keywordId}/blocklist` SHALL be called
- **AND** on success, a confirmation indicator SHALL be shown inline
- **AND** on failure (e.g., HTTP 403), an error message SHALL be shown

#### Scenario: Feedback button is disabled for orphaned history items

- **WHEN** a history record has `keywordId: null` because the keyword was deleted
- **THEN** the "加入禁詞" button SHALL be rendered disabled
- **AND** hovering the button SHALL show the tooltip text "關鍵字已刪除"

<!-- @trace
source: smart-item-filtering
updated: 2026-04-01
code:
  - webapp/components/KeywordList.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/prisma/schema.prisma
  - webapp/app/api/keywords/[id]/route.ts
  - src/scrapers/ruten.py
  - webapp/lib/email.ts
  - webapp/components/HistoryFeedbackButton.tsx
  - webapp/app/api/keywords/[id]/blocklist/route.ts
  - webapp/app/history/page.tsx
  - webapp/prisma/migrations/20260401033929_add_keyword_must_include_match_mode/migration.sql
  - webapp/app/api/keywords/route.ts
  - src/watchers/base.py
  - webapp/lib/discord.ts
  - webapp/app/api/worker/notify/batch/route.ts
  - src/scrapers/shopee.py
  - src/api_client.py
  - src/scheduler.py
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
-->