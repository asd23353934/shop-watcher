## ADDED Requirements

### Requirement: User can follow a BOOTH shop or DLsite circle for new work alerts

The system SHALL support a `CircleFollow` model allowing users to subscribe to a specific BOOTH shop or DLsite circle. The Worker SHALL independently scan each followed circle's new-arrival page and notify the user of new works. Deduplication uses the existing `SeenItem(userId, platform, itemId)` unique key; the `keyword` field SHALL be set to `circle:{circleName}`.

#### Scenario: User creates a CircleFollow subscription

- **WHEN** a user submits `POST /api/circles` with `{ "platform": "booth", "circleId": "my-circle", "circleName": "My Circle", "webhookUrl": null }`
- **THEN** a `CircleFollow` row SHALL be created with `userId` set to the authenticated user's ID and `active: true`
- **AND** the API SHALL return HTTP 201 with the created record

#### Scenario: Duplicate CircleFollow is rejected

- **WHEN** a user attempts to create a `CircleFollow` with the same `platform` and `circleId` they already have
- **THEN** the API SHALL return HTTP 409 Conflict
- **AND** no duplicate row SHALL be created

#### Scenario: User can toggle CircleFollow active status

- **WHEN** a user calls `PATCH /api/circles/{id}` with `{ "active": false }`
- **THEN** `CircleFollow.active` SHALL be set to `false`
- **AND** the Worker SHALL skip this circle on the next scan cycle

#### Scenario: User can delete a CircleFollow

- **WHEN** a user calls `DELETE /api/circles/{id}` for a record they own
- **THEN** the `CircleFollow` row SHALL be deleted
- **AND** associated `SeenItem` rows with `keyword` matching `circle:{circleName}` SHALL remain (historical record preserved)

#### Scenario: CircleFollow is isolated per user

- **WHEN** a user calls `GET /api/circles`
- **THEN** only `CircleFollow` rows where `userId` matches the authenticated user SHALL be returned

---

### Requirement: Worker scans CircleFollow new-arrival pages each cycle

The Worker SHALL call `GET /api/worker/circles` to retrieve all active `CircleFollow` records each scan cycle. For each record, it SHALL scrape the platform's circle/shop new-arrival page and POST found items to `POST /api/worker/notify/batch` using the `keywordId: null` and `keyword: "circle:{circleName}"` fields.

#### Scenario: BOOTH shop new-arrival page is scraped for followed circle

- **WHEN** a `CircleFollow` has `platform: "booth"` and `circleId: "sample-shop"`
- **THEN** the Worker SHALL fetch `https://sample-shop.booth.pm/?adult=t&sort=new_arrival`
- **AND** parse `li.item-card[data-product-id]` elements
- **AND** POST found items to `/api/worker/notify/batch` with `keyword: "circle:sample-shop"`

#### Scenario: DLsite circle new-arrival page is scraped for followed circle

- **WHEN** a `CircleFollow` has `platform: "dlsite"` and `circleId: "RG12345"`
- **THEN** the Worker SHALL fetch `https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG12345.html` and parse new works
- **AND** POST found items to `/api/worker/notify/batch` with `keyword: "circle:RG12345"`

#### Scenario: CircleFollow uses per-follow webhookUrl if set

- **WHEN** a `CircleFollow` has a non-null `webhookUrl`
- **THEN** notifications for that circle SHALL be sent to `webhookUrl` instead of the user's global webhook

#### Scenario: New work from followed circle is deduplicated via SeenItem

- **WHEN** a work from a followed circle was already notified in a previous scan cycle
- **THEN** `SeenItem(userId, platform, itemId)` unique key prevents re-insertion
- **AND** no duplicate notification SHALL be sent
