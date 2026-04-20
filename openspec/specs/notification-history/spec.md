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

---
### Requirement: GET /api/history responds with cache headers

The API SHALL include a `Cache-Control: private, stale-while-revalidate=60` response header on all successful GET requests. This allows the browser to serve a stale response immediately while revalidating in the background, reducing duplicate TTFB on repeated navigation.

#### Scenario: History API returns cache header

- **WHEN** an authenticated user calls `GET /api/history`
- **THEN** the response SHALL include `Cache-Control: private, stale-while-revalidate=60`
- **AND** the response body SHALL be unchanged from current behavior


<!-- @trace
source: perf-optimization
updated: 2026-04-13
code:
  - webapp/app/api/circles/route.ts
  - webapp/prisma/migrations/20260413035933_add_perf_indexes_v2/migration.sql
  - webapp/app/api/history/route.ts
  - webapp/lib/utils.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/schema.prisma
  - webapp/prisma/migrations/20260413035653_add_perf_indexes/migration.sql
-->

---
### Requirement: SeenItem platform filter query uses index

The database SHALL have a composite index on `SeenItem(userId, platform, firstSeen DESC)` to support efficient filtering when a user queries history by platform.

#### Scenario: Platform-filtered history query uses index

- **WHEN** `GET /api/history?platform=booth` is called
- **THEN** the query SHALL resolve via the `(userId, platform, firstSeen)` index without a full table scan
- **AND** response time SHALL be under 500ms for tables with up to 100,000 SeenItem rows

<!-- @trace
source: perf-optimization
updated: 2026-04-13
code:
  - webapp/app/api/circles/route.ts
  - webapp/prisma/migrations/20260413035933_add_perf_indexes_v2/migration.sql
  - webapp/app/api/history/route.ts
  - webapp/lib/utils.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/schema.prisma
  - webapp/prisma/migrations/20260413035653_add_perf_indexes/migration.sql
-->

---
### Requirement: History API cursor parameter is validated as CUID format

The `GET /api/history` endpoint SHALL validate the `cursor` query parameter when present. A valid cursor MUST match the pattern `/^c[a-z0-9]{24}$/` (CUID format used by Prisma). If the cursor fails validation, the API SHALL return HTTP 400 and SHALL NOT forward the malformed value to Prisma.

#### Scenario: Valid CUID cursor is accepted

- **WHEN** `GET /api/history?cursor=cld3h2v8f0000qw4k3j5m8n9p` is called (cursor matches CUID pattern)
- **THEN** the API SHALL accept the cursor and return the next page of results

#### Scenario: Malformed cursor is rejected with 400

- **WHEN** `GET /api/history?cursor=../../etc/passwd` is called
- **THEN** the API SHALL return HTTP 400 with `{ "error": "無效的 cursor 格式" }`
- **AND** no Prisma query SHALL be executed with that cursor value

#### Scenario: Empty cursor query parameter behaves as no cursor

- **WHEN** `GET /api/history?cursor=` is called with an empty string
- **THEN** the API SHALL treat it as if no cursor was provided
- **AND** return the first page of results

