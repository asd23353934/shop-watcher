## ADDED Requirements

### Requirement: CircleFollow creation accepts tagIds field

The system SHALL accept an optional `tagIds` field (array of string) in `POST /api/circles`. Each id MUST reference a `Tag` row owned by the authenticated user. On success, a `CircleFollowTag` row SHALL be created for each valid id.

#### Scenario: CircleFollow created with tagIds

- **WHEN** a user submits `POST /api/circles` with `{ "platform": "booth", "circleId": "x", "circleName": "X", "tagIds": ["tag-1"] }` and owns `tag-1`
- **THEN** the `CircleFollow` row SHALL be created
- **AND** one `CircleFollowTag` row linking the new follow to `tag-1` SHALL be created

#### Scenario: CircleFollow created without tagIds

- **WHEN** a user submits `POST /api/circles` without `tagIds`
- **THEN** the `CircleFollow` row SHALL be created
- **AND** no `CircleFollowTag` rows SHALL be created

#### Scenario: tagIds referencing another user's tag is rejected

- **WHEN** a user submits `POST /api/circles` with a `tagIds` entry whose `Tag.userId` differs from the authenticated user
- **THEN** the API SHALL return HTTP 403
- **AND** no `CircleFollow` or `CircleFollowTag` row SHALL be created

---

### Requirement: CircleFollow edit accepts tagIds field

The system SHALL accept an optional `tagIds` field in `PATCH /api/circles/[id]`. When present, the follow's tag associations SHALL be replaced with the provided set. Same ownership validation as creation applies.

#### Scenario: User replaces a CircleFollow's tag set

- **WHEN** a follow currently has tags `[A, B]` and the user calls `PATCH /api/circles/{id}` with `{ "tagIds": ["B", "C"] }`
- **THEN** the `CircleFollowTag` row linking to `A` SHALL be deleted
- **AND** a new `CircleFollowTag` row linking to `C` SHALL be created

#### Scenario: User clears all tags from a CircleFollow

- **WHEN** a user calls `PATCH /api/circles/{id}` with `{ "tagIds": [] }`
- **THEN** all existing `CircleFollowTag` rows for that follow SHALL be deleted

#### Scenario: Omitting tagIds leaves tags unchanged

- **WHEN** a user calls `PATCH /api/circles/{id}` without a `tagIds` field
- **THEN** the follow's existing `CircleFollowTag` rows SHALL NOT be modified

---

### Requirement: GET /api/circles response includes tags

The `GET /api/circles` response SHALL include a `tags` array on each CircleFollow object, containing `{ id, name, color }` for each tag associated via `CircleFollowTag`.

#### Scenario: Circle list response includes tag details

- **WHEN** an authenticated user calls `GET /api/circles`
- **THEN** each follow in the response SHALL include a `tags` array
- **AND** each tag object SHALL contain `id`, `name`, and `color`

#### Scenario: CircleFollow with no tags returns empty array

- **WHEN** a CircleFollow has no `CircleFollowTag` rows
- **THEN** its `tags` field SHALL be `[]`
