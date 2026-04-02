## MODIFIED Requirements

### Requirement: User can view notification history

The system SHALL provide a notification history page at /history listing the most recent notified items for the authenticated user.

#### Scenario: History page lists recent notified items

- **WHEN** an authenticated user navigates to /history
- **THEN** the page SHALL display a list of SeenItem rows belonging to that user
- **AND** each row SHALL show: keyword, platform label, item ID, and firstSeen timestamp
- **AND** results SHALL be sorted by firstSeen descending (newest first)
- **AND** at most 50 items SHALL be shown per page

#### Scenario: Empty history shows EmptyState component

- **WHEN** an authenticated user has no SeenItem rows
- **THEN** the history page SHALL display the `EmptyState` component
- **AND** the heading SHALL read "尚無通知紀錄"
- **AND** the subtitle SHALL read "當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
- **AND** no table or list element SHALL be rendered
