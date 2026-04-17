## ADDED Requirements

### Requirement: Keyword card shows canary warning icon for unhealthy platforms

The keyword card UI component (`KeywordCard`) SHALL render a small warning icon next to each platform label whose `canaryHealthState` is `unhealthy` (as returned by `GET /api/platform-status`). Hovering the icon SHALL reveal a tooltip with the `canaryUnhealthyReason` and `canaryLastRunAt` so the user can judge whether to keep that platform enabled for the keyword.

#### Scenario: Warning icon appears on platform label when platform is unhealthy

- **WHEN** an authenticated user views their keyword list
- **AND** `GET /api/platform-status` reports `canaryHealthState=unhealthy` for platform `booth`
- **AND** a keyword card includes `booth` among its enabled platforms
- **THEN** the platform label for `booth` in the keyword card SHALL display a warning icon

#### Scenario: Warning icon is absent when all platforms are healthy

- **WHEN** all platforms enabled for a keyword report `canaryHealthState=healthy`
- **THEN** no platform label on the keyword card SHALL display a warning icon

#### Scenario: Tooltip describes the unhealthy reason

- **WHEN** the user hovers the warning icon on a platform label
- **THEN** a tooltip SHALL display the human-readable form of `canaryUnhealthyReason` (e.g., "頁面結構可能已改版" for `dom_broken`, "canary 關鍵字連續無結果" for `empty_canary`)
- **AND** the tooltip SHALL include `canaryLastRunAt` as relative time
