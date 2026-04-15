"""
Toranoana (ec.toranoana.jp) scraper — SSR HTML.

URL: https://ec.toranoana.jp/tora_r/ec/app/catalog/list?searchWord={keyword}&sort=newitem&searchBackorderFlg=1
sort=newitem returns newest listings first. searchBackorderFlg=1 includes backorder items.
Products are in li.product-list-item elements. No Playwright needed.
Note: non-Japanese keywords may return HTTP 404 (no results), treated as empty list.
"""

import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers.shopee import _apply_price_filter, _parse_price

logger = logging.getLogger(__name__)

_BASE_URL = "https://ec.toranoana.jp"
_SEARCH_URL = _BASE_URL + "/tora_r/ec/app/catalog/list"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,zh-TW;q=0.9,en;q=0.8",
    "Referer": _BASE_URL + "/",
}


def _extract_tora_id(href: str) -> Optional[str]:
    """Extract item ID from /tora/ec/item/{id}/ URL."""
    m = re.search(r"/item/([^/]+)/", href)
    return m.group(1) if m else None


async def scrape_toranoana(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Toranoana for newest listings matching keyword.

    Parses SSR HTML from catalog/list endpoint.
    sort=newitem returns newest first. No Playwright used.
    Never raises — returns [] on any error.
    """
    params = {"searchWord": keyword, "sort": "newitem", "searchBackorderFlg": "1"}
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(_SEARCH_URL, params=params)
            if resp.status_code == 404:
                # Non-Japanese keywords yield 404 (no results) on this Japanese platform
                logger.debug("[toranoana] 404 for keyword=%s (no results on JP platform)", keyword)
                return []
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[toranoana] Request failed for keyword=%s: %s", keyword, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")
    card_els = soup.select("li.product-list-item")
    if not card_els:
        logger.debug("[toranoana] No product cards found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for li in card_els:
        try:
            # Link contains item ID: /tora/ec/item/{id}/
            link = li.select_one("a[href*='/item/']")
            if not link:
                continue
            href = link.get("href", "")
            item_id = _extract_tora_id(href)
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            # Name: link title attribute or .product-list-name text
            name = link.get("title", "").strip()
            if not name:
                name_el = li.select_one(".product-list-name")
                name = name_el.get_text(strip=True) if name_el else ""
            name = name[:120]
            if not name:
                continue

            # Price
            price_el = li.select_one("[class*='price'], .price")
            price = _parse_price(price_el.get_text()) if price_el else None

            # Image: img[data-src] (lazy loaded)
            img = li.select_one("img[data-src]") or li.select_one("img[src]")
            image_url = None
            if img:
                src = img.get("data-src", "") or img.get("src", "")
                if src and not src.startswith("data:"):
                    image_url = src if src.startswith("http") else "https:" + src

            full_url = href if href.startswith("http") else _BASE_URL + href

            # Circle/サークル name — Toranoana uses .product-list-circle or similar
            circle_el = li.select_one(".product-list-circle, .circle-name, [class*='circle']")
            seller_name = circle_el.get_text(strip=True)[:80] if circle_el else None

            items.append(
                WatcherItem(
                    platform="toranoana",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=full_url,
                    image_url=image_url,
                    seller_name=seller_name,
                )
            )
        except Exception as exc:
            logger.debug("[toranoana] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
