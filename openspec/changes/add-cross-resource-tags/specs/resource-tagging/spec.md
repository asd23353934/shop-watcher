## ADDED Requirements

### Requirement: User can create a tag

The system SHALL allow an authenticated user to create a personal tag with a name and optional color. Tag names MUST be unique per user (case-sensitive, trimmed). A tag's `userId` SHALL be set to the authenticated user's ID.

#### Scenario: User creates a tag with name only

- **WHEN** an authenticated user submits `POST /api/tags` with `{ "name": "鬼滅" }`
- **THEN** a `Tag` row SHALL be created with the authenticated user's `userId`, `name: "鬼滅"`, and `color: null`
- **AND** the API SHALL return HTTP 201 with the created tag

#### Scenario: User creates a tag with name and color

- **WHEN** a user submits `POST /api/tags` with `{ "name": "限定", "color": "#FF5733" }`
- **THEN** the `Tag` row SHALL store `color: "#FF5733"`

#### Scenario: Duplicate tag name for the same user is rejected

- **WHEN** a user submits `POST /api/tags` with a `name` that already exists for that user
- **THEN** the API SHALL return HTTP 409
- **AND** no new `Tag` row SHALL be created

#### Scenario: Two users can independently create tags with the same name

- **WHEN** User A creates a tag `{ "name": "鬼滅" }`
- **AND** User B creates a tag `{ "name": "鬼滅" }`
- **THEN** both requests SHALL succeed and return HTTP 201
- **AND** each user SHALL own their own `Tag` row

#### Scenario: Empty tag name is rejected

- **WHEN** a user submits `POST /api/tags` with `{ "name": "" }` or `{ "name": "   " }`
- **THEN** the API SHALL return HTTP 400
- **AND** no `Tag` row SHALL be created

#### Scenario: Invalid color format is rejected

- **WHEN** a user submits `POST /api/tags` with `{ "name": "x", "color": "red" }`
- **THEN** the API SHALL return HTTP 400 because `color` does not match `/^#[0-9A-Fa-f]{6}$/`

---

### Requirement: User can list their own tags

The system SHALL allow an authenticated user to retrieve all tags they own via `GET /api/tags`. The response SHALL include each tag's id, name, color, and the count of Keywords and CircleFollows it is applied to.

#### Scenario: GET /api/tags returns only the user's tags

- **WHEN** an authenticated user calls `GET /api/tags`
- **THEN** the response SHALL contain only `Tag` rows where `userId` equals the authenticated user's ID
- **AND** tags belonging to other users SHALL NOT appear

#### Scenario: Each tag includes usage counts

- **WHEN** `GET /api/tags` is called
- **THEN** each tag object SHALL include `keywordCount` (number of KeywordTag rows referencing this tag) and `circleCount` (number of CircleFollowTag rows referencing this tag)

---

### Requirement: User can update a tag they own

The system SHALL allow a user to update the `name` and/or `color` of a tag they own via `PATCH /api/tags/[id]`. Updating `name` MUST preserve `(userId, name)` uniqueness.

#### Scenario: User renames their tag

- **WHEN** a user calls `PATCH /api/tags/{id}` with `{ "name": "新名稱" }` for a tag they own
- **THEN** the `Tag.name` SHALL be updated
- **AND** the API SHALL return HTTP 200 with the updated tag

#### Scenario: User updates tag color

- **WHEN** a user calls `PATCH /api/tags/{id}` with `{ "color": "#00AAFF" }`
- **THEN** the `Tag.color` SHALL be updated

#### Scenario: User cannot update another user's tag

- **WHEN** a user calls `PATCH /api/tags/{id}` where the tag's `userId` differs from the authenticated user
- **THEN** the API SHALL return HTTP 403
- **AND** the `Tag` row SHALL remain unchanged

#### Scenario: Renaming to an existing name for the same user is rejected

- **WHEN** a user owns tags `"A"` and `"B"` and calls `PATCH /api/tags/{B.id}` with `{ "name": "A" }`
- **THEN** the API SHALL return HTTP 409
- **AND** tag `B` SHALL remain unchanged

---

### Requirement: User can delete a tag they own

The system SHALL allow a user to delete a tag they own via `DELETE /api/tags/[id]`. Deleting a tag SHALL cascade-remove all `KeywordTag` and `CircleFollowTag` rows referencing that tag, but SHALL NOT delete the referenced Keyword or CircleFollow rows.

