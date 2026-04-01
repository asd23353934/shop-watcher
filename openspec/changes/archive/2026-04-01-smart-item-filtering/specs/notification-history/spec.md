## ADDED Requirements

### Requirement: History page shows a quick-add-to-blocklist action per notification

Each notification record on the /history page SHALL display a "加入禁詞" button. When the associated keyword still exists (`keywordId` is non-null), the button SHALL be interactive. When `keywordId` is null (keyword deleted), the button SHALL be disabled with a tooltip explaining why.

#### Scenario: User adds a word to blocklist from history item

- **WHEN** an authenticated user clicks "加入禁詞" on a history record that has a non-null `keywordId`
- **THEN** an inline input field SHALL appear for the user to type a custom word
- **AND** on submit (Enter or button click), `PATCH /api/keywords/{keywordId}/blocklist` SHALL be called
- **AND** on success, a confirmation indicator SHALL be shown inline
- **AND** on failure (e.g., HTTP 403), an error message SHALL be shown

#### Scenario: Feedback button is disabled for orphaned history items

- **WHEN** a history record has `keywordId: null` because the keyword was deleted
- **THEN** the "加入禁詞" button SHALL be rendered disabled
- **AND** hovering the button SHALL show the tooltip text "關鍵字已刪除"
