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

#### Scenario: Empty history shows EmptyState component

- **WHEN** an authenticated user has no SeenItem rows
- **THEN** the history page SHALL display the `EmptyState` component
- **AND** the heading SHALL read "尚無通知紀錄"
- **AND** the subtitle SHALL read "當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
- **AND** no table or list element SHALL be rendered


<!-- @trace
source: improve-webapp-ux
updated: 2026-04-02
code:
  - webapp/components/KeywordSection.tsx
  - webapp/components/ui/alert-dialog.tsx
  - webapp/components/ui/button.tsx
  - webapp/components.json
  - webapp/types/keyword.ts
  - webapp/components/ui/switch.tsx
  - webapp/app/layout.tsx
  - webapp/app/settings/page.tsx
  - webapp/components/EmptyState.tsx
  - webapp/components/KeywordClientSection.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/components/NotificationForm.tsx
  - webapp/components/ui/skeleton.tsx
  - webapp/app/history/page.tsx
  - .github/workflows/worker.yml
  - webapp/package.json
  - webapp/app/settings/layout.tsx
  - webapp/components/ScanLogSection.tsx
  - webapp/components/ui/sonner.tsx
  - webapp/constants/platform.ts
  - webapp/components/KeywordFormWrapper.tsx
  - webapp/components/ui/badge.tsx
  - webapp/components/DashboardStats.tsx
  - webapp/constants/matchMode.ts
  - webapp/components/KeywordList.tsx
  - webapp/actions/auth.ts
  - webapp/lib/utils.ts
  - webapp/app/dashboard/layout.tsx
  - webapp/app/history/layout.tsx
  - webapp/components/Navbar.tsx
  - webapp/components/ui/SkeletonCard.tsx
  - webapp/components/NotificationStatus.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/app/globals.css
  - webapp/app/dashboard/page.tsx
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