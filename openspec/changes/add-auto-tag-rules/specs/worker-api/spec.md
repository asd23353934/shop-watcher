## ADDED Requirements

### Requirement: notify/batch applies user tag rules to newly inserted SeenItems

`POST /api/worker/notify/batch` SHALL, for each batch, load the target user's enabled `TagRule` rows once, trigger the default-rule seeding routine if the user has not been seeded, and apply each enabled rule's regex (case-insensitive) against the `title` field of every SeenItem that is newly inserted during the batch. Matching rules SHALL produce `SeenItemTag(seenItemId, tagId)` rows written via `createMany({ skipDuplicates: true })`. Rules SHALL NOT be applied to SeenItem rows that already existed prior to the batch. The batch response body and HTTP semantics SHALL remain unchanged from the existing contract.

#### Scenario: Newly inserted item gets tags from matching rules

- **WHEN** the worker posts a batch that results in a new SeenItem with title "nendoroid IA"
- **AND** the user has enabled rules mapping `nendoroid` → `模型` and `IA` → `IA`
- **THEN** the system SHALL insert two `SeenItemTag` rows linking the new SeenItem to both tags
- **AND** the HTTP response SHALL be identical in shape and status to a batch with no tag rules configured

#### Scenario: Already-existing SeenItem skipped

- **WHEN** a batch entry corresponds to a SeenItem that already exists (price update only)
- **THEN** the system SHALL NOT evaluate tag rules against that row
- **AND** no `SeenItemTag` rows SHALL be inserted or mutated for that row

#### Scenario: Rule evaluation failure does not break the batch

- **WHEN** a stored pattern fails to compile at worker runtime
- **THEN** the system SHALL log a warning with the rule id and user id
- **AND** the batch SHALL continue processing the remaining rules and items
- **AND** the HTTP response SHALL still report success for valid items

#### Scenario: First batch for a user triggers default-rule seeding

- **WHEN** a batch is posted for a user with zero `TagRule` rows
- **THEN** the system SHALL create the default `TagRule` rows (and associated `Tag` rows when missing) for that user before evaluating rules
- **AND** the first batch's newly inserted SeenItems SHALL be tagged using the freshly seeded rules
