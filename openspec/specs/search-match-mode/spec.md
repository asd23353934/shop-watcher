# search-match-mode Specification

## Purpose

Defines the matchMode filtering capability for keyword monitoring. Each keyword may specify how its text is matched against scraped item names, choosing between any-token, all-tokens, or exact-substring matching.

## Requirements

### Requirement: Keyword matchMode controls how keyword text is matched against item names

Each Keyword SHALL support a `matchMode` field with one of three values: `any`, `all`, or `exact`. The matchMode filter SHALL be applied after mustInclude filtering and before `notify_batch`. Existing keywords without an explicit `matchMode` SHALL default to `any`.

#### Scenario: matchMode "any" — at least one token matches (default behavior)

- **WHEN** a keyword has `keyword: "機械 鍵盤"` and `matchMode: "any"` and a scraped item name is `"矮軸機械滑鼠"`
- **THEN** the item SHALL pass (contains "機械")
- **AND** this matches the current behavior with no behavioral change for existing keywords

#### Scenario: matchMode "all" — every whitespace-separated token must be present

- **WHEN** a keyword has `keyword: "機械 鍵盤 87鍵"` and `matchMode: "all"` and a scraped item name is `"Cherry 機械鍵盤 104鍵"`
- **THEN** the item SHALL be discarded (missing "87鍵")

#### Scenario: matchMode "all" — all tokens present passes

- **WHEN** a keyword has `keyword: "機械 鍵盤 87鍵"` and `matchMode: "all"` and a scraped item name is `"Cherry 機械鍵盤 茶軸 87鍵"`
- **THEN** the item SHALL pass the matchMode filter

#### Scenario: matchMode "exact" — item name must contain full keyword string as substring

- **WHEN** a keyword has `keyword: "機械鍵盤"` and `matchMode: "exact"` and a scraped item name is `"矮軸機械滑鼠"`
- **THEN** the item SHALL be discarded (does not contain the substring "機械鍵盤")

#### Scenario: matchMode "exact" — full substring present passes

- **WHEN** a keyword has `keyword: "機械鍵盤"` and `matchMode: "exact"` and a scraped item name is `"Cherry 機械鍵盤 茶軸"`
- **THEN** the item SHALL pass (item name contains "機械鍵盤" as a substring, case-insensitive)

#### Scenario: matchMode is stored and returned by the worker keywords API

- **WHEN** a keyword has `matchMode: "all"` and the Worker calls `GET /api/worker/keywords`
- **THEN** the response SHALL include `matchMode: "all"` for that keyword

#### Scenario: matchMode defaults to "any" for existing keywords

- **WHEN** an existing Keyword row has no explicit `matchMode` set
- **THEN** `GET /api/worker/keywords` SHALL return `matchMode: "any"` for that keyword
- **AND** the Worker SHALL apply `any` matching logic (no change from current behavior)

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