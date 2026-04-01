# item-must-include-filter Specification

## Purpose

Defines the mustInclude filtering capability for keyword monitoring. Each keyword may specify a list of required terms; scraped items that do not contain all required terms are discarded before notification.

## Requirements

### Requirement: Keyword supports a mustInclude list of required terms

Each Keyword SHALL support a `mustInclude` field containing zero or more required terms. Scraped items whose names do NOT contain ALL terms from `mustInclude` (case-insensitive) SHALL be discarded before notification. Items SHALL be discarded after blocklist filtering and before `notify_batch`.

#### Scenario: Item name contains all mustInclude terms — passes

- **WHEN** a keyword has `mustInclude: ["茶軸", "87鍵"]` and a scraped item name is `"Cherry MX 機械鍵盤 茶軸 87鍵"`
- **THEN** the item SHALL be passed to `notify_batch`

#### Scenario: Item name missing one mustInclude term — discarded

- **WHEN** a keyword has `mustInclude: ["茶軸", "87鍵"]` and a scraped item name is `"Cherry MX 機械鍵盤 茶軸 104鍵"`
- **THEN** the item SHALL be discarded before calling `notify_batch`
- **AND** no `SeenItem` row SHALL be created for this item

#### Scenario: mustInclude comparison is case-insensitive

- **WHEN** a keyword has `mustInclude: ["Cherry"]` and a scraped item name is `"cherry mx red 機械鍵盤"`
- **THEN** the item SHALL pass the mustInclude filter (case-insensitive match)

#### Scenario: Empty mustInclude does not filter any items

- **WHEN** a keyword has `mustInclude: []`
- **THEN** all scraped items SHALL pass the mustInclude filter without any filtering

#### Scenario: mustInclude is stored and returned by the worker keywords API

- **WHEN** a keyword has `mustInclude: ["原廠", "全新"]` and the Worker calls `GET /api/worker/keywords`
- **THEN** the response SHALL include `mustInclude: ["原廠", "全新"]` for that keyword

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