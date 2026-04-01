"""
Shopee scraper using Playwright headless Chromium.

Strategy:
1. Visit homepage to obtain session cookies.
2. Call Shopee's internal search API via browser fetch (inherits cookies/headers).
3. Fall back to DOM scraping if the API returns no items.
"""

import asyncio
import logging
import re
from typing import Optional
from urllib.parse import quote

from playwright.async_api import Page, TimeoutError as PWTimeout

from src.watchers.base import WatcherItem

logger = logging.getLogger(__name__)

SEARCH_TIMEOUT = 15_000  # ms (DOM fallback only)
HOMEPAGE_WAIT = 3  # seconds after homepage load


def _parse_price(text: str) -> Optional[float]:
    """Parse TWD price string → float (min price for ranges). Returns None if unparseable."""
    if not text:
        return None
    numbers = re.findall(r"[\d,]+", text)
    if not numbers:
        return None
    try:
        return float(numbers[0].replace(",", ""))
    except ValueError:
        return None


def _extract_price_text(text: str) -> Optional[str]:
    """
    Extract display price text for price ranges (e.g. '100 ~ 1,000').
    Returns None for single prices (let the caller format normally).
    """
    if not text:
        return None
    numbers = re.findall(r"[\d,]+", text)
    if len(numbers) < 2:
        return None
    try:
        first = int(numbers[0].replace(",", ""))
        second = int(numbers[1].replace(",", ""))
        if first != second:
            return f"{first:,} ~ {second:,}"
    except ValueError:
        pass
    return None


def _apply_price_filter(
    items: list[WatcherItem],
    min_price: Optional[float],
    max_price: Optional[float],
) -> list[WatcherItem]:
    """
    Filter items by price range.
    Items with price=None are always included (Price range filter is applied before returning results).
    """
    result = []
    for item in items:
        if item.price is None:
            result.append(item)
            continue
        if min_price is not None and item.price < min_price:
            continue
        if max_price is not None and item.price > max_price:
            continue
        result.append(item)
    return result


def _parse_api_items(result: dict, keyword: str) -> list[WatcherItem]:
    """Parse Shopee API JSON response into WatcherItem list."""
    if not result or not isinstance(result, dict):
        return []

    # Try all known response structures
    bff = result.get("bff_info") or {}
    raw_items = (
        result.get("items")
        or result.get("data", {}).get("items")
        or bff.get("items")
        or bff.get("data", {}).get("items") if isinstance(bff, dict) else None
        or [v for k, v in result.items() if isinstance(k, str) and k.isdigit() and isinstance(v, dict)]
    )
    if not raw_items:
        # Log full top-level structure to find where items are
        def _summarize(v):
            if isinstance(v, list):
                return f"list[{len(v)}]"
            if isinstance(v, dict):
                return f"dict({list(v.keys())[:5]})"
            return type(v).__name__
        summary = {k: _summarize(result[k]) for k in list(result.keys())}
        logger.warning("[shopee] API: no items — structure: %s", summary)
        return []

    logger.info("[shopee] API: found %d raw items for keyword=%s", len(raw_items), keyword)
    if raw_items:
        first = raw_items[0]
        info0 = first.get("item_basic") or first
        logger.info("[shopee] API item keys sample: %s", list(info0.keys())[:15])

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for raw in raw_items[:25]:
        try:
            info = raw.get("item_basic") or raw
            item_id = str(info.get("itemid") or info.get("item_id") or info.get("id") or "")
            shop_id = str(info.get("shopid", ""))
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            name = (info.get("name") or info.get("item_name") or info.get("title") or f"item-{item_id}")[:120]

            # Shopee prices are in units of 100,000 (5 decimal places)
            price: Optional[float] = None
            price_text: Optional[str] = None
            price_min = info.get("price_min")
            price_max = info.get("price_max")
            price_val = info.get("price")

            if price_min is not None and price_max is not None:
                p_min = price_min / 100_000
                p_max = price_max / 100_000
                price = p_min
                if abs(p_min - p_max) >= 1:
                    price_text = f"{int(p_min):,} ~ {int(p_max):,}"
            elif price_val is not None:
                price = price_val / 100_000

            name_slug = re.sub(r"\s+", "-", name.strip())
            url = f"https://shopee.tw/{name_slug}-i.{shop_id}.{item_id}"

            image_url: Optional[str] = None
            image = info.get("image")
            if image:
                image_url = f"https://cf.shopee.tw/file/{image}_tn"

            seller_name: Optional[str] = info.get("shop_name") or None

            items.append(
                WatcherItem(
                    platform="shopee",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=url,
                    image_url=image_url,
                    seller_name=seller_name,
                    price_text=price_text,
                )
            )
        except Exception as exc:
            logger.debug("[shopee] API parse error: %s", exc)

    return items


