# keyword-search Specification

## Purpose

TBD - created by archiving change 'keyword-shop-watcher'. Update Purpose after archive.

## Requirements

### Requirement: Shopee search navigates to homepage first to obtain session cookies

The system SHALL visit `https://shopee.tw/` before navigating to the search page, to allow Shopee to set the required session cookies and avoid bot-detection redirects to the login page.

#### Scenario: Homepage visit precedes search page navigation

- **WHEN** `ShopeeWatcher.search(keyword)` is called
- **THEN** the browser SHALL first navigate to `https://shopee.tw/` with `wait_until="domcontentloaded"`
- **AND** the browser SHALL wait at least 3 seconds after the homepage loads before navigating to the search URL
- **AND** if the homepage URL contains "login", the function SHALL log a block message and return an empty list


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Shopee search returns newest listings sorted by creation time

The system SHALL use a Playwright headless Chromium browser to open `https://shopee.tw/search?keyword={keyword}&sortBy=ctime&order=desc`, wait for product cards to render, and extract item data from the DOM.

#### Scenario: Successful Shopee search returns item list

- **WHEN** `ShopeeWatcher.search(keyword)` is called with a valid keyword
- **THEN** the browser navigates to `https://shopee.tw/search?keyword={keyword}&sortBy=ctime&order=desc`
- **AND** the system waits for at least one product card selector to appear (`[data-sqe="item"]` or `.shopee-search-item-result__item` or `a[href*="-i."]`)
- **AND** returns a list of `WatcherItem` objects with `platform="shopee"`

#### Scenario: Shopee item ID and shop ID are extracted from the product card link

- **WHEN** a product card contains an `<a>` element with href matching the pattern `/{slug}-i.{shopid}.{itemid}`
- **THEN** `WatcherItem.item_id` SHALL be set to `{itemid}` and the URL SHALL be `https://shopee.tw/{slug}-i.{shopid}.{itemid}`

#### Scenario: Shopee price is extracted and converted to TWD float

- **WHEN** the product card contains a price element matching `[class*="price"]`
- **THEN** `WatcherItem.price` SHALL be the numeric TWD value parsed from the text (e.g. "NT$15" → `15.0`)
- **AND** if no price text can be parsed, `WatcherItem.price` SHALL be `null`

#### Scenario: Shopee product image is extracted from the card

- **WHEN** the product card contains an `<img>` element
- **THEN** `WatcherItem.image_url` SHALL be set to that image's `src` attribute

#### Scenario: Shopee search timeout returns empty list

- **WHEN** the product card selector does not appear within 15 seconds
- **THEN** the system SHALL log a timeout error and return an empty list
- **AND** the scheduler MUST NOT raise an exception

#### Scenario: Shopee search failure returns empty list

- **WHEN** the browser encounters a navigation error or an unhandled exception
- **THEN** the system SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Ruten search returns newest listings via Playwright

The system SHALL use a Playwright headless Chromium browser to open `https://www.ruten.com.tw/find/?q={keyword}&sort=new`, wait for product cards to render in the SPA, and extract item data from the DOM.

#### Scenario: Successful Ruten search returns item list

- **WHEN** `RutenWatcher.search(keyword)` is called with a valid keyword
- **THEN** the browser navigates to `https://www.ruten.com.tw/find/?q={keyword}&sort=new`
- **AND** the system waits for SPA rendering (at least 4 seconds after `domcontentloaded`)
- **AND** returns a list of `WatcherItem` objects with `platform="ruten"`

#### Scenario: Ruten item ID and URL are extracted from the product card link

- **WHEN** a product card contains an `<a>` element with href matching `https://www.ruten.com.tw/item/{id}/` where `{id}` is a numeric string of 10 or more digits
- **THEN** `WatcherItem.item_id` SHALL be set to `{id}` and `WatcherItem.url` SHALL be `https://www.ruten.com.tw/item/{id}/`

#### Scenario: Ruten item name is extracted from the card text

- **WHEN** `a.inner_text()` contains multiple lines, some of which are purely numeric
- **THEN** the system SHALL filter out purely numeric lines and use the first non-empty remaining line as the item name
- **AND** if no text remains, the system SHALL attempt to read the `alt` attribute of the nearest `<img>` element
- **AND** if still empty, the name SHALL fall back to `"item-{item_id}"`

#### Scenario: Ruten price is extracted from the parent container

