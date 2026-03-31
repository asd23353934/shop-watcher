## ADDED Requirements

### Requirement: Authenticated user can create a keyword

The system SHALL allow an authenticated user to create a new keyword with platform selection, optional price range, and active status.

#### Scenario: User creates a keyword with required fields

- **WHEN** a user submits the keyword creation form with a non-empty `keyword` string and at least one platform selected (`shopee` or `ruten`)
- **THEN** a `Keyword` row SHALL be created in the database with `userId` set to the authenticated user's ID
- **AND** `active` SHALL default to `true`
- **AND** the new keyword SHALL appear in the user's keyword list

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

### Requirement: Authenticated user can edit an existing keyword

The system SHALL allow a user to update any field of a keyword they own.

#### Scenario: User updates keyword text

- **WHEN** a user submits an edit form for their own keyword with a new `keyword` string
- **THEN** the `Keyword` row SHALL be updated in the database
- **AND** the updated value SHALL appear in the keyword list

#### Scenario: User cannot edit another user's keyword

- **WHEN** a user attempts to update a `Keyword` row that belongs to a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain unchanged

---

### Requirement: Authenticated user can delete a keyword

The system SHALL allow a user to permanently delete a keyword they own.

#### Scenario: User deletes their own keyword

- **WHEN** a user confirms deletion of a keyword they own
- **THEN** the `Keyword` row SHALL be deleted from the database
- **AND** the keyword SHALL no longer appear in the user's list
- **AND** the associated `SeenItem` rows SHALL NOT be deleted (historical record preserved)

#### Scenario: User cannot delete another user's keyword

- **WHEN** a user attempts to delete a `Keyword` row with a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain in the database

---

### Requirement: User's keyword list shows only their own keywords

The system SHALL ensure each user sees only their own keywords in the dashboard.

#### Scenario: Dashboard lists only the authenticated user's keywords

- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** only `Keyword` rows where `userId` matches the session user's ID SHALL be displayed
- **AND** keywords belonging to other users SHALL NOT appear in the list

#### Scenario: Empty keyword list shows a call-to-action

- **WHEN** an authenticated user has no keywords
- **THEN** the dashboard SHALL display a prompt to add the first keyword
- **AND** no error SHALL be shown

---

### Requirement: User can toggle a keyword's active status

The system SHALL allow a user to enable or disable a keyword without deleting it.

#### Scenario: User deactivates a keyword

- **WHEN** a user toggles a keyword's active switch to off
- **THEN** the `Keyword.active` field SHALL be set to `false`
- **AND** the keyword SHALL NOT appear in the `GET /api/worker/keywords` response

#### Scenario: User reactivates a keyword

- **WHEN** a user toggles a keyword's active switch to on
- **THEN** the `Keyword.active` field SHALL be set to `true`
- **AND** the keyword SHALL appear in the next `GET /api/worker/keywords` response
