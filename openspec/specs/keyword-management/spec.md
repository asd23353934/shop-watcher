# keyword-management Specification

## Purpose

TBD - created by archiving change 'saas-webapp'. Update Purpose after archive.

## Requirements

### Requirement: Authenticated user can create a keyword

The system SHALL allow an authenticated user to create a new keyword with platform selection, optional price range, and active status. After a successful creation, the keyword list SHALL be updated without requiring a full page reload. The new keyword SHALL appear in the list immediately upon successful API response, by merging it into local client state, without triggering a full server re-render or `router.refresh()`.

#### Scenario: User creates a keyword with required fields

- **WHEN** a user submits the keyword creation form with a non-empty `keyword` string and at least one platform selected (`shopee` or `ruten`)
- **THEN** a `Keyword` row SHALL be created in the database with `userId` set to the authenticated user's ID
- **AND** `active` SHALL default to `true`
- **AND** the keyword list SHALL immediately display the new keyword by updating local client state
- **AND** no full page reload or `router.refresh()` SHALL occur

#### Scenario: Keyword creation with price range

- **WHEN** a user submits a keyword with `minPrice: 1000` and `maxPrice: 5000`
- **THEN** the `Keyword` row SHALL store `minPrice: 1000` and `maxPrice: 5000`
- **AND** the Worker SHALL receive these values in `GET /api/worker/keywords` response

#### Scenario: Keyword creation with empty keyword string is rejected

- **WHEN** a user submits the form with an empty `keyword` field
- **THEN** the system SHALL return a validation error
- **AND** no `Keyword` row SHALL be created

#### Scenario: Keyword creation with no platform selected is rejected

- **WHEN** a user submits the form without selecting any platform
- **THEN** the system SHALL return a validation error
- **AND** no `Keyword` row SHALL be created


<!-- @trace
source: fix-webapp-performance
updated: 2026-04-02
code:
  - webapp/app/dashboard/page.tsx
  - webapp/actions/auth.ts
  - webapp/components/NotificationStatus.tsx
  - webapp/components/ui/sonner.tsx
  - webapp/components/DashboardStats.tsx
  - webapp/app/layout.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/app/globals.css
  - webapp/components/ui/skeleton.tsx
  - webapp/components/ui/SkeletonCard.tsx
  - webapp/constants/matchMode.ts
  - webapp/package.json
  - webapp/types/keyword.ts
  - webapp/app/dashboard/layout.tsx
  - webapp/components/NotificationForm.tsx
  - webapp/components/ui/badge.tsx
  - webapp/lib/utils.ts
  - webapp/components/KeywordClientSection.tsx
  - webapp/components/ui/alert-dialog.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/app/history/layout.tsx
  - .github/workflows/worker.yml
  - webapp/app/settings/layout.tsx
  - webapp/components/EmptyState.tsx
  - webapp/components/Navbar.tsx
  - webapp/components/ScanLogSection.tsx
  - webapp/app/settings/page.tsx
  - webapp/components.json
  - webapp/components/KeywordFormWrapper.tsx
  - webapp/components/ui/button.tsx
  - webapp/components/KeywordSection.tsx
  - webapp/app/history/page.tsx
  - webapp/constants/platform.ts
  - webapp/components/KeywordList.tsx
  - webapp/components/ui/switch.tsx
-->

---
### Requirement: Authenticated user can edit an existing keyword

The system SHALL allow a user to update any field of a keyword they own. On success, the system SHALL display a `success` Toast notification with the message "關鍵字已更新". On failure, the system SHALL display an `error` Toast.

#### Scenario: User updates keyword text

- **WHEN** a user submits an edit form for their own keyword with a new `keyword` string
- **THEN** the `Keyword` row SHALL be updated in the database
- **AND** the updated value SHALL appear in the keyword list
- **AND** a `success` Toast SHALL appear with the message "關鍵字已更新"

#### Scenario: User cannot edit another user's keyword

- **WHEN** a user attempts to update a `Keyword` row that belongs to a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain unchanged
- **AND** an `error` Toast SHALL appear with an appropriate error message


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
### Requirement: Authenticated user can delete a keyword