- **WHEN** the parent container (`li`, `article`, or `parentElement`) of the product link contains an element matching `[class*="price"]` or `[class*="Price"]`
- **THEN** `WatcherItem.price` SHALL be the numeric TWD value parsed from the price text
- **AND** if no price text can be parsed, `WatcherItem.price` SHALL be `null`

#### Scenario: Ruten product image is extracted from the card

- **WHEN** the product link or its parent container contains an `<img>` element
- **THEN** `WatcherItem.image_url` SHALL be set to the `src` attribute, or `data-src` if `src` starts with `"data:"`
- **AND** if no image is found, `WatcherItem.image_url` SHALL be `null`

#### Scenario: Ruten search timeout returns empty list

- **WHEN** no `a[href*="ruten.com.tw/item/"]` elements are found and the fallback `a[href*="goods.ruten"]` also returns nothing
- **THEN** the system SHALL log a warning and return an empty list
- **AND** the scheduler MUST NOT raise an exception

#### Scenario: Ruten search failure returns empty list

- **WHEN** the browser encounters a navigation error or an unhandled exception
- **THEN** the system SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: A single Playwright browser instance is shared across all searches in one scan cycle

The system SHALL launch one Playwright Chromium browser instance per scan cycle, reuse it across all keyword-platform searches, and close it after the cycle completes.

#### Scenario: Browser is launched once per scan cycle

- **WHEN** a scan cycle begins
- **THEN** `async_playwright().start()` SHALL be called exactly once
- **AND** the same browser instance SHALL be passed to all watcher calls within that cycle

#### Scenario: Browser is always closed after a scan cycle

- **WHEN** a scan cycle ends (whether successful or with errors)
- **THEN** `browser.close()` SHALL be called to release browser resources
- **AND** the browser MUST be closed even if an individual search raises an exception


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Price range filter is applied before returning results

The system SHALL filter search results by `min_price` and `max_price` when those values are configured for a keyword.

#### Scenario: Item below minimum price is excluded

- **WHEN** a keyword has `min_price: 5000` and an item has `price: 3000`
- **THEN** that item MUST NOT be included in the returned list

#### Scenario: Item above maximum price is excluded

- **WHEN** a keyword has `max_price: 10000` and an item has `price: 12000`
- **THEN** that item MUST NOT be included in the returned list

#### Scenario: Item with null price is not filtered out

- **WHEN** an item has no price information (`price: null`)
- **THEN** the item SHALL be included in the returned list regardless of price range settings

#### Scenario: No price filter returns all items

- **WHEN** a keyword has `min_price: null` and `max_price: null`
- **THEN** all returned items SHALL be included without price filtering

<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Scraped items are filtered by keyword blocklist before notification

The Worker SHALL discard any scraped item whose `name` contains any term from the keyword's `blocklist` (case-insensitive comparison). Filtered items SHALL NOT be passed to `notify_item()` and SHALL NOT create a `SeenItem` row.

#### Scenario: Item name contains a blocklist term

- **WHEN** the Worker scrapes an item with name "機械鍵盤 廣告整組" for a keyword with `blocklist: ["廣告", "整組"]`
- **THEN** the item SHALL be discarded before calling `notify_item()`
- **AND** no `SeenItem` row SHALL be created for this item

#### Scenario: Item name does not contain any blocklist term

- **WHEN** the Worker scrapes an item with name "Cherry 機械鍵盤 茶軸" for a keyword with `blocklist: ["廣告", "整組"]`
- **THEN** the item SHALL be passed to `notify_item()` as normal

#### Scenario: Blocklist comparison is case-insensitive

- **WHEN** a keyword has `blocklist: ["Cherry"]` and an item name is `"cherry mx red 機械鍵盤"`
- **THEN** the item SHALL be discarded (case-insensitive match)

#### Scenario: Empty blocklist does not filter any items

- **WHEN** a keyword has `blocklist: []`
- **THEN** all scraped items SHALL be passed to `notify_item()` without filtering

<!-- @trace
source: notification-and-search-improvements
updated: 2026-04-01
code:
  - src/scheduler.py
  - webapp/components/KeywordForm.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/scripts/cleanup.ts
  - src/scrapers/ruten.py
  - webapp/app/settings/page.tsx
  - src/watchers/base.py
  - webapp/package.json
  - webapp/app/api/history/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/lib/email.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/dashboard/layout.tsx
  - .github/workflows/cleanup.yml
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - src/scrapers/shopee.py
  - webapp/app/api/worker/scan-log/route.ts
  - src/api_client.py
  - webapp/lib/discord.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
