## ADDED Requirements

### Requirement: Global Toast notification system displays operation feedback

The system SHALL provide a global Toast notification system accessible from any page in the webapp. Toasts SHALL appear in the bottom-right corner of the viewport with a slide-in animation and SHALL auto-dismiss after 3 seconds. Three types SHALL be supported: `success` (green), `error` (red), and `info` (blue).

#### Scenario: Toast is shown after successful keyword creation

- **WHEN** a user successfully submits the keyword creation form
- **THEN** a `success` Toast SHALL appear in the bottom-right corner with the message "關鍵字已新增"
- **AND** the Toast SHALL auto-dismiss after 3 seconds
- **AND** any previous inline success message SHALL be removed

#### Scenario: Toast is shown after failed keyword deletion

- **WHEN** keyword deletion returns an API error
- **THEN** an `error` Toast SHALL appear with a message describing the failure
- **AND** the Toast SHALL auto-dismiss after 3 seconds

#### Scenario: Multiple Toasts stack vertically

- **WHEN** two Toast notifications are triggered in quick succession
- **THEN** both SHALL be visible simultaneously, stacked vertically in the bottom-right corner
- **AND** each SHALL dismiss independently after its own 3-second timer

#### Scenario: Toast is shown after successful keyword update

- **WHEN** a user successfully submits the keyword edit form
- **THEN** a `success` Toast SHALL appear with the message "關鍵字已更新"
- **AND** the Toast SHALL auto-dismiss after 3 seconds

#### Scenario: Toast is shown after successful keyword deletion

- **WHEN** a user confirms deletion of a keyword and the API returns success
- **THEN** a `success` Toast SHALL appear with the message "關鍵字已刪除"
- **AND** the Toast SHALL auto-dismiss after 3 seconds

### Requirement: ToastProvider is mounted at root layout level

The system SHALL mount a `ToastProvider` component at the root layout (`webapp/app/layout.tsx`) so that all child pages and components can trigger Toasts via the `useToast()` hook without additional setup.

#### Scenario: Any page can trigger a Toast

- **WHEN** any component in the component tree calls `useToast().addToast(message, type)`
- **THEN** the Toast SHALL appear in the bottom-right corner of the viewport
- **AND** the component does NOT need to render its own Toast container

#### Scenario: useToast used outside ToastProvider throws an error

- **WHEN** a component calls `useToast()` but is rendered outside `<ToastProvider>`
- **THEN** the hook SHALL throw an error with the message "useToast must be used within a ToastProvider"
