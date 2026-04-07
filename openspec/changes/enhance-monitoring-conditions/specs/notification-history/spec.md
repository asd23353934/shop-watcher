## MODIFIED Requirements

### Requirement: User can view notification history

The system SHALL provide a notification history page at /history listing notified items for the authenticated user. Each row SHALL show: keyword, platform label, item name (linked to item URL if available, otherwise item ID), and firstSeen timestamp. Results SHALL be sorted by firstSeen descending. The page SHALL support cursor-based pagination showing 50 items per page with a "載入更多" button. When no more items exist, the button SHALL be hidden.

#### Scenario: History page lists notified items with item name and link

- **WHEN** an authenticated user navigates to /history
- **AND** SeenItem rows have `itemName` and `itemUrl` populated
- **THEN** each row SHALL display the item name as a clickable link to `itemUrl`
- **AND** results SHALL be sorted by firstSeen descending (newest first)
- **AND** at most 50 items SHALL be shown on the initial load

#### Scenario: History row shows item ID fallback when itemName is null

- **WHEN** a SeenItem row has `itemName: null` (legacy record before this change)
- **THEN** the history row SHALL display the `itemId` string instead of a name
- **AND** no link SHALL be shown if `itemUrl` is also null

#### Scenario: History supports filtering by keyword

- **WHEN** a user selects a keyword filter from the filter dropdown on /history
- **THEN** only SeenItem rows matching that `keywordId` SHALL be displayed
- **AND** the count in the filter label SHALL update to reflect the filtered results

#### Scenario: History supports filtering by platform

- **WHEN** a user selects a platform filter (e.g., "露天") from the filter dropdown
- **THEN** only SeenItem rows with `platform: "ruten"` SHALL be displayed

#### Scenario: History pagination loads next 50 items

- **WHEN** the initial history page shows 50 items
- **AND** the user clicks "載入更多"
- **THEN** the next 50 SeenItem rows SHALL be appended to the list (cursor-based, using last item's `id`)
- **AND** if fewer than 50 items are returned, the "載入更多" button SHALL be hidden

#### Scenario: Empty history shows EmptyState component

- **WHEN** an authenticated user has no SeenItem rows
- **THEN** the history page SHALL display the `EmptyState` component
- **AND** the heading SHALL read "尚無通知紀錄"
- **AND** the subtitle SHALL read "當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
- **AND** no table or list element SHALL be rendered