The system SHALL allow a user to permanently delete a keyword they own. The deletion SHALL apply optimistically: the keyword SHALL be removed from the UI immediately upon user confirmation, without waiting for the API response. If the API call fails, the keyword SHALL reappear in the list.

#### Scenario: User deletes their own keyword

- **WHEN** a user confirms deletion of a keyword they own
- **THEN** the keyword SHALL immediately disappear from the list in the UI
- **AND** the `Keyword` row SHALL be deleted from the database upon API success
- **AND** the associated `SeenItem` rows SHALL NOT be deleted (historical record preserved)

#### Scenario: Deletion fails and keyword reappears

- **WHEN** a user confirms deletion of a keyword
- **AND** the DELETE API call returns a non-2xx response or network error
- **THEN** the keyword SHALL reappear in the list at its original position
- **AND** an error indicator SHALL be shown to the user

#### Scenario: User cannot delete another user's keyword

- **WHEN** a user attempts to delete a `Keyword` row with a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain in the database


<!-- @trace
source: fix-webapp-performance
updated: 2026-04-02
code:
  - webapp/app/dashboard/page.tsx
  - webapp/actions/auth.ts
  - webapp/components/NotificationStatus.tsx
  - webapp/components/ui/sonner.tsx
  - webapp/components/DashboardStats.tsx
  - webapp/app/layout.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/app/globals.css
  - webapp/components/ui/skeleton.tsx
  - webapp/components/ui/SkeletonCard.tsx
  - webapp/constants/matchMode.ts
  - webapp/package.json
  - webapp/types/keyword.ts
  - webapp/app/dashboard/layout.tsx
  - webapp/components/NotificationForm.tsx
  - webapp/components/ui/badge.tsx
  - webapp/lib/utils.ts
  - webapp/components/KeywordClientSection.tsx
  - webapp/components/ui/alert-dialog.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/app/history/layout.tsx
  - .github/workflows/worker.yml
  - webapp/app/settings/layout.tsx
  - webapp/components/EmptyState.tsx
  - webapp/components/Navbar.tsx
  - webapp/components/ScanLogSection.tsx
  - webapp/app/settings/page.tsx
  - webapp/components.json
  - webapp/components/KeywordFormWrapper.tsx
  - webapp/components/ui/button.tsx
  - webapp/components/KeywordSection.tsx
  - webapp/app/history/page.tsx
  - webapp/constants/platform.ts
  - webapp/components/KeywordList.tsx
  - webapp/components/ui/switch.tsx
-->

---
### Requirement: User's keyword list shows only their own keywords

The system SHALL ensure each user sees only their own keywords in the dashboard.

#### Scenario: Dashboard lists only the authenticated user's keywords

- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** only `Keyword` rows where `userId` matches the session user's ID SHALL be displayed
- **AND** keywords belonging to other users SHALL NOT appear in the list

#### Scenario: Empty keyword list shows a call-to-action

- **WHEN** an authenticated user has no keywords
- **THEN** the dashboard SHALL display a prompt to add the first keyword
- **AND** no error SHALL be shown


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
### Requirement: User can toggle a keyword's active status

The system SHALL allow a user to enable or disable a keyword without deleting it. The toggle SHALL apply optimistically: the UI SHALL reflect the new state immediately upon user interaction, without waiting for the API response. If the API call fails, the UI SHALL revert to the previous state.

#### Scenario: User deactivates a keyword

- **WHEN** a user toggles a keyword's active switch to off
- **THEN** the keyword card SHALL immediately display as inactive (grey badge) in the UI
- **AND** the `Keyword.active` field SHALL be set to `false` in the database upon API success
- **AND** the keyword SHALL NOT appear in the `GET /api/worker/keywords` response after the update

#### Scenario: User reactivates a keyword

- **WHEN** a user toggles a keyword's active switch to on
- **THEN** the keyword card SHALL immediately display as active (green badge) in the UI
- **AND** the `Keyword.active` field SHALL be set to `true` in the database upon API success
- **AND** the keyword SHALL appear in the next `GET /api/worker/keywords` response

#### Scenario: Toggle fails and UI reverts

- **WHEN** a user toggles a keyword's active switch
- **AND** the PATCH API call returns a non-2xx response or network error
- **THEN** the keyword card SHALL revert to its previous active state in the UI
- **AND** an error indicator SHALL be shown to the user


