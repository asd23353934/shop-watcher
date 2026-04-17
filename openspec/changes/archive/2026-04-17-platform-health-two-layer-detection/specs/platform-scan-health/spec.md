## ADDED Requirements

### Requirement: Scrapers perform DOM structure check before extracting items

Each platform scraper module under `src/scrapers/` SHALL implement a `_check_dom_structure(page)` helper that verifies the presence of the outermost, stable container element that hosts search results on that platform (e.g., the main product list wrapper). The scraper's entry function `scrape_<platform>()` SHALL invoke this check before extracting items and SHALL include the boolean result in its return structure as `dom_intact`.

#### Scenario: DOM structure check passes when container is present

- **WHEN** `scrape_ruten(page, keyword)` loads the search results page
- **AND** the expected product list container is present in the DOM
- **THEN** `_check_dom_structure(page)` SHALL return `true`
- **AND** `scrape_ruten` SHALL report `dom_intact=true` in its result

#### Scenario: DOM structure check fails when container is missing

- **WHEN** `scrape_booth(page, keyword)` loads the search results page
- **AND** the expected product list container is absent (site redesign)
- **THEN** `_check_dom_structure(page)` SHALL return `false`
- **AND** `scrape_booth` SHALL report `dom_intact=false`
- **AND** `scrape_booth` SHALL return an empty item list without raising

#### Scenario: DOM check result propagates to canary reporting

- **WHEN** the Worker runs a canary scrape for platform `melonbooks`
- **AND** the scraper returns `dom_intact=false`
- **THEN** the canary record sent via `PATCH /api/worker/canary-status` SHALL include `domIntact=false` for that platform

### Requirement: Dashboard displays canary unhealthy badge next to platform scan health

The Dashboard platform health section SHALL display a warning badge for any platform whose `canaryHealthState` from `GET /api/platform-status` is `unhealthy`. The badge SHALL be visually distinct from the existing `failCount >= 3` indicator so that operators can tell the two signals apart. Hovering the badge SHALL reveal a tooltip containing the `canaryUnhealthyReason` (`empty_canary` or `dom_broken`) and `canaryLastRunAt` formatted as relative time.

#### Scenario: Dashboard shows canary warning badge when platform is unhealthy

- **WHEN** an authenticated user navigates to the Dashboard
- **AND** `GET /api/platform-status` returns `canaryHealthState=unhealthy, canaryUnhealthyReason=dom_broken` for platform `booth`
- **THEN** the Dashboard platform health row for `booth` SHALL display a canary warning badge
- **AND** the badge SHALL be visually distinct from the existing failCount warning indicator

#### Scenario: Dashboard hides canary badge when platform is healthy

- **WHEN** `GET /api/platform-status` returns `canaryHealthState=healthy` for platform `ruten`
- **THEN** the Dashboard platform health row for `ruten` SHALL NOT display a canary warning badge

#### Scenario: Tooltip shows unhealthyReason and lastRunAt

- **WHEN** the user hovers the canary warning badge for platform `melonbooks`
- **THEN** a tooltip SHALL display `canaryUnhealthyReason` (translated to a human-readable label, e.g., "canary 連續 0 筆" or "頁面結構異常")
- **AND** the tooltip SHALL display `canaryLastRunAt` as relative time (e.g., "15 分鐘前")
