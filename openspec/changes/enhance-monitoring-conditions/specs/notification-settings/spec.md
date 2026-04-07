## ADDED Requirements

### Requirement: User can manage global seller blocklist in notification settings

The system SHALL allow an authenticated user to manage `globalSellerBlocklist: String[]` on their `NotificationSetting` record via the settings page. The UI SHALL use the same tag-style add/delete input as the keyword blocklist. Changes SHALL be saved via `PATCH /api/settings`.

#### Scenario: User adds a seller to global blocklist

- **WHEN** a user types a seller name in the global seller blocklist input and presses Enter or clicks "新增"
- **THEN** the seller name SHALL be added as a tag in the UI
- **AND** on save, `NotificationSetting.globalSellerBlocklist` SHALL be updated to include the new entry

#### Scenario: User removes a seller from global blocklist

- **WHEN** a user clicks the × button on an existing seller tag in the global blocklist
- **THEN** that entry SHALL be removed from the tag list in the UI
- **AND** on save, `NotificationSetting.globalSellerBlocklist` SHALL be updated without that entry

#### Scenario: Global seller blocklist is pre-filled on settings page load

- **WHEN** a user navigates to /settings and has an existing `globalSellerBlocklist: ["黃牛"]`
- **THEN** the global seller blocklist input SHALL display "黃牛" as a pre-filled tag

#### Scenario: Settings API accepts globalSellerBlocklist

- **WHEN** a user submits `PATCH /api/settings` with `{ "globalSellerBlocklist": ["SuspectSeller", "FakeDeal"] }`
- **THEN** `NotificationSetting.globalSellerBlocklist` SHALL be updated to `["SuspectSeller", "FakeDeal"]`
- **AND** the API SHALL return HTTP 200 with the updated settings

#### Scenario: GET /api/settings includes globalSellerBlocklist

- **WHEN** a user calls `GET /api/settings`
- **THEN** the response SHALL include `globalSellerBlocklist` as a string array
