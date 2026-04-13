# notification-history Specification

## Purpose

TBD - created by archiving change 'dashboard-observability'. Update Purpose after archive.

## Requirements

### Requirement: User can view notification history

The system SHALL provide a notification history page at /history listing notified items for the authenticated user. Each row SHALL show: keyword, platform label, item name (linked to item URL if available, otherwise item ID), and firstSeen timestamp. Results SHALL be sorted by firstSeen descending. The page SHALL support cursor-based pagination showing 50 items per page with a "載入更多" button. When no more items exist, the button SHALL be hidden.

#### Scenario: History page lists notified items with item name and link

- **WHEN** an authenticated user navigates to /history
- **AND** SeenItem rows have `itemName` and `itemUrl` populated
- **THEN** each row SHALL display the item name as a clickable link to `itemUrl`
- **AND** results SHALL be sorted by firstSeen descending (newest first)
- **AND** at most 50 items SHALL be shown on the initial load

#### Scenario: History row shows item ID fallback when itemName is null

- **WHEN** a SeenItem row has `itemName: null` (legacy record before this change)
- **THEN** the history row SHALL display the `itemId` string instead of a name
- **AND** no link SHALL be shown if `itemUrl` is also null

#### Scenario: History supports filtering by keyword

- **WHEN** a user selects a keyword filter from the filter dropdown on /history
- **THEN** only SeenItem rows matching that `keywordId` SHALL be displayed
- **AND** the count in the filter label SHALL update to reflect the filtered results

#### Scenario: History supports filtering by platform

- **WHEN** a user selects a platform filter (e.g., "露天") from the filter dropdown
- **THEN** only SeenItem rows with `platform: "ruten"` SHALL be displayed

#### Scenario: History pagination loads next 50 items

- **WHEN** the initial history page shows 50 items
- **AND** the user clicks "載入更多"
- **THEN** the next 50 SeenItem rows SHALL be appended to the list (cursor-based, using last item's `id`)
- **AND** if fewer than 50 items are returned, the "載入更多" button SHALL be hidden

#### Scenario: Empty history shows EmptyState component

- **WHEN** an authenticated user has no SeenItem rows
- **THEN** the history page SHALL display the `EmptyState` component
- **AND** the heading SHALL read "尚無通知紀錄"
- **AND** the subtitle SHALL read "當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
- **AND** no table or list element SHALL be rendered


<!-- @trace
source: enhance-monitoring-conditions
updated: 2026-04-13
code:
  - webapp/components/KeywordClientSection.tsx
  - webapp/prisma/migrations/20260407072920_enhance_monitoring_conditions/migration.sql
  - webapp/app/layout.tsx
  - webapp/app/circles/page.tsx
  - requirements.txt
  - webapp/app/api/circles/[id]/route.ts
  - src/scrapers/dlsite.py
  - .github/workflows/worker.yml
  - src/scrapers/ruten.py
  - webapp/constants/platform.ts
  - webapp/components/NotificationForm.tsx
  - src/scrapers/booth.py
  - webapp/app/api/circles/route.ts
  - webapp/components/PlatformScanHealthBadge.tsx
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/route.ts
  - CLAUDE.md
  - webapp/app/dashboard/page.tsx
  - webapp/components/CircleFollowForm.tsx
  - webapp/scripts/test-batch-api.mjs
  - src/scrapers/melonbooks.py
  - webapp/components/DashboardStats.tsx
  - src/watchers/base.py
  - webapp/lib/discord.ts
  - webapp/prisma/schema.prisma
  - webapp/components/KeywordList.tsx
  - webapp/components/Navbar.tsx
  - webapp/prisma/migrations/20260407070500_worker_scalability/migration.sql
  - README.md
  - webapp/app/api/history/route.ts
  - webapp/app/keywords/new/page.tsx
  - src/scrapers/pchome.py
  - webapp/app/robots.ts
  - webapp/app/api/worker/platform-status/route.ts
  - webapp/components/KeywordCard.tsx
  - src/api_client.py
  - webapp/app/api/platform-status/route.ts
  - webapp/app/status/page.tsx
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/api/worker/circles/route.ts
  - src/scrapers/myacg.py
  - webapp/app/circles/layout.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/types/keyword.ts
  - webapp/app/api/keywords/route.ts
  - src/scrapers/toranoana.py
  - docs/index.html
  - webapp/app/sitemap.ts
  - webapp/app/keywords/new/layout.tsx
  - src/scheduler.py
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/PlatformScanHealthSection.tsx
  - src/scrapers/yahoo_auction.py
  - webapp/app/status/layout.tsx
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