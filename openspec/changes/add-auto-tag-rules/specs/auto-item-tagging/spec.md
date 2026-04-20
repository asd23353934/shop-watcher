## ADDED Requirements

### Requirement: System seeds default tag rules per user on demand

The system SHALL maintain a curated list of default tag rules (patterns and target tag names) in code. When a user first accesses tag rule endpoints or triggers SeenItem ingestion, the system SHALL ensure each default rule exists for that user by upserting the target `Tag` (scoped by `(userId, name)`) and creating a corresponding `TagRule` row with `systemDefault=true` and `enabled=true`. Seeding SHALL be idempotent: subsequent calls SHALL NOT create duplicate Tag or TagRule rows.

#### Scenario: First access seeds all default rules

- **WHEN** an authenticated user calls `GET /api/tag-rules` for the first time
- **AND** the user has zero `TagRule` rows with `systemDefault=true`
- **THEN** the system SHALL create one `Tag` per unique default tag name (using existing Tag if `(userId, name)` already matches)
- **AND** the system SHALL create one `TagRule(systemDefault=true, enabled=true, userId=<user>)` per default rule
- **AND** the response SHALL include the newly seeded rules

#### Scenario: Seeding is idempotent

- **WHEN** the seeding routine runs and the user already has all default rules
- **THEN** no new `Tag` or `TagRule` rows SHALL be created
- **AND** existing rows SHALL NOT be modified (including user-toggled `enabled` flag)

#### Scenario: Seed adds newly introduced default rules without duplicating existing ones

- **WHEN** the default rule list is extended with new entries
- **AND** an existing user triggers seeding
- **THEN** only the missing default rules SHALL be created for that user
- **AND** previously seeded rules SHALL remain unchanged

### Requirement: System backfills recent SeenItems on first seed

