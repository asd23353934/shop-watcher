## ADDED Requirements

### Requirement: History API supports title search via q parameter

The system SHALL accept an optional `q` query parameter on `GET /api/history`. The parameter value SHALL be URL-decoded, trimmed, and split on any Unicode whitespace (including full-width U+3000) into individual tokens. Each token SHALL be applied as a case-insensitive substring match against the `itemName` column. Multiple tokens SHALL be combined with AND semantics: a SeenItem row matches only if every token appears in its `itemName`. Empty `q`, whitespace-only `q`, or absence of the parameter SHALL behave identically to a request without `q` (no title filter applied). Rows with `itemName: null` SHALL NOT match any non-empty `q`.

#### Scenario: Single-term search filters by substring

- **WHEN** an authenticated user calls `GET /api/history?q=%E5%85%AC%E4%BB%94` (URL-encoded `公仔`)
- **THEN** only SeenItem rows whose `itemName` contains `公仔` (case-insensitive) SHALL be returned
- **AND** pagination, keyword filter, and platform filter SHALL continue to apply

#### Scenario: Multi-term search uses AND semantics

- **WHEN** a user calls `GET /api/history?q=%E6%AA%94%E6%A1%88%20%E5%85%AC%E4%BB%94` (URL-encoded `檔案 公仔`)
- **THEN** only SeenItem rows whose `itemName` contains both `檔案` and `公仔` SHALL be returned
- **AND** order of tokens in `q` SHALL NOT affect results

#### Scenario: Case-insensitive matching

- **WHEN** a user calls `GET /api/history?q=Figma`
- **THEN** rows containing `figma`, `FIGMA`, or `Figma` in `itemName` SHALL all match

#### Scenario: Empty or whitespace q is treated as no filter

- **WHEN** a user calls `GET /api/history?q=` or `GET /api/history?q=%20%20` (URL-encoded spaces)
- **THEN** the response SHALL be identical to a request omitting `q`

#### Scenario: Rows with null itemName never match non-empty q

- **WHEN** a SeenItem row has `itemName: null`
- **AND** the request includes `q=anything`
- **THEN** that row SHALL be excluded from the results

### Requirement: History page provides title search input

The `/history` page SHALL render a text input control in the filter bar labelled `搜尋商品名稱`. Typing into the input SHALL debounce by 300ms, after which the page SHALL re-issue `GET /api/history` with the current value as the `q` parameter. Clearing the input SHALL immediately re-issue the request without the `q` parameter (restoring the unfiltered view). The input value SHALL reset to empty on page reload and on manual navigation away and back.

#### Scenario: Typing triggers debounced search

- **WHEN** the user types `檔案 公仔` into the search input
- **THEN** the page SHALL wait 300ms after the last keystroke
- **AND** then issue `GET /api/history?q=%E6%AA%94%E6%A1%88%20%E5%85%AC%E4%BB%94` (additional filters appended as before)
- **AND** the item list SHALL refresh with the response
- **AND** pagination state SHALL reset (first page loaded)

#### Scenario: Clearing the input restores unfiltered view

- **WHEN** the user deletes all characters from the search input
- **THEN** the page SHALL immediately (without waiting 300ms) issue `GET /api/history` without `q`
- **AND** all items matching other filters SHALL be shown

#### Scenario: Search coexists with keyword and platform filters

- **WHEN** the user has `platform=booth` selected and types `公仔` into the search input
- **THEN** after debounce the request SHALL include both `platform=booth` and `q=%E5%85%AC%E4%BB%94`
- **AND** only rows matching both filters SHALL be returned

## REMOVED Requirements

### Requirement: History response includes auto-applied tags

**Reason**: Tag system removed; `SeenItemTag` join table dropped.

**Migration**: Clients previously reading `tags: { id, name, color }[]` per row SHALL remove that field from their type definitions. No replacement field exists; use the new `q` search parameter for filtering and display `itemName` directly.

### Requirement: History API supports tagIds filter with AND semantics

**Reason**: Tag system removed; `tagIds` query parameter is no longer recognised.

**Migration**: Clients previously calling `GET /api/history?tagIds=a,b` SHALL switch to `GET /api/history?q=<term>` with substring search tokens. No automatic translation of tag IDs to search terms is provided.

### Requirement: History page displays tag chips and supports tag filter bar

**Reason**: Tag system removed; `/history` no longer renders `TagChip` or `TagFilterBar` components (both deleted).

**Migration**: Users previously filtering via tag chips SHALL use the new title search input. No visual tag indicator replaces the chips.
