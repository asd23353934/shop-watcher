"""
金石堂 ACG (kingstone.com.tw) scraper.

URL: https://www.kingstone.com.tw/search/key/{keyword}/lid/search
Full SSR HTML — all product data present in initial response. No Playwright needed.
Discounted (special) price takes priority over original price.
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

_BASE_URL = "https://www.kingstone.com.tw"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
    "Referer": _BASE_URL + "/",
}


def _extract_kingstone_id(href: str) -> Optional[str]:
    """Extract product ID from /basic/{id}/ URL path."""
    m = re.search(r"/basic/(\d+)/", href)
    return m.group(1) if m else None


def _parse_kingstone_price(container: BeautifulSoup) -> tuple[Optional[float], Optional[str]]:
    """
    Extract price from product card. Discounted price takes priority.
    Returns (price_float, price_text_or_None).
    """
    # Try special/discounted price first
    special_el = container.select_one(".special-price, .price-special, [class*='special']")
    if special_el:
        raw = special_el.get_text(strip=True)
        price = _parse_price(raw)
        if price is not None:
            return price, None

    # Fall back to regular price
    price_el = container.select_one(".price, [class*='price'], .item-price")
    if price_el:
        raw = price_el.get_text(strip=True)
        price = _parse_price(raw)
        if price is not None:
            return price, None

    return None, None


async def scrape_kingstone(
    page: Page,  # unused — kept for consistent scraper signature
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search 金石堂 ACG for listings matching keyword.

    Parses SSR HTML. Discounted price prioritised. No Playwright used.
    Never raises — returns [] on any error.
    """
    url = f"{_BASE_URL}/search/key/{quote(keyword, safe='')}/lid/search"
    try:
        # verify=False: kingstone.com.tw certificate lacks Subject Key Identifier extension
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20, follow_redirects=True, verify=False) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[kingstone] Request failed for keyword=%s: %s", keyword, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")

    # Product links: /basic/{id}/
    product_links = soup.select('a[href*="/basic/"]')
    if not product_links:
        logger.debug("[kingstone] No product links found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for a in product_links:
        try:
            href = a.get("href", "")
            item_id = _extract_kingstone_id(href)
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            # Name
            name_el = a.select_one(".name, .title, .item-name, h2, h3, p")
            name = name_el.get_text(strip=True) if name_el else a.get_text(strip=True)
            name = name[:120]
            if not name:
                continue

            # Price (discounted takes priority)
            container = a.parent or a
            price, price_text = _parse_kingstone_price(container)

            # Image
            img = a.select_one("img") or container.select_one("img")
            image_url = None
            if img:
                src = img.get("src", "") or img.get("data-src", "")
                if src and not src.startswith("data:"):
                    image_url = src if src.startswith("http") else _BASE_URL + src

            full_url = href if href.startswith("http") else _BASE_URL + href

            items.append(
                WatcherItem(
                    platform="kingstone",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=full_url,
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[kingstone] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
