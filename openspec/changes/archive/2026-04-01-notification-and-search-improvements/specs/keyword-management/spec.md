## ADDED Requirements

### Requirement: Keyword supports a blocklist of forbidden terms

Each keyword SHALL support a `blocklist` field containing zero or more forbidden terms. Items whose names contain any term from the blocklist SHALL NOT be reported to the user, regardless of keyword match.

#### Scenario: Keyword is created with a blocklist

- **WHEN** a user submits the keyword creation form with one or more comma-separated blocklist terms
- **THEN** the `Keyword` row SHALL be created with `blocklist` set to the parsed array of trimmed, non-empty terms
- **AND** the blocklist SHALL be stored as `String[]` in the database

#### Scenario: Keyword is created without a blocklist

- **WHEN** a user submits the keyword creation form without entering any blocklist terms
- **THEN** the `Keyword` row SHALL be created with `blocklist` set to an empty array `[]`

#### Scenario: Keyword blocklist is updated

- **WHEN** a user edits an existing keyword and changes the blocklist field
- **THEN** the `Keyword.blocklist` SHALL be updated to reflect the new comma-separated terms