<!-- @trace
source: fix-webapp-performance
updated: 2026-04-02
code:
  - webapp/app/dashboard/page.tsx
  - webapp/actions/auth.ts
  - webapp/components/NotificationStatus.tsx
  - webapp/components/ui/sonner.tsx
  - webapp/components/DashboardStats.tsx
  - webapp/app/layout.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/app/globals.css
  - webapp/components/ui/skeleton.tsx
  - webapp/components/ui/SkeletonCard.tsx
  - webapp/constants/matchMode.ts
  - webapp/package.json
  - webapp/types/keyword.ts
  - webapp/app/dashboard/layout.tsx
  - webapp/components/NotificationForm.tsx
  - webapp/components/ui/badge.tsx
  - webapp/lib/utils.ts
  - webapp/components/KeywordClientSection.tsx
  - webapp/components/ui/alert-dialog.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/app/history/layout.tsx
  - .github/workflows/worker.yml
  - webapp/app/settings/layout.tsx
  - webapp/components/EmptyState.tsx
  - webapp/components/Navbar.tsx
  - webapp/components/ScanLogSection.tsx
  - webapp/app/settings/page.tsx
  - webapp/components.json
  - webapp/components/KeywordFormWrapper.tsx
  - webapp/components/ui/button.tsx
  - webapp/components/KeywordSection.tsx
  - webapp/app/history/page.tsx
  - webapp/constants/platform.ts
  - webapp/components/KeywordList.tsx
  - webapp/components/ui/switch.tsx
-->

---
### Requirement: Duplicate keyword creation is rejected for the same user

The system SHALL prevent a user from creating a keyword with the same `keyword` text and identical `platforms` array as an existing keyword owned by that user. Different users MAY have keywords with identical text and platforms.

#### Scenario: User attempts to create a duplicate keyword

- **WHEN** a user submits a keyword creation form with a `keyword` and `platforms` combination that already exists for that user
- **THEN** the API SHALL return HTTP 409 Conflict
- **AND** no new `Keyword` row SHALL be created in the database
- **AND** the response body SHALL include an error message indicating the keyword already exists

#### Scenario: User creates a keyword that another user already has

- **WHEN** User A submits a keyword that User B already has with the same text and platforms
- **THEN** the API SHALL return HTTP 201 Created
- **AND** a new `Keyword` row SHALL be created for User A

#### Scenario: Same keyword text with different platforms is allowed

- **WHEN** a user submits a keyword with text "藍藍檔案" and platforms `["shopee"]`
- **AND** that user already has a keyword with text "藍藍檔案" and platforms `["shopee", "ruten"]`
- **THEN** the API SHALL return HTTP 201 Created
- **AND** a new `Keyword` row SHALL be created


<!-- @trace
source: keyword-ux-improvements
updated: 2026-04-01
code:
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/components/NotificationBanner.tsx
-->

---
### Requirement: Keyword supports a blocklist of forbidden terms

Each keyword SHALL support a `blocklist` field containing zero or more forbidden terms. Items whose names contain any term from the blocklist SHALL NOT be reported to the user, regardless of keyword match. The blocklist SHALL be manageable via tag-style add/delete UI (one word at a time), and also via `PATCH /api/keywords/[id]/blocklist` for single-word append.

#### Scenario: Keyword is created with a blocklist

- **WHEN** a user submits the keyword creation form with one or more blocklist terms added via tag input
- **THEN** the `Keyword` row SHALL be created with `blocklist` set to the array of entered terms
- **AND** the blocklist SHALL be stored as `String[]` in the database

#### Scenario: Keyword is created without a blocklist

- **WHEN** a user submits the keyword creation form without entering any blocklist terms
- **THEN** the `Keyword` row SHALL be created with `blocklist` set to an empty array `[]`

#### Scenario: Keyword blocklist is updated

- **WHEN** a user edits an existing keyword and adds or removes blocklist tags
- **THEN** the `Keyword.blocklist` SHALL be updated to reflect the new set of terms

#### Scenario: Single word is appended to blocklist via dedicated endpoint

