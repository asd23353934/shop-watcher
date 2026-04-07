## ADDED Requirements

### Requirement: Global seller blocklist filters items across all keywords

The system SHALL support a `globalSellerBlocklist: String[]` field on `NotificationSetting`. Any item whose `seller_name` or `seller_id` matches any entry in `globalSellerBlocklist` (case-insensitive substring match) SHALL be excluded from notification and SHALL NOT be inserted into `SeenItem` for that user. This filter SHALL be applied before per-keyword seller filtering.

#### Scenario: Item from blacklisted seller is silently dropped

- **WHEN** `POST /api/worker/notify/batch` receives an item with `seller_name: "ScalperShop"`
- **AND** the user's `NotificationSetting.globalSellerBlocklist` contains `"scalper"`
- **THEN** that item SHALL NOT be inserted into `SeenItem`
- **AND** no Discord or Email notification SHALL be sent for that item
- **AND** the API SHALL return HTTP 200 with the item counted as filtered

#### Scenario: Global blocklist match is case-insensitive substring

- **WHEN** `globalSellerBlocklist` contains `"黃牛"`
- **AND** an item arrives with `seller_name: "黃牛小舖2號"`
- **THEN** the item SHALL be filtered out (substring match)

#### Scenario: Item with null seller_name is not filtered by seller blocklist

- **WHEN** an item has `seller_name: null` and `seller_id: null`
- **AND** the user has a non-empty `globalSellerBlocklist`
- **THEN** the item SHALL NOT be filtered by seller blocklist
- **AND** it SHALL proceed to per-keyword filtering and notification normally

#### Scenario: User saves global seller blocklist via settings API

- **WHEN** a user submits `PATCH /api/settings` with `{ "globalSellerBlocklist": ["黃牛", "ScalperX"] }`
- **THEN** `NotificationSetting.globalSellerBlocklist` SHALL be updated to `["黃牛", "ScalperX"]`
- **AND** subsequent batch notifications SHALL apply the new blocklist

#### Scenario: User clears global seller blocklist

- **WHEN** a user submits `PATCH /api/settings` with `{ "globalSellerBlocklist": [] }`
- **THEN** `NotificationSetting.globalSellerBlocklist` SHALL be set to `[]`
- **AND** no seller filtering SHALL be applied at the global level

---

### Requirement: Per-keyword seller blocklist filters items for that keyword only

The system SHALL support a `sellerBlocklist: String[]` field on `Keyword`. Items whose `seller_name` or `seller_id` matches any entry in the keyword's `sellerBlocklist` (case-insensitive substring match) SHALL be excluded from notification for that keyword only.

#### Scenario: Item from per-keyword blacklisted seller is dropped for that keyword

- **WHEN** an item is found for keyword K with `seller_name: "CircleA"`
- **AND** keyword K has `sellerBlocklist: ["circlea"]`
- **THEN** that item SHALL NOT be notified for keyword K
- **AND** the item SHALL NOT be recorded in SeenItem for keyword K

#### Scenario: Per-keyword blocklist does not affect other keywords

- **WHEN** keyword K1 has `sellerBlocklist: ["BadSeller"]`
- **AND** keyword K2 has no seller blocklist
- **AND** an item from `seller_name: "BadSeller"` matches both K1 and K2
- **THEN** the item SHALL be notified for K2 but NOT for K1

#### Scenario: Keyword created with sellerBlocklist

- **WHEN** a user submits `POST /api/keywords` with `{ "sellerBlocklist": ["黃牛商店"] }`
- **THEN** the `Keyword` row SHALL be created with `sellerBlocklist: ["黃牛商店"]`

#### Scenario: Keyword sellerBlocklist updated via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "sellerBlocklist": ["NewBadSeller"] }`
- **THEN** `Keyword.sellerBlocklist` SHALL be updated to `["NewBadSeller"]`

#### Scenario: Keyword created without sellerBlocklist defaults to empty array

- **WHEN** a user submits keyword creation without `sellerBlocklist`
- **THEN** the `Keyword` row SHALL have `sellerBlocklist: []`
- **AND** no seller filtering SHALL be applied for that keyword
