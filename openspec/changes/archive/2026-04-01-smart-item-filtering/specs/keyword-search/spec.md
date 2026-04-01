## ADDED Requirements

### Requirement: Scraped items are filtered by mustInclude before notification

The Worker SHALL discard any scraped item whose `name` does NOT contain ALL terms in `mustInclude` (case-insensitive). This filter SHALL execute after blocklist filtering and before `notify_batch`. Items filtered by mustInclude SHALL NOT create a `SeenItem` row.

#### Scenario: Item missing a required term is discarded

- **WHEN** a keyword has `mustInclude: ["茶軸", "87鍵"]` and a scraped item name is `"Cherry 機械鍵盤 青軸 87鍵"`
- **THEN** the item SHALL be discarded (missing "茶軸")
- **AND** `notify_batch` SHALL NOT be called for this item

#### Scenario: Empty mustInclude allows all items through

- **WHEN** a keyword has `mustInclude: []`
- **THEN** all items that passed blocklist filtering SHALL be passed to `notify_batch`

#### Scenario: mustInclude filter is applied after blocklist filter

- **WHEN** a keyword has `blocklist: ["廣告"]` and `mustInclude: ["茶軸"]` and a scraped item name is `"廣告 茶軸 機械鍵盤"`
- **THEN** the item SHALL be discarded at the blocklist stage
- **AND** the mustInclude stage SHALL NOT be reached for this item

### Requirement: Scraped items are filtered by matchMode before notification

The Worker SHALL filter scraped items by `matchMode` after mustInclude filtering and before `notify_batch`. The filter checks the item name against the keyword's `keyword` text using the specified matching strategy.

#### Scenario: matchMode "any" passes item containing at least one keyword token

- **WHEN** a keyword has `keyword: "機械 鍵盤"` and `matchMode: "any"` and a scraped item name is `"矮軸機械滑鼠"`
- **THEN** the item SHALL pass (contains "機械")

#### Scenario: matchMode "all" discards item missing any keyword token

- **WHEN** a keyword has `keyword: "機械 鍵盤 茶軸"` and `matchMode: "all"` and an item name is `"Cherry 機械鍵盤 青軸"`
- **THEN** the item SHALL be discarded (missing "茶軸")

#### Scenario: matchMode "exact" discards item without full keyword substring

- **WHEN** a keyword has `keyword: "機械鍵盤"` and `matchMode: "exact"` and an item name is `"矮軸機械滑鼠"`
- **THEN** the item SHALL be discarded (does not contain the substring "機械鍵盤")

#### Scenario: matchMode filter is applied after mustInclude filter

- **WHEN** an item passes mustInclude filtering but fails matchMode filtering
- **THEN** the item SHALL be discarded before `notify_batch`
- **AND** no `SeenItem` row SHALL be created for this item
