## ADDED Requirements

### Requirement: DLsite R18 age bypass via maniax domain + age_category parameter

The system SHALL fetch DLsite search results by issuing an HTTP GET request to `https://www.dlsite.com/maniax/fsr/ajax` with params `age_category[0]=18`, `order=release_d`, `per_page=30`, `page=1`, and the header `X-Requested-With: XMLHttpRequest`. Using the `maniax` domain with `age_category[0]=18` includes R18 adult works. The response is JSON with a `search_result` field containing an HTML string. It SHALL return a list of `WatcherItem` objects with `platform="dlsite"`.

#### Scenario: AJAX endpoint returns product list with R18 content

- **WHEN** `scrape_dlsite(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue GET to `/maniax/fsr/ajax` with `age_category[0]=18` and `order=release_d`
- **AND** SHALL parse `li.search_result_img_box_inner[data-list_item_product_id]` elements from the HTML in `search_result`
- **AND** SHALL return items sorted newest first (release_d = release date descending)
- **AND** SHALL include R18 adult works due to `age_category[0]=18`

#### Scenario: DLsite item fields are mapped correctly

- **WHEN** an `li.search_result_img_box_inner` element has `data-list_item_product_id`
- **THEN** `WatcherItem.item_id` SHALL be set to `data-list_item_product_id`
- **AND** `WatcherItem.name` SHALL be extracted from `a[href*='product_id']` anchor text (truncated to 120 chars)
- **AND** `WatcherItem.price` SHALL be parsed from `.work_price` or `[class*='price']` element text
- **AND** `WatcherItem.image_url` SHALL be extracted from the `thumb-candidates` attribute regex (`//img.dlsite.jp/...`) prefixed with `https:`
- **AND** `WatcherItem.url` SHALL be `https://www.dlsite.com/maniax/work/=/product_id/{item_id}.html`
- **AND** `WatcherItem.platform` SHALL be `"dlsite"`

#### Scenario: DLsite keyword search is full-text, not title-only

- **WHEN** a keyword is submitted to the DLsite AJAX endpoint
- **THEN** the search SHALL match across title, tags, and description fields
- **AND** Japanese keywords SHALL yield significantly more results than Chinese or English equivalents (e.g., ガンダム returns ~1594 results vs 鋼彈 ~2 results)
- **AND** users SHALL prefer Japanese keywords for best coverage

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` and/or `max_price` are provided
- **THEN** only items within the price range SHALL be returned
- **AND** items with `price=null` SHALL be included regardless of filter

#### Scenario: Empty search_result returns empty list

- **WHEN** the JSON response has no `search_result` field or it is empty
- **THEN** the scraper SHALL log a warning and return an empty list

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception
