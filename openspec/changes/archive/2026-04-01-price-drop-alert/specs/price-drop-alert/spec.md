## ADDED Requirements

### Requirement: Price drop on a known item triggers a re-notification

The system SHALL re-notify the user when a previously seen item's current price is lower than its last recorded price in SeenItem.

#### Scenario: Price drop detected triggers notification

- **WHEN** POST /api/worker/notify/batch receives an item whose (userId, platform, itemId) already exists in SeenItem
- **AND** the new price is non-null AND lower than SeenItem.lastPrice
- **THEN** the SeenItem.lastPrice SHALL be updated to the new price
- **AND** the item SHALL be included in the Discord and Email notification as a price drop
- **AND** the Discord embed title SHALL be prefixed with "[降價]" and color SHALL be 0x57F287
- **AND** the embed SHALL include fields showing original price and new price

#### Scenario: Duplicate item with no price change is not re-notified

- **WHEN** POST /api/worker/notify/batch receives an item that already exists in SeenItem
- **AND** the new price equals or exceeds SeenItem.lastPrice, or both prices are null
- **THEN** the item SHALL be treated as a duplicate and SHALL NOT trigger a notification

#### Scenario: Item with null price does not trigger price drop

- **WHEN** an item has null price
- **THEN** no price drop comparison SHALL be performed for that item
- **AND** the item SHALL be treated as a duplicate if it already exists in SeenItem