<!-- @trace
source: fix-security-vulnerabilities
updated: 2026-04-20
code:
  - webapp/components/ui/card.tsx
  - webapp/app/status/page.tsx
  - webapp/app/api/settings/test-email/route.ts
  - webapp/app/settings/page.tsx
  - webapp/components/KeywordList.tsx
  - src/scrapers/toranoana.py
  - src/scheduler.py
  - webapp/app/api/keywords/[id]/blocklist/route.ts
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/app/settings/loading.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/components/NotificationStatus.tsx
  - webapp/prisma/migrations/20260420022937_add_tag_rules/migration.sql
  - src/scrapers/myacg.py
  - webapp/lib/utils.ts
  - webapp/components/DashboardStats.tsx
  - webapp/app/circles/page.tsx
  - webapp/components/KeywordClientSection.tsx
  - webapp/app/api/platform-status/route.ts
  - webapp/components/theme-provider.tsx
  - src/scrapers/dlsite.py
  - webapp/app/history/page.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/components/policy-section.tsx
  - webapp/components/KeywordForm.tsx
  - .github/workflows/ci.yml
  - webapp/app/globals.css
  - webapp/app/api/history/route.ts
  - webapp/app/login/page.tsx
  - .github/workflows/cleanup.yml
  - webapp/lib/keyword-validation.ts
  - webapp/vercel.json
  - webapp/prisma/migrations/20260420030000_remove_tag_system/migration.sql
  - webapp/app/dashboard/layout.tsx
  - webapp/app/circles/layout.tsx
  - src/scrapers/ruten.py
  - webapp/app/status/layout.tsx
  - src/scrapers/_dom_signal.py
  - webapp/app/dashboard/page.tsx
  - webapp/app/keywords/new/layout.tsx
  - webapp/lib/email.ts
  - webapp/lib/webhook-validation.ts
  - .github/workflows/warmup.yml
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/api/circles/route.ts
  - webapp/next.config.ts
  - src/scrapers/yahoo_auction.py
  - webapp/components/PlatformScanHealthSection.tsx
  - webapp/app/terms/page.tsx
  - webapp/prisma/migrations/20260420014921_add_tags/migration.sql
  - webapp/components/ChartsRow.tsx
  - webapp/app/api/circles/[id]/route.ts
  - src/scrapers/animate.py
  - src/watchers/base.py
  - webapp/components/CircleFollowForm.tsx
  - src/canary.py
  - src/scrapers/pchome.py
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/api/settings/route.ts
  - webapp/app/api/worker/canary-status/route.ts
  - webapp/prisma/migrations/20260414000000_replace_email_address_with_email_enabled/migration.sql
  - src/scrapers/mandarake.py
  - CLAUDE.md
  - webapp/app/dashboard/loading.tsx
  - webapp/package.json
  - webapp/app/privacy/page.tsx
  - src/scrapers/momo.py
  - src/scrapers/shopee.py
  - webapp/app/history/layout.tsx
  - webapp/app/circles/loading.tsx
  - .github/workflows/worker.yml
  - webapp/components/ScanLogSection.tsx
  - src/scrapers/_price_utils.py
  - webapp/app/keywords/new/page.tsx
  - webapp/components/DashboardCharts.tsx
  - webapp/app/history/loading.tsx
  - webapp/app/layout.tsx
  - webapp/lib/discord.ts
  - webapp/app/api/worker/notify/route.ts
  - webapp/components/Navbar.tsx
  - webapp/components/PlatformScanHealthBadge.tsx
  - webapp/auth.ts
  - webapp/prisma/migrations/20260416000000_add_active_userid_indexes/migration.sql
  - webapp/prisma/schema.prisma
  - README.md
  - src/scrapers/kingstone.py
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/constants/platform.ts
  - src/scrapers/booth.py
  - webapp/app/api/worker/platform-status/route.ts
  - webapp/app/settings/layout.tsx
  - src/scrapers/melonbooks.py
  - webapp/components/NotificationForm.tsx
  - src/watchers/shopee.py
  - webapp/prisma/migrations/20260417000000_add_platform_canary_status/migration.sql
  - src/api_client.py
  - webapp/components/KeywordSection.tsx
-->

---
### Requirement: History API supports title search via q parameter

The system SHALL accept an optional `q` query parameter on `GET /api/history`. The parameter value SHALL be URL-decoded, trimmed, and split on any Unicode whitespace (including full-width U+3000) into individual tokens. Each token SHALL be applied as a case-insensitive substring match against the `itemName` column. Multiple tokens SHALL be combined with AND semantics: a SeenItem row matches only if every token appears in its `itemName`. Empty `q`, whitespace-only `q`, or absence of the parameter SHALL behave identically to a request without `q` (no title filter applied). Rows with `itemName: null` SHALL NOT match any non-empty `q`.

#### Scenario: Single-term search filters by substring

- **WHEN** an authenticated user calls `GET /api/history?q=%E5%85%AC%E4%BB%94` (URL-encoded `公仔`)
- **THEN** only SeenItem rows whose `itemName` contains `公仔` (case-insensitive) SHALL be returned
- **AND** pagination, keyword filter, and platform filter SHALL continue to apply

#### Scenario: Multi-term search uses AND semantics

- **WHEN** a user calls `GET /api/history?q=%E6%AA%94%E6%A1%88%20%E5%85%AC%E4%BB%94` (URL-encoded `檔案 公仔`)
- **THEN** only SeenItem rows whose `itemName` contains both `檔案` and `公仔` SHALL be returned
- **AND** order of tokens in `q` SHALL NOT affect results

#### Scenario: Case-insensitive matching

- **WHEN** a user calls `GET /api/history?q=Figma`
- **THEN** rows containing `figma`, `FIGMA`, or `Figma` in `itemName` SHALL all match

#### Scenario: Empty or whitespace q is treated as no filter

