## ADDED Requirements

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
