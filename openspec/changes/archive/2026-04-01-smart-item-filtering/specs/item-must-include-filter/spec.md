## ADDED Requirements

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
