## ADDED Requirements

### Requirement: PChome 24h search returns newest listings via JSON API

The system SHALL fetch PChome 24h search results by issuing an HTTP GET request to `https://ecshweb.pchome.com.tw/search/v3.3/all/results?q={keyword}&sort=new&offset=0` using `httpx.AsyncClient`. It SHALL parse the `prods` array from the JSON response and return a list of `WatcherItem` objects with `platform="pchome"`.

#### Scenario: Successful API response returns item list

- **WHEN** `scrape_pchome(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue `GET https://ecshweb.pchome.com.tw/search/v3.3/all/results?q={keyword}&sort=new&offset=0`
- **AND** SHALL parse the `prods` array from the JSON response
- **AND** SHALL return a non-empty list of `WatcherItem` objects

#### Scenario: PChome item fields are mapped correctly

- **WHEN** a product in `prods` has fields `Id`, `name`, `price`, `picB`
- **THEN** `WatcherItem.item_id` SHALL be set to `Id`
- **AND** `WatcherItem.name` SHALL be set to `name`
- **AND** `WatcherItem.price` SHALL be set to the numeric value of `price`
- **AND** `WatcherItem.image_url` SHALL be set to `https://cs-b.ecimg.tw/items/{picB}` when `picB` is non-empty, otherwise `null`
- **AND** `WatcherItem.url` SHALL be `https://24h.pchome.com.tw/prod/{Id}`
- **AND** `WatcherItem.platform` SHALL be `"pchome"`

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price=500` and `max_price=2000` are provided
- **THEN** only items with `price >= 500` AND `price <= 2000` SHALL be returned
- **AND** items with `price=null` SHALL be included regardless of filter

#### Scenario: API returns empty prods array

- **WHEN** the API response contains `"prods": null` or `"prods": []`
- **THEN** the scraper SHALL return an empty list without raising an exception

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception
