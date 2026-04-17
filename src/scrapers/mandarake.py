"""
Mandarake (order.mandarake.co.jp) scraper.

URL: /order/listPage/list?keyword={keyword}&sort=arrival&sortOrder=1&dispCount=24&lang=en&soldOut=1
Requires cookie: tr_mndrk_user=1 (prevents redirect to homepage).
sort=arrival returns newest arrivals first. SSR HTML. No Playwright needed.
Prices stored in JPY (no conversion).
"""

import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers._price_utils import _apply_price_filter
from src.scrapers._dom_signal import record_dom_intact

logger = logging.getLogger(__name__)


async def _check_dom_structure(page) -> bool:
    # Mandarake uses SSR HTML via httpx — no rendered page; wrapper check handled post-parse.
    return True

_BASE_URL = "https://order.mandarake.co.jp"
_DETAIL_URL = _BASE_URL + "/order/detailPage/detail?itemCode={code}&lang=en"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,ja;q=0.6",
    "Referer": _BASE_URL + "/",
}

_COOKIES = {"tr_mndrk_user": "1"}


def _parse_jpy(text: str) -> Optional[float]:
    """Parse Japanese yen price string (e.g. '¥2,200') → float."""
    numbers = re.findall(r"[\d,]+", text)
    if not numbers:
        return None
    try:
        return float(numbers[0].replace(",", ""))
    except ValueError:
        return None


async def scrape_mandarake(
    page: Page,  # unused — kept for consistent scraper signature
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Mandarake for newest arrivals matching keyword.

    Uses cookie tr_mndrk_user=1 to bypass gate. Prices in JPY.
    No Playwright used. Never raises — returns [] on any error.
    """
    url = (
        f"{_BASE_URL}/order/listPage/list"
        f"?keyword={quote(keyword)}&sort=arrival&sortOrder=1"
        f"&dispCount=24&lang=en&soldOut=1"
    )
    try:
        async with httpx.AsyncClient(
            headers=_HEADERS,
            cookies=_COOKIES,
            timeout=15,
            follow_redirects=False,  # detect redirect manually
        ) as client:
            resp = await client.get(url)
            if resp.status_code in (301, 302, 303, 307, 308):
                location = resp.headers.get("location", "")
                logger.warning(
                    "[mandarake] Redirected to %s — cookie gate may have changed", location
                )
                record_dom_intact("mandarake", False)
                return []
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[mandarake] Request failed for keyword=%s: %s", keyword, exc)
        record_dom_intact("mandarake", False)
        return []

    soup = BeautifulSoup(html, "html.parser")
    # Record DOM-intact signal: outer results wrapper presence
    record_dom_intact(
        "mandarake",
        bool(soup.select_one("#contents, #container, body")) and await _check_dom_structure(page),
    )

    # Product cards: each item is in a .block or .itemBlock div
    cards = soup.select(".block, .itemBlock, li.block")
    if not cards:
        # Fallback: look for links with itemCode
        cards = soup.select('[href*="itemCode"]')

    if not cards:
        logger.debug("[mandarake] No product cards found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_codes: set[str] = set()

    for card in cards:
        try:
            # Item code from detail link
            link = card.select_one('a[href*="itemCode"]') or (
                card if card.name == "a" else None
            )
            if not link:
                continue
            href = link.get("href", "")
            m = re.search(r"itemCode=([^&]+)", href)
            if not m:
                continue
            item_code = m.group(1).strip()
            if not item_code or item_code in seen_codes:
                continue
            seen_codes.add(item_code)

            # Name
            name_el = card.select_one(".title, .name, .itemTitle, h2, h3, p.name")
            name = name_el.get_text(strip=True) if name_el else link.get_text(strip=True)
            name = name[:120]
            if not name:
                continue

            # Price (JPY)
            price_el = card.select_one(".price, .itemPrice, [class*='price']")
            price = None
            price_text = None
            if price_el:
                raw = price_el.get_text(strip=True)
                price = _parse_jpy(raw)
                price_text = raw

            # Image
            img = card.select_one("img")
            image_url = None
            if img:
                src = img.get("src", "") or img.get("data-src", "")
                if src and not src.startswith("data:"):
                    image_url = src if src.startswith("http") else _BASE_URL + src

            items.append(
                WatcherItem(
                    platform="mandarake",
                    item_id=item_code,
                    name=name,
                    price=price,
                    url=_DETAIL_URL.format(code=item_code),
                    image_url=image_url,
                    price_text=price_text,
                )
            )
        except Exception as exc:
            logger.debug("[mandarake] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
