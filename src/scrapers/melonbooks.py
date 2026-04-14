"""
Melonbooks (melonbooks.co.jp) scraper — SSR HTML.

URL: https://www.melonbooks.co.jp/search/search.php?search_all={keyword}&sort=new
sort=new returns newest listings first.
AUTH_ADULT=1 cookie bypasses age verification to include R18 doujinshi.
Products are in li.item-list elements. No Playwright needed.
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

_BASE_URL = "https://www.melonbooks.co.jp"
_SEARCH_URL = _BASE_URL + "/search/search.php"

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

# AUTH_ADULT=1 bypasses Melonbooks age gate to include R18 doujinshi/products
_COOKIES = {"AUTH_ADULT": "1"}


async def scrape_melonbooks(
    page: Page,  # unused — kept for consistent scraper signature
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Melonbooks for newest listings matching keyword.

    AUTH_ADULT=1 cookie includes R18 content without login.
    Parses SSR HTML. No Playwright used.
    Never raises — returns [] on any error.
    """
    params = {"search_all": keyword, "sort": "new"}
    try:
        async with httpx.AsyncClient(
            headers=_HEADERS, cookies=_COOKIES, timeout=20, follow_redirects=True
        ) as client:
            resp = await client.get(_SEARCH_URL, params=params)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[melonbooks] Request failed for keyword=%s: %s", keyword, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")
    card_els = soup.select(".item-list li")
    if not card_els:
        logger.debug("[melonbooks] No product cards found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for li in card_els:
        try:
            # ID: from href detail.php?product_id={id}
            link = li.select_one("a[href*='product_id=']")
            if not link:
                continue
            href = link.get("href", "")
            m = re.search(r"product_id=(\d+)", href)
            if not m:
                continue
            item_id = m.group(1)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            # Name: link title attribute (most reliable)
            name = link.get("title", "").strip()
            if not name:
                name_el = li.select_one(".item-ttl a, .item-ttl")
                name = name_el.get_text(strip=True) if name_el else ""
            name = name[:120]
            if not name:
                continue

            # Price: .item-price shows "¥1650¥1155" — take the lower value
            price_el = li.select_one(".item-price, [class*='price']")
            price = _parse_price(price_el.get_text()) if price_el else None

            # Image: img[data-src] (lazy loaded)
            img = li.select_one("img[data-src]") or li.select_one("img[src]")
            image_url = None
            if img:
                src = img.get("data-src", "") or img.get("src", "")
                if src and not src.startswith("data:"):
                    image_url = src if src.startswith("http") else "https:" + src

            full_url = href if href.startswith("http") else _BASE_URL + href

            # Circle name — Melonbooks typically shows circle in .item-circle or .circle
            circle_el = li.select_one(".item-circle a, .item-circle, .circle")
            seller_name = circle_el.get_text(strip=True)[:80] if circle_el else None

            items.append(
                WatcherItem(
                    platform="melonbooks",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=full_url,
                    image_url=image_url,
                    seller_name=seller_name,
                )
            )
        except Exception as exc:
            logger.debug("[melonbooks] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