async def _extract_from_page_state(page: Page, keyword: str) -> list[WatcherItem]:
    """
    After the search page has loaded, attempt to extract item data directly
    from Shopee's client-side JavaScript state (window store / __NEXT_DATA__ / etc).
    Returns [] if nothing useful is found.
    """
    try:
        data = await page.evaluate("""
            () => {
                // Next.js SSR data
                const next = window.__NEXT_DATA__;
                if (next) {
                    try {
                        const props = next.props?.pageProps;
                        if (props?.initialData?.data?.items) return {source:'next', items: props.initialData.data.items};
                        if (props?.data?.items) return {source:'next2', items: props.data.items};
                    } catch(e) {}
                }
                // Redux store
                const stores = Object.keys(window).filter(k => {
                    try { return window[k] && typeof window[k].getState === 'function'; } catch(e) { return false; }
                });
                for (const s of stores) {
                    try {
                        const state = window[s].getState();
                        const items = state?.search?.items || state?.searchResult?.items;
                        if (items && items.length > 0) return {source: s, items};
                    } catch(e) {}
                }
                return null;
            }
        """)
        if not data or not data.get("items"):
            return []
        logger.info("[shopee] Extracted %d items from page state (source=%s)", len(data["items"]), data.get("source"))
        return _parse_api_items({"items": data["items"]}, keyword)
    except Exception as exc:
        logger.debug("[shopee] Page state extraction failed: %s", exc)
        return []


async def _intercept_search_api(page: Page, keyword: str) -> list[WatcherItem]:
    """
    Navigate to the search page and intercept the API response that
    Shopee's own JavaScript fires.  This approach reuses the browser's
    real session/headers so Shopee cannot distinguish it from a human visit.
    Returns [] if the API response is not captured within the timeout.
    """
    captured: dict = {}

    async def on_response(response):
        if "search_items" not in response.url:
            return
        # Skip session-init calls (no keyword, or error response)
        try:
            data = await response.json()
        except Exception:
            return
        if not isinstance(data, dict):
            return
        # Skip error responses
        error_code = data.get("error")
        if error_code and error_code != 0:
            logger.debug("[shopee] search_items error=%s, skipping", error_code)
            return
        # Require actual item data
        raw = (
            data.get("items")
            or [v for k, v in data.items() if isinstance(k, str) and k.isdigit() and isinstance(v, dict)]
        )
        if not raw:
            logger.debug("[shopee] search_items no items yet, skipping")
            return
        if not captured:
            logger.info("[shopee] Captured %d items from search_items", len(raw))
            captured["data"] = data

    page.on("response", on_response)

    search_url = (
        f"https://shopee.tw/search?keyword={quote(keyword)}&sortBy=ctime&order=desc"
    )
    try:
        await page.goto(search_url, timeout=30_000, wait_until="domcontentloaded")
    except Exception as exc:
        logger.error("[shopee] Navigation error: %s", exc)
        page.remove_listener("response", on_response)
        return []

    if "login" in page.url:
        logger.warning("[shopee] Redirected to login for keyword=%s", keyword)
        page.remove_listener("response", on_response)
        return []

    # Wait up to 20 s for the actual search API response (JS fires it after page init)
    for _ in range(40):
        if captured:
            break
        await asyncio.sleep(0.5)

    page.remove_listener("response", on_response)

    if not captured:
        logger.info("[shopee] API response not captured for keyword=%s, trying page state", keyword)
        items = await _extract_from_page_state(page, keyword)
        return items

    items = _parse_api_items(captured["data"], keyword)
    logger.info("[shopee] Intercepted %d item(s) for keyword=%s", len(items), keyword)
    return items


