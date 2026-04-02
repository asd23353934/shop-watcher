## MODIFIED Requirements

### Requirement: Notification settings are isolated per user

The system SHALL ensure each user's notification settings are private and cannot be read or modified by other users. The settings page SHALL load existing values by fetching from `GET /api/settings`. Within a single browser session, the result of the first successful fetch SHALL be cached in memory; subsequent mounts of the settings form SHALL use the cached values and SHALL NOT re-fetch from the API. The cache SHALL be invalidated and updated after a successful save operation.

#### Scenario: Settings page shows only the authenticated user's settings

- **WHEN** an authenticated user navigates to `/settings`
- **THEN** only the `NotificationSetting` row where `userId` matches the session user SHALL be loaded
- **AND** other users' webhook URLs or email addresses SHALL NOT be exposed

#### Scenario: Settings are pre-filled with existing values on first load

- **WHEN** a user opens `/settings` for the first time in a browser session and already has a `NotificationSetting` record
- **THEN** the form fields SHALL be pre-populated with the stored values fetched from `GET /api/settings`
- **AND** the user SHALL be able to update individual fields without re-entering all values

#### Scenario: Settings are pre-filled from cache on subsequent loads within same session

- **WHEN** a user navigates away from `/settings` and returns to it within the same browser session
- **AND** a prior successful fetch has already been cached
- **THEN** the form fields SHALL be pre-populated immediately without issuing a new `GET /api/settings` request
- **AND** the loading spinner SHALL NOT be shown on the second visit

#### Scenario: Cache is updated after successful save

- **WHEN** a user saves updated notification settings successfully
- **THEN** the in-memory cache SHALL be updated with the newly saved values
- **AND** the next visit to `/settings` within the same session SHALL show the updated values without a network fetch