- **WHEN** a user calls `PATCH /api/keywords/{id}/blocklist` with `{ "word": "整組" }`
- **THEN** `"整組"` SHALL be appended to `Keyword.blocklist` if not already present
- **AND** the updated keyword's blocklist SHALL be available on the next `GET /api/worker/keywords` call


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
### Requirement: Keyword creation accepts mustInclude and matchMode fields

The system SHALL accept `mustInclude` (string array, default `[]`) and `matchMode` (string enum `"any"` | `"all"` | `"exact"`, default `"any"`) in the keyword creation request body (`POST /api/keywords`). Both fields SHALL be stored in the database.

#### Scenario: Keyword created with mustInclude and matchMode

- **WHEN** a user submits `POST /api/keywords` with `{ keyword: "機械鍵盤", platforms: ["shopee"], mustInclude: ["茶軸"], matchMode: "all" }`
- **THEN** the `Keyword` row SHALL be created with `mustInclude: ["茶軸"]` and `matchMode: "all"`

#### Scenario: Keyword created without mustInclude and matchMode uses defaults

- **WHEN** a user submits `POST /api/keywords` without `mustInclude` or `matchMode` fields
- **THEN** the `Keyword` row SHALL be created with `mustInclude: []` and `matchMode: "any"`

#### Scenario: matchMode with an invalid value is rejected

- **WHEN** a user submits `POST /api/keywords` with `matchMode: "fuzzy"` (not in `["any", "all", "exact"]`)
- **THEN** the API SHALL return HTTP 400
- **AND** no `Keyword` row SHALL be created


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
### Requirement: Keyword edit accepts mustInclude and matchMode fields

The system SHALL accept `mustInclude` and `matchMode` in `PATCH /api/keywords/[id]` and update both fields in the database.

#### Scenario: User updates mustInclude via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "mustInclude": ["原廠", "全新"] }`
- **THEN** `Keyword.mustInclude` SHALL be updated to `["原廠", "全新"]`
- **AND** the response SHALL include the updated keyword with `mustInclude: ["原廠", "全新"]`

#### Scenario: User updates matchMode via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "matchMode": "exact" }`
- **THEN** `Keyword.matchMode` SHALL be updated to `"exact"`

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
### Requirement: Dashboard displays statistics summary block

The system SHALL display a statistics block at the top of the Dashboard showing the total number of active keywords and the count of notifications sent today.

#### Scenario: Statistics block shows keyword count

- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the statistics block SHALL display the total number of keywords owned by that user
- **AND** the label SHALL read "監控關鍵字"

#### Scenario: Statistics block shows today's notification count

- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the statistics block SHALL display the count of SeenItem rows created today (UTC+8) for that user
- **AND** the label SHALL read "今日通知"

#### Scenario: Statistics block shows Skeleton while loading

- **WHEN** the statistics data is being fetched
- **THEN** the statistics block SHALL display 2 Skeleton stat card placeholders
- **AND** once data is received, the Skeleton cards SHALL be replaced by real numbers


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
### Requirement: Keyword card displays platform badge, price range, toggle state, and last scan time

The system SHALL display each keyword card with a platform badge per selected platform, the configured price range (if set), and a visually distinct active/inactive toggle (green when active, gray when inactive).

#### Scenario: Keyword card shows Shopee platform badge

- **WHEN** a keyword has `platforms` containing `"shopee"`
- **THEN** the keyword card SHALL display a badge with the text "蝦皮" using `bg-orange-100 text-orange-700` styling

#### Scenario: Keyword card shows Ruten platform badge

- **WHEN** a keyword has `platforms` containing `"ruten"`
- **THEN** the keyword card SHALL display a badge with the text "露天" using `bg-blue-100 text-blue-700` styling

#### Scenario: Keyword card shows price range when configured

- **WHEN** a keyword has `minPrice` or `maxPrice` set (non-null)
- **THEN** the keyword card SHALL display the price range in the format "NT$ {minPrice} – {maxPrice}"
- **AND** if only `minPrice` is set, the format SHALL be "NT$ {minPrice} 以上"
- **AND** if only `maxPrice` is set, the format SHALL be "NT$ {maxPrice} 以下"

#### Scenario: Keyword card shows no price range when not configured

- **WHEN** both `minPrice` and `maxPrice` are null
- **THEN** no price range text SHALL be shown on the keyword card