async def _scrape_shopee_dom_from_loaded_page(page: Page, keyword: str) -> list[WatcherItem]:
    """
    DOM-based fallback scraper for an already-loaded search page.
    Waits for product card selectors then parses links.
    Returns [] if no selectors match.
    """
    # Wait for product cards (page already navigated)
    loaded = False
    for sel in [
        '[data-sqe="item"]',
        ".shopee-search-item-result__item",
        'a[href*="-i."]',
        '[class*="search-item"]',
        'li[class*="col-xs"]',
    ]:
        try:
            await page.wait_for_selector(sel, timeout=SEARCH_TIMEOUT)
            loaded = True
            break
        except PWTimeout:
            continue

    if not loaded:
        logger.warning("[shopee] DOM: product selectors timed out for keyword=%s", keyword)
        return []

    links = await page.query_selector_all('a[href*="-i."]')
    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for a in links[:25]:
        try:
            href = await a.get_attribute("href") or ""
            m = re.search(r"-i\.(\d+)\.(\d+)", href)
            if not m:
                continue
            shop_id, item_id = m.group(1), m.group(2)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            slug_match = re.match(r"/([^?]+)-i\.", href)
            name = ""
            if slug_match:
                from urllib.parse import unquote
                raw_slug = unquote(slug_match.group(1))
                name = raw_slug.replace("-", " ").strip()
            if not name:
                name = f"item-{item_id}"

            full_url = f"https://shopee.tw{href}" if href.startswith("/") else href

            price = None
            price_text = None
            try:
                price_el = await a.query_selector('[class*="price"]')
                if not price_el:
                    container = await a.evaluate_handle(
                        "el => el.closest('[data-sqe]') || el.parentElement"
                    )
                    if container:
                        price_el = await container.query_selector('[class*="price"]')
                if price_el:
                    raw_price_text = await price_el.inner_text()
                    price = _parse_price(raw_price_text)
                    price_text = _extract_price_text(raw_price_text)
            except Exception:
                pass

            image_url = None
            try:
                img_el = await a.query_selector("img")
                if img_el:
                    src = await img_el.get_attribute("src") or ""
                    image_url = None if src.startswith("data:") else src or None
            except Exception:
                pass

            items.append(
                WatcherItem(
                    platform="shopee",
                    item_id=item_id,
                    name=name[:120],
                    price=price,
                    url=full_url,
                    image_url=image_url,
                    seller_name=None,
                    price_text=price_text,
                )
            )
        except Exception as exc:
            logger.debug("[shopee] DOM parse error: %s", exc)

    logger.info("[shopee] DOM returned %d item(s) for keyword=%s", len(items), keyword)
    return items


async def scrape_shopee(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Shopee for newest listings matching keyword.

    Strategy: intercept the JSON API response that Shopee's own JavaScript
    fires during page load — no manual API calls, no bot detection issues.
    Falls back to DOM scraping if the API response is not captured.

    Returns list of WatcherItem, filtered by price range if configured.
    Never raises — returns [] on any error.
    """
    await page.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )

    # ── Step 1: Intercept Shopee's own API call ───────────────────────────
    items = await _intercept_search_api(page, keyword)

    # ── Step 2: DOM fallback if API was not captured ──────────────────────
    if not items:
        logger.info("[shopee] Falling back to DOM scrape for keyword=%s", keyword)
        items = await _scrape_shopee_dom_from_loaded_page(page, keyword)

    # ── Step 3: Apply price filter ────────────────────────────────────────
    return _apply_price_filter(items, min_price, max_price)
