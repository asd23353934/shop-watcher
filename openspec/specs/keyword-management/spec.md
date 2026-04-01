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