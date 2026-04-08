# myacg-scraper Specification

## Purpose

Defines the scraping behavior for 買動漫 (MyACG, myacg.com.tw), a Taiwanese anime merchandise and doujinshi retailer. The scraper uses the AJAX HTML fragment endpoint with `ct18=1` to include R18 products, parses product entries from the fragment, and allows null prices when no price element is present.

## Requirements

### Requirement: 買動漫（MyACG）search returns newest listings via AJAX endpoint

The system SHALL fetch 買動漫 search results by issuing an HTTP GET request to `https://www.myacg.com.tw/goods_list_show_002.php?keyword_body={keyword}&sort=1&page=1&ct18=1` using `httpx.AsyncClient`. The parameter `sort=1` returns newest listings first; `ct18=1` includes R18 anime doujinshi products. The response is an HTML fragment (not a full page) that SHALL be parsed with BeautifulSoup. The scraper SHALL return a list of `WatcherItem` objects with `platform="myacg"`.

#### Scenario: Successful AJAX response returns item list

- **WHEN** `scrape_myacg(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue a GET request to `goods_list_show_002.php` with `keyword_body={keyword}`, `sort=1`, `ct18=1`
- **AND** SHALL parse product entries from the returned HTML fragment
- **AND** SHALL return a non-empty list of `WatcherItem` objects

#### Scenario: MyACG item fields are mapped correctly

- **WHEN** a product entry contains a link to `goods_detail.php?gid={gid}`
- **THEN** `WatcherItem.item_id` SHALL be set to `{gid}` extracted from the `gid` query parameter
- **AND** `WatcherItem.url` SHALL be `https://www.myacg.com.tw/goods_detail.php?gid={gid}`
- **AND** `WatcherItem.name` SHALL be the product title text from the entry
- **AND** `WatcherItem.image_url` SHALL be the CDN image URL from `cdn.myacg.com.tw`, or `null` if absent
- **AND** `WatcherItem.platform` SHALL be `"myacg"`

#### Scenario: Price field is extracted if present, otherwise null

- **WHEN** the AJAX HTML fragment contains a price element for the product
- **THEN** `WatcherItem.price` SHALL be the numeric TWD value parsed from the price text
- **WHEN** no price element is found in the AJAX fragment
- **THEN** `WatcherItem.price` SHALL be `null` and the item SHALL still be included in results

#### Scenario: R18 products are included via ct18 parameter

- **WHEN** `scrape_myacg` is called
- **THEN** the request SHALL include `ct18=1` so that R18 doujinshi and adult anime merchandise appear in results
- **AND** these items SHALL be treated identically to non-R18 items for deduplication and notification purposes

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` or `max_price` is provided
- **THEN** only items with a non-null price within the range SHALL be filtered out
- **AND** items with `price=null` SHALL be included regardless of filter

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception

<!-- @trace
source: add-platform-support
updated: 2026-04-08
code:
  - src/scrapers/myacg.py
  - src/scheduler.py
-->