-->

---
### Requirement: Scraped items are filtered by mustInclude before notification

The Worker SHALL discard any scraped item whose `name` does NOT contain ALL terms in `mustInclude` (case-insensitive). This filter SHALL execute after blocklist filtering and before `notify_batch`. Items filtered by mustInclude SHALL NOT create a `SeenItem` row.

#### Scenario: Item missing a required term is discarded

- **WHEN** a keyword has `mustInclude: ["茶軸", "87鍵"]` and a scraped item name is `"Cherry 機械鍵盤 青軸 87鍵"`
- **THEN** the item SHALL be discarded (missing "茶軸")
- **AND** `notify_batch` SHALL NOT be called for this item

#### Scenario: Empty mustInclude allows all items through

- **WHEN** a keyword has `mustInclude: []`
- **THEN** all items that passed blocklist filtering SHALL be passed to `notify_batch`

#### Scenario: mustInclude filter is applied after blocklist filter

- **WHEN** a keyword has `blocklist: ["廣告"]` and `mustInclude: ["茶軸"]` and a scraped item name is `"廣告 茶軸 機械鍵盤"`
- **THEN** the item SHALL be discarded at the blocklist stage
- **AND** the mustInclude stage SHALL NOT be reached for this item


<!-- @trace
source: smart-item-filtering
updated: 2026-04-01
code:
  - webapp/components/KeywordList.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/prisma/schema.prisma
  - webapp/app/api/keywords/[id]/route.ts
  - src/scrapers/ruten.py
  - webapp/lib/email.ts
  - webapp/components/HistoryFeedbackButton.tsx
  - webapp/app/api/keywords/[id]/blocklist/route.ts
  - webapp/app/history/page.tsx
  - webapp/prisma/migrations/20260401033929_add_keyword_must_include_match_mode/migration.sql
  - webapp/app/api/keywords/route.ts
  - src/watchers/base.py
  - webapp/lib/discord.ts
  - webapp/app/api/worker/notify/batch/route.ts
  - src/scrapers/shopee.py
  - src/api_client.py
  - src/scheduler.py
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
-->

---
### Requirement: Scraped items are filtered by matchMode before notification

The Worker SHALL filter scraped items by `matchMode` after mustInclude filtering and before `notify_batch`. The filter checks the item name against the keyword's `keyword` text using the specified matching strategy.

#### Scenario: matchMode "any" passes item containing at least one keyword token

- **WHEN** a keyword has `keyword: "機械 鍵盤"` and `matchMode: "any"` and a scraped item name is `"矮軸機械滑鼠"`
- **THEN** the item SHALL pass (contains "機械")

#### Scenario: matchMode "all" discards item missing any keyword token

- **WHEN** a keyword has `keyword: "機械 鍵盤 茶軸"` and `matchMode: "all"` and an item name is `"Cherry 機械鍵盤 青軸"`
- **THEN** the item SHALL be discarded (missing "茶軸")

#### Scenario: matchMode "exact" discards item without full keyword substring

- **WHEN** a keyword has `keyword: "機械鍵盤"` and `matchMode: "exact"` and an item name is `"矮軸機械滑鼠"`
- **THEN** the item SHALL be discarded (does not contain the substring "機械鍵盤")

#### Scenario: matchMode filter is applied after mustInclude filter

- **WHEN** an item passes mustInclude filtering but fails matchMode filtering
- **THEN** the item SHALL be discarded before `notify_batch`
- **AND** no `SeenItem` row SHALL be created for this item

<!-- @trace
source: smart-item-filtering
updated: 2026-04-01
code:
  - webapp/components/KeywordList.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/prisma/schema.prisma
  - webapp/app/api/keywords/[id]/route.ts
  - src/scrapers/ruten.py
  - webapp/lib/email.ts
  - webapp/components/HistoryFeedbackButton.tsx
  - webapp/app/api/keywords/[id]/blocklist/route.ts
  - webapp/app/history/page.tsx
  - webapp/prisma/migrations/20260401033929_add_keyword_must_include_match_mode/migration.sql
  - webapp/app/api/keywords/route.ts
  - src/watchers/base.py
  - webapp/lib/discord.ts
  - webapp/app/api/worker/notify/batch/route.ts
  - src/scrapers/shopee.py
  - src/api_client.py
  - src/scheduler.py
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
-->