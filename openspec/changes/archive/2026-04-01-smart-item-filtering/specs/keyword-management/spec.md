## ADDED Requirements

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

### Requirement: Keyword edit accepts mustInclude and matchMode fields

The system SHALL accept `mustInclude` and `matchMode` in `PATCH /api/keywords/[id]` and update both fields in the database.

#### Scenario: User updates mustInclude via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "mustInclude": ["原廠", "全新"] }`
- **THEN** `Keyword.mustInclude` SHALL be updated to `["原廠", "全新"]`
- **AND** the response SHALL include the updated keyword with `mustInclude: ["原廠", "全新"]`

#### Scenario: User updates matchMode via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "matchMode": "exact" }`
- **THEN** `Keyword.matchMode` SHALL be updated to `"exact"`

## MODIFIED Requirements

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
