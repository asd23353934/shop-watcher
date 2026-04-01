## ADDED Requirements

### Requirement: Duplicate keyword creation is rejected for the same user

The system SHALL prevent a user from creating a keyword with the same `keyword` text and identical `platforms` array as an existing keyword owned by that user. Different users MAY have keywords with identical text and platforms.

#### Scenario: User attempts to create a duplicate keyword

- **WHEN** a user submits a keyword creation form with a `keyword` and `platforms` combination that already exists for that user
- **THEN** the API SHALL return HTTP 409 Conflict
- **AND** no new `Keyword` row SHALL be created in the database
- **AND** the response body SHALL include an error message indicating the keyword already exists

#### Scenario: User creates a keyword that another user already has

- **WHEN** User A submits a keyword that User B already has with the same text and platforms
- **THEN** the API SHALL return HTTP 201 Created
- **AND** a new `Keyword` row SHALL be created for User A

#### Scenario: Same keyword text with different platforms is allowed

- **WHEN** a user submits a keyword with text "藍藍檔案" and platforms `["shopee"]`
- **AND** that user already has a keyword with text "藍藍檔案" and platforms `["shopee", "ruten"]`
- **THEN** the API SHALL return HTTP 201 Created
- **AND** a new `Keyword` row SHALL be created

---

## MODIFIED Requirements

### Requirement: Authenticated user can create a keyword

The system SHALL allow an authenticated user to create a new keyword with platform selection, optional price range, and active status. After a successful creation, the keyword list SHALL be updated without requiring a full page reload.

#### Scenario: User creates a keyword with required fields

- **WHEN** a user submits the keyword creation form with a non-empty `keyword` string and at least one platform selected (`shopee` or `ruten`)
- **THEN** a `Keyword` row SHALL be created in the database with `userId` set to the authenticated user's ID
- **AND** `active` SHALL default to `true`
- **AND** the keyword list SHALL refresh and display the new keyword without a full page reload

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