#### Scenario: Active keyword toggle is visually green

- **WHEN** a keyword has `active: true`
- **THEN** the toggle control on the keyword card SHALL render with green styling (`bg-green-500`)

#### Scenario: Inactive keyword toggle is visually gray

- **WHEN** a keyword has `active: false`
- **THEN** the toggle control on the keyword card SHALL render with gray styling (`bg-gray-300`)


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
### Requirement: Navbar includes hamburger menu for mobile navigation

The system SHALL display a hamburger menu icon on viewports narrower than `md` breakpoint (768px). Tapping the icon SHALL expand a vertical navigation list. Tapping a nav item or the icon again SHALL collapse the menu.

#### Scenario: Hamburger icon is visible on mobile

- **WHEN** the viewport width is less than 768px
- **THEN** a hamburger icon button (three horizontal lines) SHALL be visible in the Navbar
- **AND** the regular horizontal nav links SHALL NOT be visible

#### Scenario: Tapping hamburger expands mobile nav

- **WHEN** a user taps the hamburger icon on a mobile viewport
- **THEN** a vertical navigation list SHALL appear below the Navbar header
- **AND** the hamburger icon SHALL change to an X (close) icon

#### Scenario: Tapping a mobile nav link collapses the menu

- **WHEN** a user taps a navigation link in the expanded mobile nav
- **THEN** the mobile nav list SHALL collapse
- **AND** the browser SHALL navigate to the selected page

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
### Requirement: Keyword creation accepts sellerBlocklist, discordWebhookUrl, and maxNotifyPerScan

The system SHALL accept `sellerBlocklist` (string array, default `[]`), `discordWebhookUrl` (string or null, default null), and `maxNotifyPerScan` (positive integer or null, default null) in `POST /api/keywords` and store them in the database. `discordWebhookUrl` MUST start with `https://discord.com/api/webhooks/` if non-null. `maxNotifyPerScan` MUST be a positive integer (≥ 1) if non-null.

#### Scenario: Keyword created with all three new fields

- **WHEN** a user submits `POST /api/keywords` with `{ "sellerBlocklist": ["黃牛"], "discordWebhookUrl": "https://discord.com/api/webhooks/1/x", "maxNotifyPerScan": 5 }`
- **THEN** the `Keyword` row SHALL be created with all three fields stored correctly

#### Scenario: Invalid discordWebhookUrl is rejected at creation

- **WHEN** a user submits `POST /api/keywords` with `{ "discordWebhookUrl": "https://example.com/hook" }`
- **THEN** the API SHALL return HTTP 400
- **AND** no `Keyword` row SHALL be created

#### Scenario: maxNotifyPerScan of zero is rejected

- **WHEN** a user submits `POST /api/keywords` with `{ "maxNotifyPerScan": 0 }`
- **THEN** the API SHALL return HTTP 400

#### Scenario: Omitting new fields uses defaults

- **WHEN** a user submits keyword creation without `sellerBlocklist`, `discordWebhookUrl`, or `maxNotifyPerScan`
- **THEN** the `Keyword` row SHALL be created with `sellerBlocklist: []`, `discordWebhookUrl: null`, `maxNotifyPerScan: null`


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
### Requirement: Keyword edit accepts sellerBlocklist, discordWebhookUrl, and maxNotifyPerScan

The system SHALL accept `sellerBlocklist`, `discordWebhookUrl`, and `maxNotifyPerScan` in `PATCH /api/keywords/[id]` and update all provided fields. The same validation rules as creation apply.

#### Scenario: User updates all three fields via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "sellerBlocklist": ["BadCircle"], "discordWebhookUrl": "https://discord.com/api/webhooks/2/y", "maxNotifyPerScan": 3 }`
- **THEN** all three fields SHALL be updated in the `Keyword` row

#### Scenario: User clears discordWebhookUrl via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "discordWebhookUrl": null }`
- **THEN** `Keyword.discordWebhookUrl` SHALL be set to null
- **AND** subsequent notifications for that keyword SHALL fall back to the global webhook


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
### Requirement: Worker keywords API includes new fields in response

The system SHALL include `sellerBlocklist`, `discordWebhookUrl`, and `maxNotifyPerScan` in the `GET /api/worker/keywords` response payload for each keyword.