- **WHEN** a user calls `GET /api/history?q=` or `GET /api/history?q=%20%20` (URL-encoded spaces)
- **THEN** the response SHALL be identical to a request omitting `q`

#### Scenario: Rows with null itemName never match non-empty q

- **WHEN** a SeenItem row has `itemName: null`
- **AND** the request includes `q=anything`
- **THEN** that row SHALL be excluded from the results


<!-- @trace
source: remove-tag-system-use-search
updated: 2026-04-20
code:
  - webapp/components/KeywordClientSection.tsx
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/TagManager.tsx
  - webapp/types/tag.ts
  - webapp/app/settings/page.tsx
  - webapp/app/api/circles/route.ts
  - webapp/lib/hooks/useTags.ts
  - webapp/types/keyword.ts
  - webapp/lib/system-tag-rules.ts
  - webapp/app/api/tags/route.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/history/route.ts
  - webapp/app/api/tags/[id]/route.ts
  - webapp/types/tagRule.ts
  - webapp/app/api/circles/[id]/route.ts
  - webapp/components/KeywordList.tsx
  - webapp/components/CircleFollowForm.tsx
  - webapp/components/TagChip.tsx
  - CLAUDE.md
  - webapp/components/TagSelector.tsx
  - webapp/lib/auto-tag.ts
  - webapp/prisma/migrations/20260420030000_remove_tag_system/migration.sql
  - webapp/app/api/tag-rules/[id]/route.ts
  - webapp/app/api/tag-rules/route.ts
  - webapp/prisma/schema.prisma
  - README.md
  - webapp/components/KeywordForm.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/app/circles/page.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/components/TagRuleManager.tsx
  - webapp/components/TagFilterBar.tsx
  - webapp/lib/tag-validation.ts
-->

---
### Requirement: History page provides title search input

The `/history` page SHALL render a text input control in the filter bar labelled `搜尋商品名稱`. Typing into the input SHALL debounce by 300ms, after which the page SHALL re-issue `GET /api/history` with the current value as the `q` parameter. Clearing the input SHALL immediately re-issue the request without the `q` parameter (restoring the unfiltered view). The input value SHALL reset to empty on page reload and on manual navigation away and back.

#### Scenario: Typing triggers debounced search

- **WHEN** the user types `檔案 公仔` into the search input
- **THEN** the page SHALL wait 300ms after the last keystroke
- **AND** then issue `GET /api/history?q=%E6%AA%94%E6%A1%88%20%E5%85%AC%E4%BB%94` (additional filters appended as before)
- **AND** the item list SHALL refresh with the response
- **AND** pagination state SHALL reset (first page loaded)

#### Scenario: Clearing the input restores unfiltered view

- **WHEN** the user deletes all characters from the search input
- **THEN** the page SHALL immediately (without waiting 300ms) issue `GET /api/history` without `q`
- **AND** all items matching other filters SHALL be shown

#### Scenario: Search coexists with keyword and platform filters

- **WHEN** the user has `platform=booth` selected and types `公仔` into the search input
- **THEN** after debounce the request SHALL include both `platform=booth` and `q=%E5%85%AC%E4%BB%94`
- **AND** only rows matching both filters SHALL be returned

<!-- @trace
source: remove-tag-system-use-search
updated: 2026-04-20
code:
  - webapp/components/KeywordClientSection.tsx
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/TagManager.tsx
  - webapp/types/tag.ts
  - webapp/app/settings/page.tsx
  - webapp/app/api/circles/route.ts
  - webapp/lib/hooks/useTags.ts
  - webapp/types/keyword.ts
  - webapp/lib/system-tag-rules.ts
  - webapp/app/api/tags/route.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/history/route.ts
  - webapp/app/api/tags/[id]/route.ts
  - webapp/types/tagRule.ts
  - webapp/app/api/circles/[id]/route.ts
  - webapp/components/KeywordList.tsx
  - webapp/components/CircleFollowForm.tsx
  - webapp/components/TagChip.tsx
  - CLAUDE.md
  - webapp/components/TagSelector.tsx
  - webapp/lib/auto-tag.ts
  - webapp/prisma/migrations/20260420030000_remove_tag_system/migration.sql
  - webapp/app/api/tag-rules/[id]/route.ts
  - webapp/app/api/tag-rules/route.ts
  - webapp/prisma/schema.prisma
  - README.md
  - webapp/components/KeywordForm.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/app/circles/page.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/components/TagRuleManager.tsx
  - webapp/components/TagFilterBar.tsx
  - webapp/lib/tag-validation.ts
-->