## ADDED Requirements

### Requirement: Dashboard displays Skeleton placeholders during data loading

The system SHALL display animated Skeleton placeholder cards in the Dashboard statistics area while keyword and history data is being fetched. Skeleton elements SHALL use `animate-pulse` animation with gray background (`bg-gray-200`). Skeleton placeholders SHALL be visually similar in size to the real content they replace.

#### Scenario: Dashboard shows Skeleton cards while loading keywords

- **WHEN** the Dashboard page is mounted and the keyword list API call is in-flight
- **THEN** the keyword list area SHALL display 3 Skeleton row placeholders instead of real keyword cards
- **AND** no "empty state" message SHALL appear during loading
- **AND** once data is received, the Skeleton rows SHALL be replaced by real keyword cards or the empty state

#### Scenario: Dashboard shows Skeleton for statistics block while loading

- **WHEN** the Dashboard statistics block (keyword count, today's notification count) is fetching data
- **THEN** 2 Skeleton stat cards SHALL be displayed in place of the statistics numbers
- **AND** once data is received, real numbers SHALL replace the Skeleton cards

### Requirement: Keyword list displays Skeleton rows during refresh

The system SHALL display Skeleton rows in the keyword list while a refresh is in progress (e.g., after creating or deleting a keyword).

#### Scenario: Keyword list shows Skeleton during post-mutation refresh

- **WHEN** a keyword is created or deleted and the list is refreshing
- **THEN** the keyword list area SHALL show Skeleton rows equal to the expected item count (minimum 3)
- **AND** no partial real data SHALL be mixed with Skeleton rows during loading
- **AND** once the refresh completes, the Skeleton rows SHALL be replaced with updated real data
