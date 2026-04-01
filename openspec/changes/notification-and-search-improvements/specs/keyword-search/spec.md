## ADDED Requirements

### Requirement: Scraped items are filtered by keyword blocklist before notification

The Worker SHALL discard any scraped item whose `name` contains any term from the keyword's `blocklist` (case-insensitive comparison). Filtered items SHALL NOT be passed to `notify_item()` and SHALL NOT create a `SeenItem` row.

#### Scenario: Item name contains a blocklist term

- **WHEN** the Worker scrapes an item with name "機械鍵盤 廣告整組" for a keyword with `blocklist: ["廣告", "整組"]`
- **THEN** the item SHALL be discarded before calling `notify_item()`
- **AND** no `SeenItem` row SHALL be created for this item

#### Scenario: Item name does not contain any blocklist term

- **WHEN** the Worker scrapes an item with name "Cherry 機械鍵盤 茶軸" for a keyword with `blocklist: ["廣告", "整組"]`
- **THEN** the item SHALL be passed to `notify_item()` as normal

#### Scenario: Blocklist comparison is case-insensitive

- **WHEN** a keyword has `blocklist: ["Cherry"]` and an item name is `"cherry mx red 機械鍵盤"`
- **THEN** the item SHALL be discarded (case-insensitive match)

#### Scenario: Empty blocklist does not filter any items

- **WHEN** a keyword has `blocklist: []`
- **THEN** all scraped items SHALL be passed to `notify_item()` without filtering