#### Scenario: User deletes their tag

- **WHEN** a user calls `DELETE /api/tags/{id}` for a tag they own
- **THEN** the `Tag` row SHALL be deleted
- **AND** all `KeywordTag` rows where `tagId` matches SHALL be deleted
- **AND** all `CircleFollowTag` rows where `tagId` matches SHALL be deleted
- **AND** no `Keyword` or `CircleFollow` row SHALL be deleted

#### Scenario: User cannot delete another user's tag

- **WHEN** a user calls `DELETE /api/tags/{id}` for a tag owned by a different user
- **THEN** the API SHALL return HTTP 403
- **AND** the `Tag` row SHALL remain

---

### Requirement: Dashboard supports tag filter chips

The Dashboard page SHALL display a tag filter bar containing one chip per tag owned by the current user. Selecting one or more chips SHALL filter the keyword list to only those keywords whose tag set contains ALL selected tags (AND semantics). Clearing selection SHALL restore the full list.

#### Scenario: User selects one tag chip

- **WHEN** a user clicks a tag chip labeled `"鬼滅"` in the Dashboard filter bar
- **THEN** the keyword list SHALL display only keywords that have `"鬼滅"` in their tag set

#### Scenario: User selects multiple tag chips (AND)

- **WHEN** a user selects chips `"鬼滅"` and `"限定"`
- **THEN** the keyword list SHALL display only keywords whose tag set contains BOTH `"鬼滅"` AND `"限定"`

#### Scenario: User clears tag selection

- **WHEN** a user deselects all tag chips
- **THEN** the keyword list SHALL display all of the user's keywords

#### Scenario: Filter bar is hidden when user has no tags

- **WHEN** an authenticated user has zero `Tag` rows
- **THEN** the tag filter bar SHALL NOT be rendered on the Dashboard

---

### Requirement: Circles page supports tag filter chips

The Circles page SHALL display a tag filter bar with the same behavior as the Dashboard, filtering the CircleFollow list by tag using AND semantics.

#### Scenario: User filters circle list by tag

- **WHEN** a user selects a tag chip on `/circles`
- **THEN** the CircleFollow list SHALL display only follows whose tag set contains the selected tag

#### Scenario: User filters circle list by multiple tags (AND)

- **WHEN** a user selects two tag chips
- **THEN** the CircleFollow list SHALL display only follows whose tag set contains both selected tags

---

### Requirement: Resource cards display their tags

Both `KeywordCard` and `CircleFollowCard` components SHALL render each associated tag as a colored chip using the tag's `color` (default gray when `color` is null).

#### Scenario: Keyword card shows tag chips

- **WHEN** a keyword has 2 associated tags
- **THEN** the keyword card SHALL render 2 tag chips, each displaying the tag name and background styled with the tag's color

#### Scenario: Circle follow card shows tag chips

- **WHEN** a CircleFollow has 1 associated tag
- **THEN** the circle follow card SHALL render 1 tag chip with the tag name and color

#### Scenario: Tag with null color renders with default styling

- **WHEN** a tag's `color` is null
- **THEN** the chip SHALL render with a default gray background

---

### Requirement: Tag selector supports inline tag creation

The edit modal for Keyword and CircleFollow SHALL include a tag selector that lists existing tags and allows the user to create a new tag inline. Creating a new tag SHALL call `POST /api/tags` and, on success, SHALL auto-select the newly created tag.

#### Scenario: User picks an existing tag

- **WHEN** a user opens the Keyword edit modal and clicks a tag in the selector
- **THEN** the tag SHALL be marked as selected
- **AND** saving the form SHALL include the tag's id in the `tagIds` array sent to the API

#### Scenario: User creates a new tag from the selector

- **WHEN** a user types `"新IP"` in the selector's create input and confirms
- **THEN** the client SHALL call `POST /api/tags` with `{ "name": "新IP" }`
- **AND** on HTTP 201 response, the new tag SHALL be auto-selected in the current form

#### Scenario: Inline tag creation failure surfaces an error

- **WHEN** `POST /api/tags` returns a non-2xx response during inline creation
- **THEN** the form SHALL display an error message
- **AND** the form SHALL NOT silently proceed without the failed tag
