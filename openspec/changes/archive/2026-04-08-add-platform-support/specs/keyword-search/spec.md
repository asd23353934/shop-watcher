## ADDED Requirements

### Requirement: Platform selection UI shows all supported platforms

The frontend keyword creation and editing forms SHALL display checkboxes for each currently supported platform. The supported platform list SHALL be sourced from `webapp/constants/platform.ts` (`PLATFORM_LABELS`). The hardcoded `['shopee', 'ruten']` arrays in `KeywordForm.tsx` and `KeywordList.tsx` SHALL be replaced with `Object.keys(PLATFORM_LABELS)`.

Supported platforms: `ruten` (露天拍賣), `pchome` (PChome 24h), `momo` (MOMO購物), `animate` (Animate台灣), `yahoo-auction` (Yahoo拍賣), `mandarake` (Mandarake), `myacg` (買動漫), `kingstone` (金石堂 ACG)

#### Scenario: New keyword form shows all supported platforms as checkboxes

- **WHEN** a user opens the new keyword form
- **THEN** the form SHALL display one checkbox per entry in `PLATFORM_LABELS`
- **AND** SHALL NOT display a checkbox for `shopee`
- **AND** the default selected platform SHALL be `ruten` only (first platform)

#### Scenario: Edit keyword form shows all supported platforms

- **WHEN** a user opens the edit form for an existing keyword
- **THEN** the form SHALL display checkboxes for all platforms in `PLATFORM_LABELS`
- **AND** previously selected platforms SHALL be pre-checked

#### Scenario: Platform badge display uses PLATFORM_LABELS

- **WHEN** a keyword card displays its selected platforms as badges
- **THEN** each badge SHALL show the display label from `PLATFORM_LABELS[platform]`
- **AND** unknown platform keys SHALL fall back to displaying the raw platform string

## REMOVED Requirements

### Requirement: Shopee search navigates to homepage first to obtain session cookies

**Reason**: Shopee scraping is suspended. The homepage pre-navigation logic in `scrape_shopee` is no longer executed.

**Migration**: No frontend migration required. Backend `shopee.py` file is retained but not called from the scheduler.

#### Scenario: Shopee homepage pre-navigation is no longer triggered

- **WHEN** the scheduler processes a keyword with `platform="shopee"`
- **THEN** `scrape_shopee` SHALL NOT be called
- **AND** the Shopee homepage SHALL NOT be visited

### Requirement: Shopee search returns newest listings sorted by creation time

**Reason**: Shopee scraping is suspended. The five-layer fallback strategy is no longer active.

**Migration**: No migration required. The `shopee.py` file is retained for potential future reactivation.

#### Scenario: Shopee five-layer fallback is not executed

- **WHEN** the scheduler encounters `platform="shopee"` for any keyword
- **THEN** none of the five scraping layers (httpx, Playwright intercept, browser fetch, page state, DOM) SHALL be executed
- **AND** the scheduler SHALL log a WARNING and skip the keyword-platform pair