When the seeding routine creates at least one new `TagRule` row for a user (indicating this is the user's first seeding), the system SHALL apply every freshly enabled rule against all `SeenItem` rows belonging to that user in the retention window (rows preserved by `cleanup.ts`, currently 30 days). Matching rules SHALL produce `SeenItemTag` rows via `createMany({ skipDuplicates: true })`. Subsequent seeding calls (when no new rules are created) SHALL NOT trigger backfill. Manual or automatic backfill on later rule creation, edit, enable, or disable SHALL NOT occur.

#### Scenario: First-time seed populates historical items

- **WHEN** a user with 150 existing SeenItem rows triggers seeding for the first time
- **AND** seeding creates 30 new TagRule rows
- **THEN** the system SHALL evaluate all 30 rules against each of the 150 SeenItem titles
- **AND** matching pairs SHALL be inserted into `SeenItemTag`
- **AND** the call SHALL complete synchronously before returning the rule list

#### Scenario: Idempotent seed does not re-run backfill

- **WHEN** a user who has already been seeded triggers seeding again
- **AND** no new TagRule rows are created
- **THEN** the system SHALL NOT iterate over existing SeenItem rows
- **AND** no `SeenItemTag` rows SHALL be inserted

#### Scenario: Creating a new user rule does not backfill

- **WHEN** a user creates a new TagRule via `POST /api/tag-rules` after initial seeding
- **THEN** the system SHALL NOT apply the new rule to any existing SeenItem row
- **AND** only future newly-inserted SeenItems SHALL be evaluated against the new rule

### Requirement: User can list their tag rules

The system SHALL expose `GET /api/tag-rules` for authenticated users. The response SHALL include every `TagRule` row belonging to the user (system-defaulted and user-created), each annotated with the associated tag's `id`, `name`, and `color`. The endpoint SHALL trigger the seeding routine described above before returning.

#### Scenario: Response includes both system and user rules

- **WHEN** an authenticated user with 5 user-created rules and 30 system-defaulted rules calls `GET /api/tag-rules`
- **THEN** the response SHALL return an array of 35 rule objects
- **AND** each object SHALL include `id`, `pattern`, `enabled`, `systemDefault`, and `tag: { id, name, color }`

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request to `GET /api/tag-rules` arrives without a valid session
- **THEN** the system SHALL respond with HTTP 401 and `{ "error": "未授權" }`

### Requirement: User can create a tag rule

The system SHALL expose `POST /api/tag-rules` accepting `{ pattern: string, tagId: string }`. The system SHALL validate that `tagId` references a `Tag` owned by the requesting user, SHALL validate that `pattern` is a non-empty string that compiles as a JavaScript regular expression, and SHALL reject patterns that fail a catastrophic-backtracking safety check. On success, the system SHALL create a `TagRule(systemDefault=false, enabled=true, userId=<user>)` and return the rule with its `tag` relation included.

#### Scenario: Successful creation

- **WHEN** an authenticated user posts `{ "pattern": "figma", "tagId": "tag_123" }` and owns tag `tag_123`
- **THEN** the system SHALL create a new TagRule row with `systemDefault=false` and `enabled=true`
- **AND** the response SHALL be HTTP 201 with the created rule and embedded tag object

#### Scenario: Invalid regex pattern rejected

- **WHEN** a user posts `{ "pattern": "(unclosed", "tagId": "tag_123" }`
- **THEN** the system SHALL respond with HTTP 422 and `{ "error": "規則格式錯誤" }`
- **AND** no TagRule row SHALL be created

#### Scenario: Pattern that triggers catastrophic backtracking rejected

- **WHEN** a user posts a pattern flagged unsafe by the safety check (for example `(a+)+b`)
- **THEN** the system SHALL respond with HTTP 422 and `{ "error": "規則過於複雜，可能導致效能問題" }`
- **AND** no TagRule row SHALL be created

#### Scenario: Tag not owned by user rejected

- **WHEN** a user posts a `tagId` that belongs to another user or does not exist
- **THEN** the system SHALL respond with HTTP 404 and `{ "error": "標籤不存在" }`
- **AND** no TagRule row SHALL be created

### Requirement: User can update a tag rule

The system SHALL expose `PATCH /api/tag-rules/[id]` accepting any subset of `{ pattern, tagId, enabled }`. The system SHALL verify the rule belongs to the requesting user, SHALL apply the same `pattern` / `tagId` validations as the create endpoint when those fields are present, and SHALL permit changing `enabled` on both user-created and system-defaulted rules. Updating `pattern` or `tagId` SHALL be rejected with HTTP 403 when the target rule has `systemDefault=true`.

#### Scenario: User toggles a system-defaulted rule off

- **WHEN** an authenticated user patches their system rule `rule_42` with `{ "enabled": false }`
- **THEN** the system SHALL set `enabled=false` on the rule
- **AND** the response SHALL be HTTP 200 with the updated rule
- **AND** `systemDefault` SHALL remain `true`

#### Scenario: User edits their own rule pattern

- **WHEN** an authenticated user patches their user-created rule with `{ "pattern": "nendoroid" }`
- **THEN** the system SHALL validate and persist the new pattern
- **AND** the response SHALL be HTTP 200

#### Scenario: Attempt to edit a system rule's pattern rejected

- **WHEN** a user patches a system-defaulted rule with `{ "pattern": "custom" }`
- **THEN** the system SHALL respond with HTTP 403 and `{ "error": "系統預設規則僅能啟用或停用" }`

#### Scenario: Rule owned by another user rejected

- **WHEN** a user patches a rule whose `userId` does not match the session user
- **THEN** the system SHALL respond with HTTP 404 and `{ "error": "規則不存在" }`

### Requirement: User can delete a tag rule

The system SHALL expose `DELETE /api/tag-rules/[id]` that removes user-created rules. System-defaulted rules SHALL NOT be deletable; the endpoint SHALL respond with HTTP 403 instead.

#### Scenario: Delete user-created rule

- **WHEN** an authenticated user deletes their own user-created rule
- **THEN** the system SHALL remove the TagRule row
- **AND** existing `SeenItemTag` rows created by that rule SHALL remain (historical tags not retroactively cleared)
- **AND** the response SHALL be HTTP 204

#### Scenario: Delete system-defaulted rule rejected

- **WHEN** a user attempts to delete a rule with `systemDefault=true`
- **THEN** the system SHALL respond with HTTP 403 and `{ "error": "系統預設規則不可刪除，可改為停用" }`

### Requirement: Worker applies enabled rules when inserting new SeenItems

The system SHALL apply the authenticated user's enabled tag rules (both system-defaulted and user-created) against the `title` field of each newly inserted SeenItem row inside `POST /api/worker/notify/batch`. Matching rules SHALL produce `SeenItemTag(seenItemId, tagId)` rows inserted via `createMany({ skipDuplicates: true })`. Rules SHALL NOT be applied to SeenItem rows that already existed before the batch (price-drop updates). Pattern matching SHALL be case-insensitive. Pattern compilation errors or matching errors for a single rule SHALL NOT fail the batch; they SHALL be logged and skipped.

#### Scenario: New SeenItem receives matching tags

- **WHEN** the worker batch inserts a new SeenItem with title "figma 初音ミク 1/7 PVC"
- **AND** the user has an enabled rule `pattern="figma"` linked to tag `模型`
- **AND** the user has an enabled rule `pattern="初音"` linked to tag `初音`
- **THEN** two `SeenItemTag` rows SHALL be created linking this SeenItem to both tags

#### Scenario: Existing SeenItem updated by price-drop is not re-tagged

- **WHEN** the worker batch encounters a SeenItem that already exists and updates its `lastPrice`
- **THEN** no new `SeenItemTag` rows SHALL be created for that row
- **AND** previously written tags SHALL remain untouched

#### Scenario: Disabled rule is ignored

- **WHEN** a user's rule has `enabled=false`
- **AND** a new SeenItem title matches that rule's pattern
- **THEN** no `SeenItemTag` SHALL be created for that pattern

#### Scenario: Broken rule does not crash the batch

- **WHEN** a rule's stored pattern fails to compile at worker runtime
- **THEN** the system SHALL log a warning with the rule id
- **AND** the rest of the rules SHALL continue to be evaluated for all items in the batch
- **AND** the batch response SHALL remain unchanged

### Requirement: Rule management UI on settings page

The settings page (`/settings`) SHALL include a "標籤規則" section rendering a `TagRuleManager` component. The component SHALL list the user's rules grouped by `systemDefault`, expose enable/disable toggles for all rules, expose delete for user-created rules only, expose an "新增規則" form that accepts a `pattern` text input (with inline regex compile validation) and a tag selector restricted to the user's existing tags (no free-text tag name entry), and expose inline edit for user-created rule patterns and tag assignments.

#### Scenario: User toggles a system default off from the UI

- **WHEN** the user clicks the switch next to a system-defaulted rule
- **THEN** the UI SHALL call `PATCH /api/tag-rules/[id]` with `{ "enabled": false }`
- **AND** the rule row SHALL render as disabled
- **AND** future worker batches SHALL skip that rule

#### Scenario: Tag selector hides the option to create new tags inline

- **WHEN** the user opens the new-rule form
- **THEN** the tag selector SHALL list only tags the user already owns
- **AND** the selector SHALL NOT show an "新增標籤" input (tags are created in `TagManager` or via `TagSelector` on keyword / circle forms)

#### Scenario: Invalid regex input is flagged before submit

- **WHEN** the user types an invalid regex such as `(unclosed` into the pattern field
- **THEN** the form SHALL display an inline error message "規則格式錯誤"
- **AND** the submit button SHALL be disabled until the pattern compiles
