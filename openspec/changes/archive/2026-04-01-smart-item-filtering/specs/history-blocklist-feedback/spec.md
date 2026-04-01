## ADDED Requirements

### Requirement: User can add a word to a keyword's blocklist from notification history

The system SHALL provide a `PATCH /api/keywords/[id]/blocklist` endpoint that appends a single word to the `blocklist` of the specified keyword. The authenticated user MUST own the keyword. Duplicate words SHALL be silently ignored (no error, no duplicate stored).

#### Scenario: User appends a new word to blocklist

- **WHEN** an authenticated user calls `PATCH /api/keywords/{id}/blocklist` with body `{ "word": "整組" }` and owns that keyword
- **THEN** the API SHALL respond HTTP 200
- **AND** `"整組"` SHALL be appended to `Keyword.blocklist` if not already present

#### Scenario: Appending a word that already exists is a no-op

- **WHEN** the keyword already has `blocklist: ["廣告"]` and the user calls `PATCH /api/keywords/{id}/blocklist` with `{ "word": "廣告" }`
- **THEN** the API SHALL respond HTTP 200
- **AND** `Keyword.blocklist` SHALL remain `["廣告"]` (no duplicate added)

#### Scenario: User cannot append to another user's keyword blocklist

- **WHEN** an authenticated user calls `PATCH /api/keywords/{id}/blocklist` where `{id}` belongs to a different user
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword.blocklist` SHALL remain unchanged

#### Scenario: Empty word is rejected

- **WHEN** the request body contains `{ "word": "" }` or `{ "word": "   " }` (whitespace only)
- **THEN** the API SHALL return HTTP 400
- **AND** no change SHALL be made to the blocklist

### Requirement: Notification history page shows a quick-add-to-blocklist action per item

The history page SHALL display a "加入禁詞" button next to each notification record. Clicking the button SHALL present an input to enter a custom word, and on confirm SHALL call `PATCH /api/keywords/[keywordId]/blocklist`. The button SHALL be disabled (with tooltip "關鍵字已刪除") when the notification record has no associated `keywordId`.

#### Scenario: User clicks "加入禁詞" on a history item with a valid keywordId

- **WHEN** the user clicks "加入禁詞" on a notification record that has a non-null `keywordId`
- **THEN** an inline input SHALL appear pre-focused, allowing the user to type a word
- **AND** on confirm (Enter key or submit button), `PATCH /api/keywords/{keywordId}/blocklist` SHALL be called with the entered word
- **AND** a success indicator SHALL be shown after the API responds

#### Scenario: Feedback button is disabled when keywordId is null

- **WHEN** a notification record has `keywordId: null` (keyword was deleted)
- **THEN** the "加入禁詞" button SHALL be rendered in a disabled state
- **AND** a tooltip SHALL indicate "關鍵字已刪除"
