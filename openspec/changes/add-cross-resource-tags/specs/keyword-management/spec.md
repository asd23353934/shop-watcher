## ADDED Requirements

### Requirement: Keyword creation accepts tagIds field

The system SHALL accept an optional `tagIds` field (array of string) in `POST /api/keywords`. Each id in the array MUST reference a `Tag` row owned by the authenticated user. On success, a `KeywordTag` row SHALL be created for each valid id, linking the new keyword to the referenced tags.

#### Scenario: Keyword created with tagIds

- **WHEN** a user submits `POST /api/keywords` with `{ "keyword": "鬼滅", "platforms": ["ruten"], "tagIds": ["tag-1", "tag-2"] }` and owns both referenced tags
- **THEN** the `Keyword` row SHALL be created
- **AND** two `KeywordTag` rows SHALL be created linking the new keyword to `tag-1` and `tag-2`

#### Scenario: Keyword created without tagIds

- **WHEN** a user submits `POST /api/keywords` without a `tagIds` field
- **THEN** the `Keyword` row SHALL be created
- **AND** no `KeywordTag` rows SHALL be created

#### Scenario: tagIds referencing another user's tag is rejected

- **WHEN** a user submits `POST /api/keywords` with a `tagIds` entry whose `Tag.userId` differs from the authenticated user
- **THEN** the API SHALL return HTTP 403
- **AND** no `Keyword` or `KeywordTag` row SHALL be created

#### Scenario: tagIds referencing non-existent tag is rejected

- **WHEN** a user submits `POST /api/keywords` with a `tagIds` entry that does not match any `Tag.id`
- **THEN** the API SHALL return HTTP 400
- **AND** no `Keyword` or `KeywordTag` row SHALL be created

---

### Requirement: Keyword edit accepts tagIds field

The system SHALL accept an optional `tagIds` field in `PATCH /api/keywords/[id]`. When present, the keyword's tag associations SHALL be replaced with the provided set: `KeywordTag` rows not in the new set SHALL be deleted, and rows for new ids SHALL be created. Same ownership validation as creation applies.

#### Scenario: User replaces a keyword's tag set

- **WHEN** a keyword currently has tags `[A, B]` and the user calls `PATCH /api/keywords/{id}` with `{ "tagIds": ["B", "C"] }`
- **THEN** the `KeywordTag` row linking to `A` SHALL be deleted
- **AND** a new `KeywordTag` row linking to `C` SHALL be created
- **AND** the row linking to `B` SHALL remain

#### Scenario: User clears all tags from a keyword

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "tagIds": [] }`
- **THEN** all existing `KeywordTag` rows for that keyword SHALL be deleted

#### Scenario: Omitting tagIds in PATCH leaves tags unchanged

- **WHEN** a user calls `PATCH /api/keywords/{id}` without a `tagIds` field
- **THEN** the keyword's existing `KeywordTag` rows SHALL NOT be modified

---

### Requirement: GET /api/keywords response includes tags

The `GET /api/keywords` response SHALL include a `tags` array on each keyword object, containing `{ id, name, color }` for each tag associated via `KeywordTag`.

#### Scenario: Keyword list response includes tag details

- **WHEN** an authenticated user calls `GET /api/keywords`
- **THEN** each keyword in the response SHALL include a `tags` array
- **AND** each tag object SHALL contain `id`, `name`, and `color` fields

#### Scenario: Keyword with no tags returns empty array

- **WHEN** a keyword has no `KeywordTag` rows
- **THEN** its `tags` field in the response SHALL be an empty array `[]`
