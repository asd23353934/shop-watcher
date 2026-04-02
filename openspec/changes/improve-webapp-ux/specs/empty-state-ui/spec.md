## ADDED Requirements

### Requirement: Empty keyword list displays a guided Empty State

The system SHALL display an Empty State UI when an authenticated user has no keywords. The Empty State SHALL include an illustrative icon, a heading "尚無監控關鍵字", a subtitle "新增你的第一個監控關鍵字，開始接收商品通知", and SHALL NOT display an error message.

#### Scenario: Empty State is shown when user has zero keywords

- **WHEN** an authenticated user navigates to `/dashboard` and has no keywords
- **THEN** the keyword list area SHALL display the Empty State component
- **AND** the Empty State SHALL show the heading "尚無監控關鍵字"
- **AND** the Empty State SHALL show the subtitle "新增你的第一個監控關鍵字，開始接收商品通知"
- **AND** no error indicator SHALL be shown

#### Scenario: Empty State disappears after first keyword is added

- **WHEN** a user creates their first keyword via the keyword creation form
- **THEN** the Empty State component SHALL be replaced by the keyword card for the newly created keyword
- **AND** the Empty State SHALL NOT reappear unless all keywords are subsequently deleted

### Requirement: Empty notification history displays a guided Empty State

The system SHALL display an Empty State UI on the `/history` page when the authenticated user has no SeenItem rows. The Empty State SHALL include a descriptive message indicating no notifications have been sent yet.

#### Scenario: Empty State is shown on history page with no records

- **WHEN** an authenticated user navigates to `/history` and has no SeenItem rows
- **THEN** the history page SHALL display the Empty State component
- **AND** the message SHALL read "尚無通知紀錄"
- **AND** a subtitle SHALL read "當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
- **AND** no table or list SHALL be rendered

#### Scenario: Empty State is replaced once a notification exists

- **WHEN** the user has at least one SeenItem row and navigates to `/history`
- **THEN** the Empty State SHALL NOT be displayed
- **AND** the notification history list SHALL be shown instead
