## MODIFIED Requirements

### Requirement: Authenticated user can create a keyword

The system SHALL allow an authenticated user to create a new keyword with platform selection, optional price range, and active status. After a successful creation, the keyword list SHALL be updated without requiring a full page reload. The new keyword SHALL appear in the list immediately upon successful API response, by merging it into local client state, without triggering a full server re-render or `router.refresh()`.

#### Scenario: User creates a keyword with required fields

- **WHEN** a user submits the keyword creation form with a non-empty `keyword` string and at least one platform selected (`shopee` or `ruten`)
- **THEN** a `Keyword` row SHALL be created in the database with `userId` set to the authenticated user's ID
- **AND** `active` SHALL default to `true`
- **AND** the keyword list SHALL immediately display the new keyword by updating local client state
- **AND** no full page reload or `router.refresh()` SHALL occur

#### Scenario: Keyword creation with price range

- **WHEN** a user submits a keyword with `minPrice: 1000` and `maxPrice: 5000`
- **THEN** the `Keyword` row SHALL store `minPrice: 1000` and `maxPrice: 5000`
- **AND** the Worker SHALL receive these values in `GET /api/worker/keywords` response

#### Scenario: Keyword creation with empty keyword string is rejected

- **WHEN** a user submits the form with an empty `keyword` field
- **THEN** the system SHALL return a validation error
- **AND** no `Keyword` row SHALL be created

#### Scenario: Keyword creation with no platform selected is rejected

- **WHEN** a user submits the form without selecting any platform
- **THEN** the system SHALL return a validation error
- **AND** no `Keyword` row SHALL be created

---

### Requirement: User can toggle a keyword's active status

The system SHALL allow a user to enable or disable a keyword without deleting it. The toggle SHALL apply optimistically: the UI SHALL reflect the new state immediately upon user interaction, without waiting for the API response. If the API call fails, the UI SHALL revert to the previous state.

#### Scenario: User deactivates a keyword

- **WHEN** a user toggles a keyword's active switch to off
- **THEN** the keyword card SHALL immediately display as inactive (grey badge) in the UI
- **AND** the `Keyword.active` field SHALL be set to `false` in the database upon API success
- **AND** the keyword SHALL NOT appear in the `GET /api/worker/keywords` response after the update

#### Scenario: User reactivates a keyword

- **WHEN** a user toggles a keyword's active switch to on
- **THEN** the keyword card SHALL immediately display as active (green badge) in the UI
- **AND** the `Keyword.active` field SHALL be set to `true` in the database upon API success
- **AND** the keyword SHALL appear in the next `GET /api/worker/keywords` response

#### Scenario: Toggle fails and UI reverts

- **WHEN** a user toggles a keyword's active switch
- **AND** the PATCH API call returns a non-2xx response or network error
- **THEN** the keyword card SHALL revert to its previous active state in the UI
- **AND** an error indicator SHALL be shown to the user

---

### Requirement: Authenticated user can delete a keyword

The system SHALL allow a user to permanently delete a keyword they own. The deletion SHALL apply optimistically: the keyword SHALL be removed from the UI immediately upon user confirmation, without waiting for the API response. If the API call fails, the keyword SHALL reappear in the list.

#### Scenario: User deletes their own keyword

- **WHEN** a user confirms deletion of a keyword they own
- **THEN** the keyword SHALL immediately disappear from the list in the UI
- **AND** the `Keyword` row SHALL be deleted from the database upon API success
- **AND** the associated `SeenItem` rows SHALL NOT be deleted (historical record preserved)

#### Scenario: Deletion fails and keyword reappears

- **WHEN** a user confirms deletion of a keyword
- **AND** the DELETE API call returns a non-2xx response or network error
- **THEN** the keyword SHALL reappear in the list at its original position
- **AND** an error indicator SHALL be shown to the user

#### Scenario: User cannot delete another user's keyword

- **WHEN** a user attempts to delete a `Keyword` row with a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain in the database