#### Scenario: GET /api/worker/keywords returns all new fields

- **WHEN** the Worker calls `GET /api/worker/keywords`
- **THEN** each keyword object SHALL include `sellerBlocklist` (array), `discordWebhookUrl` (string or null), and `maxNotifyPerScan` (integer or null)
- **AND** the Worker SHALL use these values when calling `POST /api/worker/notify/batch`

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
### Requirement: GET /api/keywords responds with cache headers

The API SHALL include a `Cache-Control: private, stale-while-revalidate=60` response header on all successful GET requests.

#### Scenario: Keywords API returns cache header

- **WHEN** an authenticated user calls `GET /api/keywords`
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
### Requirement: Keyword userId query uses index

The database SHALL have a composite index on `Keyword(userId, createdAt DESC)` to support efficient retrieval of a user's keyword list sorted by creation time.

#### Scenario: Keywords list query uses index

- **WHEN** `GET /api/keywords` is called for a user with 50+ keywords
- **THEN** the query SHALL resolve via the `(userId, createdAt)` index without a full table scan
- **AND** response time SHALL be under 300ms for tables with up to 10,000 Keyword rows

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
### Requirement: Keyword card shows canary warning icon for unhealthy platforms

The keyword card UI component (`KeywordCard`) SHALL render a small warning icon next to each platform label whose `canaryHealthState` is `unhealthy` (as returned by `GET /api/platform-status`). Hovering the icon SHALL reveal a tooltip with the `canaryUnhealthyReason` and `canaryLastRunAt` so the user can judge whether to keep that platform enabled for the keyword.

#### Scenario: Warning icon appears on platform label when platform is unhealthy

- **WHEN** an authenticated user views their keyword list
- **AND** `GET /api/platform-status` reports `canaryHealthState=unhealthy` for platform `booth`
- **AND** a keyword card includes `booth` among its enabled platforms
- **THEN** the platform label for `booth` in the keyword card SHALL display a warning icon

#### Scenario: Warning icon is absent when all platforms are healthy

- **WHEN** all platforms enabled for a keyword report `canaryHealthState=healthy`
- **THEN** no platform label on the keyword card SHALL display a warning icon

#### Scenario: Tooltip describes the unhealthy reason

- **WHEN** the user hovers the warning icon on a platform label
- **THEN** a tooltip SHALL display the human-readable form of `canaryUnhealthyReason` (e.g., "頁面結構可能已改版" for `dom_broken`, "canary 關鍵字連續無結果" for `empty_canary`)
- **AND** the tooltip SHALL include `canaryLastRunAt` as relative time

<!-- @trace
source: platform-health-two-layer-detection
updated: 2026-04-17
code:
  - webapp/components/KeywordCard.tsx
  - webapp/app/api/platform-status/route.ts
  - webapp/constants/platform.ts
-->

<!-- @trace
source: platform-health-two-layer-detection
updated: 2026-04-17
code:
  - src/scheduler.py
  - CLAUDE.md
  - src/scrapers/melonbooks.py
  - src/canary.py
  - src/scrapers/myacg.py
  - src/scrapers/ruten.py
  - src/scrapers/yahoo_auction.py
  - README.md
  - src/scrapers/_dom_signal.py
  - webapp/app/api/platform-status/route.ts
  - webapp/components/KeywordSection.tsx
  - webapp/prisma/migrations/20260417000000_add_platform_canary_status/migration.sql
  - src/api_client.py
  - src/scrapers/animate.py
  - webapp/components/KeywordClientSection.tsx
  - src/scrapers/pchome.py
  - src/scrapers/dlsite.py
  - webapp/components/KeywordList.tsx
  - src/scrapers/kingstone.py
  - webapp/components/PlatformScanHealthBadge.tsx
  - src/scrapers/booth.py
  - webapp/components/PlatformScanHealthSection.tsx
  - webapp/app/api/worker/canary-status/route.ts
  - webapp/constants/platform.ts
  - src/scrapers/momo.py
  - webapp/prisma/schema.prisma
  - webapp/components/KeywordCard.tsx
  - src/scrapers/toranoana.py
  - src/scrapers/mandarake.py
-->