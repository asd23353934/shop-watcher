## ADDED Requirements

### Requirement: User can view notification history

The system SHALL provide a notification history page at /history listing the most recent notified items for the authenticated user.

#### Scenario: History page lists recent notified items

- **WHEN** an authenticated user navigates to /history
- **THEN** the page SHALL display a list of SeenItem rows belonging to that user
- **AND** each row SHALL show: keyword, platform label, item ID, and firstSeen timestamp
- **AND** results SHALL be sorted by firstSeen descending (newest first)
- **AND** at most 50 items SHALL be shown per page

#### Scenario: Empty history shows placeholder

- **WHEN** an authenticated user has no SeenItem rows
- **THEN** the history page SHALL display a message indicating no notifications have been sent yet
