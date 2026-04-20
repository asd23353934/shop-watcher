## ADDED Requirements

### Requirement: History response includes auto-applied tags

`GET /api/history` SHALL include each SeenItem row's auto-applied tags in the response. Each row SHALL expose a `tags` array with objects of shape `{ id, name, color }`. Rows without matching tags SHALL expose an empty array.

#### Scenario: Row with matching rules includes tags

- **WHEN** an authenticated user calls `GET /api/history`
- **AND** a SeenItem row has two associated `SeenItemTag` rows pointing to tags `模型` and `初音`
- **THEN** the corresponding row in the response SHALL include `tags: [{ id, name: "模型", color }, { id, name: "初音", color }]`

#### Scenario: Row without any matching tags returns empty array

- **WHEN** a SeenItem row has no `SeenItemTag` associations
- **THEN** the corresponding row in the response SHALL include `tags: []`

### Requirement: History API supports tagIds filter with AND semantics

`GET /api/history` SHALL accept an optional `tagIds` query parameter (comma-separated tag id list). When present, results SHALL be restricted to SeenItem rows that have a `SeenItemTag` row for every id in the list. Invalid or non-owned tag ids SHALL be silently ignored.

#### Scenario: Filter by single tag

- **WHEN** `GET /api/history?tagIds=tag_model` is called and the user owns `tag_model`
- **THEN** only SeenItem rows with at least one `SeenItemTag` referencing `tag_model` SHALL be returned

#### Scenario: Filter by multiple tags uses AND

- **WHEN** `GET /api/history?tagIds=tag_model,tag_miku` is called
- **THEN** only SeenItem rows that reference BOTH `tag_model` AND `tag_miku` SHALL be returned

#### Scenario: Tag id not owned by user is ignored

- **WHEN** a user calls `GET /api/history?tagIds=someone_elses_tag`
- **THEN** the filter SHALL NOT restrict by that tag id
- **AND** the response SHALL be equivalent to calling the endpoint with no tagIds

### Requirement: History page displays tag chips and supports tag filter bar

The `/history` page SHALL render each row's tags as `TagChip` components adjacent to the item name. Above the history list, the page SHALL render a `TagFilterBar` component showing every tag the user owns (regardless of whether it has been auto-applied to any item). Selecting tags in the filter bar SHALL issue `GET /api/history?tagIds=...` and replace the rendered list. The selection state SHALL be preserved as long as the user stays on the page; reloading the page SHALL reset the filter.

#### Scenario: User filters history via tag chip

- **WHEN** the user clicks a tag chip in the filter bar
- **THEN** the page SHALL fetch `GET /api/history?tagIds=<chip>` and replace rendered rows
- **AND** the clicked chip SHALL render with a selected state indicator

#### Scenario: Empty user has no filter bar

- **WHEN** a user has zero tags
- **THEN** the tag filter bar SHALL render nothing (consistent with existing `TagFilterBar` behavior)
- **AND** history rows SHALL still render with empty `tags: []` arrays
