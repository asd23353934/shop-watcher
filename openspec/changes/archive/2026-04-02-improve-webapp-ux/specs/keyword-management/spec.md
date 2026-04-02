## MODIFIED Requirements

### Requirement: Authenticated user can create a keyword

The system SHALL allow an authenticated user to create a new keyword with platform selection, optional price range, and active status. After a successful creation, the keyword list SHALL be updated without requiring a full page reload. On success, the system SHALL display a `success` Toast notification with the message "關鍵字已新增" instead of inline success text. On failure, the system SHALL display an `error` Toast notification with a message describing the failure instead of inline error text.

#### Scenario: User creates a keyword with required fields

- **WHEN** a user submits the keyword creation form with a non-empty `keyword` string and at least one platform selected (`shopee` or `ruten`)
- **THEN** a `Keyword` row SHALL be created in the database with `userId` set to the authenticated user's ID
- **AND** `active` SHALL default to `true`
- **AND** the keyword list SHALL refresh and display the new keyword without a full page reload
- **AND** a `success` Toast SHALL appear with the message "關鍵字已新增"

#### Scenario: Keyword creation with price range

- **WHEN** a user submits a keyword with `minPrice: 1000` and `maxPrice: 5000`
- **THEN** the `Keyword` row SHALL store `minPrice: 1000` and `maxPrice: 5000`
- **AND** the Worker SHALL receive these values in `GET /api/worker/keywords` response

#### Scenario: Keyword creation with empty keyword string is rejected

- **WHEN** a user submits the form with an empty `keyword` field
- **THEN** the system SHALL return a validation error
- **AND** no `Keyword` row SHALL be created
- **AND** an `error` Toast SHALL appear describing the validation failure

#### Scenario: Keyword creation with no platform selected is rejected

- **WHEN** a user submits the form without selecting any platform
- **THEN** the system SHALL return a validation error
- **AND** no `Keyword` row SHALL be created
- **AND** an `error` Toast SHALL appear describing the validation failure

### Requirement: Authenticated user can edit an existing keyword

The system SHALL allow a user to update any field of a keyword they own. On success, the system SHALL display a `success` Toast notification with the message "關鍵字已更新". On failure, the system SHALL display an `error` Toast.

#### Scenario: User updates keyword text

- **WHEN** a user submits an edit form for their own keyword with a new `keyword` string
- **THEN** the `Keyword` row SHALL be updated in the database
- **AND** the updated value SHALL appear in the keyword list
- **AND** a `success` Toast SHALL appear with the message "關鍵字已更新"

#### Scenario: User cannot edit another user's keyword

- **WHEN** a user attempts to update a `Keyword` row that belongs to a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain unchanged
- **AND** an `error` Toast SHALL appear with an appropriate error message

### Requirement: Authenticated user can delete a keyword

The system SHALL allow a user to permanently delete a keyword they own. On success, the system SHALL display a `success` Toast notification with the message "關鍵字已刪除". On failure, the system SHALL display an `error` Toast.

#### Scenario: User deletes their own keyword

- **WHEN** a user confirms deletion of a keyword they own
- **THEN** the `Keyword` row SHALL be deleted from the database
- **AND** the keyword SHALL no longer appear in the user's list
- **AND** the associated `SeenItem` rows SHALL NOT be deleted (historical record preserved)
- **AND** a `success` Toast SHALL appear with the message "關鍵字已刪除"

#### Scenario: User cannot delete another user's keyword

- **WHEN** a user attempts to delete a `Keyword` row with a different `userId`
- **THEN** the API SHALL return HTTP 403
- **AND** the `Keyword` row SHALL remain in the database
- **AND** an `error` Toast SHALL appear with an appropriate error message


## ADDED Requirements

### Requirement: Dashboard displays statistics summary block

The system SHALL display a statistics block at the top of the Dashboard showing the total number of active keywords and the count of notifications sent today.

#### Scenario: Statistics block shows keyword count

- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the statistics block SHALL display the total number of keywords owned by that user
- **AND** the label SHALL read "監控關鍵字"

#### Scenario: Statistics block shows today's notification count

- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the statistics block SHALL display the count of SeenItem rows created today (UTC+8) for that user
- **AND** the label SHALL read "今日通知"

#### Scenario: Statistics block shows Skeleton while loading

- **WHEN** the statistics data is being fetched
- **THEN** the statistics block SHALL display 2 Skeleton stat card placeholders
- **AND** once data is received, the Skeleton cards SHALL be replaced by real numbers

### Requirement: Keyword card displays platform badge, price range, toggle state, and last scan time

The system SHALL display each keyword card with a platform badge per selected platform, the configured price range (if set), and a visually distinct active/inactive toggle (green when active, gray when inactive).

#### Scenario: Keyword card shows Shopee platform badge

- **WHEN** a keyword has `platforms` containing `"shopee"`
- **THEN** the keyword card SHALL display a badge with the text "蝦皮" using `bg-orange-100 text-orange-700` styling

#### Scenario: Keyword card shows Ruten platform badge

- **WHEN** a keyword has `platforms` containing `"ruten"`
- **THEN** the keyword card SHALL display a badge with the text "露天" using `bg-blue-100 text-blue-700` styling

#### Scenario: Keyword card shows price range when configured

- **WHEN** a keyword has `minPrice` or `maxPrice` set (non-null)
- **THEN** the keyword card SHALL display the price range in the format "NT$ {minPrice} – {maxPrice}"
- **AND** if only `minPrice` is set, the format SHALL be "NT$ {minPrice} 以上"
- **AND** if only `maxPrice` is set, the format SHALL be "NT$ {maxPrice} 以下"

#### Scenario: Keyword card shows no price range when not configured

- **WHEN** both `minPrice` and `maxPrice` are null
- **THEN** no price range text SHALL be shown on the keyword card

#### Scenario: Active keyword toggle is visually green

- **WHEN** a keyword has `active: true`
- **THEN** the toggle control on the keyword card SHALL render with green styling (`bg-green-500`)

#### Scenario: Inactive keyword toggle is visually gray

- **WHEN** a keyword has `active: false`
- **THEN** the toggle control on the keyword card SHALL render with gray styling (`bg-gray-300`)

### Requirement: Navbar includes hamburger menu for mobile navigation

The system SHALL display a hamburger menu icon on viewports narrower than `md` breakpoint (768px). Tapping the icon SHALL expand a vertical navigation list. Tapping a nav item or the icon again SHALL collapse the menu.

#### Scenario: Hamburger icon is visible on mobile

- **WHEN** the viewport width is less than 768px
- **THEN** a hamburger icon button (three horizontal lines) SHALL be visible in the Navbar
- **AND** the regular horizontal nav links SHALL NOT be visible

#### Scenario: Tapping hamburger expands mobile nav

- **WHEN** a user taps the hamburger icon on a mobile viewport
- **THEN** a vertical navigation list SHALL appear below the Navbar header
- **AND** the hamburger icon SHALL change to an X (close) icon

#### Scenario: Tapping a mobile nav link collapses the menu

- **WHEN** a user taps a navigation link in the expanded mobile nav
- **THEN** the mobile nav list SHALL collapse
- **AND** the browser SHALL navigate to the selected page
