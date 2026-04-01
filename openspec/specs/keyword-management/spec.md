# keyword-management Specification

## Purpose

TBD - created by archiving change 'saas-webapp'. Update Purpose after archive.

## Requirements

### Requirement: Authenticated user can create a keyword

The system SHALL allow an authenticated user to create a new keyword with platform selection, optional price range, and active status. After a successful creation, the keyword list SHALL be updated without requiring a full page reload.

#### Scenario: User creates a keyword with required fields

- **WHEN** a user submits the keyword creation form with a non-empty `keyword` string and at least one platform selected (`shopee` or `ruten`)
- **THEN** a `Keyword` row SHALL be created in the database with `userId` set to the authenticated user's ID
- **AND** `active` SHALL default to `true`
- **AND** the keyword list SHALL refresh and display the new keyword without a full page reload

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
source: keyword-ux-improvements
updated: 2026-04-01
code:
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/components/NotificationBanner.tsx
-->

---
### Requirement: Authenticated user can edit an existing keyword

The system SHALL allow a user to update any field of a keyword they own.

#### Scenario: User updates keyword text

- **WHEN** a user submits an edit form for their own keyword with a new `keyword` string
- **THEN** the `Keyword` row SHALL be updated in the database
- **AND** the updated value SHALL appear in the keyword list

#### Scenario: User cannot edit another user's keyword

- **WHEN** a user attempts to update a `Keyword` row that belongs to a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain unchanged


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
### Requirement: Authenticated user can delete a keyword

The system SHALL allow a user to permanently delete a keyword they own.

#### Scenario: User deletes their own keyword

- **WHEN** a user confirms deletion of a keyword they own
- **THEN** the `Keyword` row SHALL be deleted from the database
- **AND** the keyword SHALL no longer appear in the user's list
- **AND** the associated `SeenItem` rows SHALL NOT be deleted (historical record preserved)

#### Scenario: User cannot delete another user's keyword

- **WHEN** a user attempts to delete a `Keyword` row with a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain in the database


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

The system SHALL allow a user to enable or disable a keyword without deleting it.

#### Scenario: User deactivates a keyword

- **WHEN** a user toggles a keyword's active switch to off
- **THEN** the `Keyword.active` field SHALL be set to `false`
- **AND** the keyword SHALL NOT appear in the `GET /api/worker/keywords` response

#### Scenario: User reactivates a keyword

- **WHEN** a user toggles a keyword's active switch to on
- **THEN** the `Keyword.active` field SHALL be set to `true`
- **AND** the keyword SHALL appear in the next `GET /api/worker/keywords` response

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