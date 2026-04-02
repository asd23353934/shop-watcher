# notification-settings Specification

## Purpose

TBD - created by archiving change 'saas-webapp'. Update Purpose after archive.

## Requirements

### Requirement: User can save Discord notification settings

The system SHALL allow an authenticated user to save a Discord Webhook URL and an optional Discord User ID to their `NotificationSetting` record.

#### Scenario: User saves Discord Webhook URL and User ID

- **WHEN** a user submits the notification settings form with a valid Discord Webhook URL
- **THEN** the `NotificationSetting` row SHALL be created or updated (upsert) with `discordWebhookUrl` and `discordUserId`
- **AND** a success message SHALL be displayed to the user

#### Scenario: User saves settings without Discord User ID

- **WHEN** a user submits with a Webhook URL but leaves Discord User ID empty
- **THEN** `discordUserId` SHALL be stored as `null`
- **AND** Discord notifications SHALL be sent without a user mention

#### Scenario: Invalid Discord Webhook URL is rejected

- **WHEN** a user submits a `discordWebhookUrl` that does not start with `https://discord.com/api/webhooks/`
- **THEN** the API SHALL return a validation error
- **AND** the `NotificationSetting` row SHALL NOT be updated


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
### Requirement: User can save Email notification settings

The system SHALL allow an authenticated user to save an email address for Resend Email notifications.

#### Scenario: User saves a valid email address

- **WHEN** a user submits the notification settings form with a valid email address in `emailAddress`
- **THEN** the `NotificationSetting.emailAddress` field SHALL be updated
- **AND** subsequent item notifications SHALL trigger an email to that address

#### Scenario: User clears email address to disable email notifications

- **WHEN** a user submits with an empty `emailAddress` field
- **THEN** `NotificationSetting.emailAddress` SHALL be set to `null`
- **AND** no email notifications SHALL be sent for that user

#### Scenario: Invalid email format is rejected

- **WHEN** a user submits an `emailAddress` value that is not a valid email format
- **THEN** the API SHALL return a validation error
- **AND** the `NotificationSetting` row SHALL NOT be updated


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
### Requirement: Notification settings are isolated per user

The system SHALL ensure each user's notification settings are private and cannot be read or modified by other users. The settings page SHALL load existing values by fetching from `GET /api/settings`. Within a single browser session, the result of the first successful fetch SHALL be cached in memory; subsequent mounts of the settings form SHALL use the cached values and SHALL NOT re-fetch from the API. The cache SHALL be invalidated and updated after a successful save operation.

#### Scenario: Settings page shows only the authenticated user's settings

- **WHEN** an authenticated user navigates to `/settings`
- **THEN** only the `NotificationSetting` row where `userId` matches the session user SHALL be loaded
- **AND** other users' webhook URLs or email addresses SHALL NOT be exposed

#### Scenario: Settings are pre-filled with existing values on first load

- **WHEN** a user opens `/settings` for the first time in a browser session and already has a `NotificationSetting` record
- **THEN** the form fields SHALL be pre-populated with the stored values fetched from `GET /api/settings`
- **AND** the user SHALL be able to update individual fields without re-entering all values

#### Scenario: Settings are pre-filled from cache on subsequent loads within same session

- **WHEN** a user navigates away from `/settings` and returns to it within the same browser session
- **AND** a prior successful fetch has already been cached
- **THEN** the form fields SHALL be pre-populated immediately without issuing a new `GET /api/settings` request
- **AND** the loading spinner SHALL NOT be shown on the second visit

#### Scenario: Cache is updated after successful save

- **WHEN** a user saves updated notification settings successfully
- **THEN** the in-memory cache SHALL be updated with the newly saved values
- **AND** the next visit to `/settings` within the same session SHALL show the updated values without a network fetch


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
### Requirement: Dashboard warns user when no notification method is configured

The system SHALL display a warning banner on the dashboard when the authenticated user has neither a Discord Webhook URL nor a notification email configured. The banner SHALL link to the settings page and SHALL NOT block keyword creation.

#### Scenario: User with no notification settings sees warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** that user's `NotificationSetting` has both `discordWebhookUrl` as null and `notifyEmail` as null
- **THEN** the dashboard SHALL display a warning banner above the keyword form
- **AND** the banner SHALL contain a link to `/settings`
- **AND** the keyword creation form SHALL still be accessible and functional

#### Scenario: User with Discord webhook configured does not see warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** that user's `NotificationSetting` has a non-null `discordWebhookUrl`
- **THEN** the dashboard SHALL NOT display the notification warning banner

#### Scenario: User with only email configured does not see warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** that user's `NotificationSetting` has a non-null `notifyEmail`
- **THEN** the dashboard SHALL NOT display the notification warning banner

#### Scenario: User with no NotificationSetting record sees warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** no `NotificationSetting` row exists for that user
- **THEN** the dashboard SHALL display the notification warning banner
- **AND** the banner SHALL contain a link to `/settings`

<!-- @trace
source: keyword-ux-improvements
updated: 2026-04-01
code:
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/components/NotificationBanner.tsx
-->

---
### Requirement: User can test Discord Webhook URL before saving

The settings page SHALL provide a "Test Webhook" button that sends a test Discord message to the configured Webhook URL and displays success or failure to the user.

#### Scenario: Valid Webhook URL sends test message successfully

- **WHEN** a user clicks the "Test Webhook" button with a valid Discord Webhook URL entered
- **THEN** the system SHALL POST to `POST /api/settings/test-webhook` with the webhookUrl
- **AND** the endpoint SHALL send a test Discord Embed to that URL
- **AND** if Discord returns 2xx, the UI SHALL display a success indicator

#### Scenario: Invalid Webhook URL returns error to user

- **WHEN** a user clicks the "Test Webhook" button and Discord returns a non-2xx status
- **THEN** the UI SHALL display an error message with the status code
- **AND** the NotificationSetting record SHALL NOT be modified by the test action

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