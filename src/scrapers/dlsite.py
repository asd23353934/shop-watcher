"""
DLsite scraper using AJAX JSON endpoint.

AJAX URL: https://www.dlsite.com/maniax/fsr/ajax?keyword={keyword}&order=release_d&per_page=30&page=1&age_category%5B0%5D=18
Returns JSON: {"search_result": "<html>...", "page_info": {...}}
search_result is an HTML string containing li.search_result_img_box_inner elements.
age_category[0]=18 includes adult (R18) works.
order=release_d returns newest releases first (release_d = release date descending).
Keyword searches across title, tags, and description — Japanese keywords yield far more results.
No Playwright needed.
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

_BASE_URL = "https://www.dlsite.com"
_AJAX_URL = _BASE_URL + "/maniax/fsr/ajax"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, */*",
    "Accept-Language": "ja,zh-TW;q=0.9,en;q=0.8",
    "Referer": _BASE_URL + "/",
    "X-Requested-With": "XMLHttpRequest",
}


async def scrape_dlsite(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search DLsite for newest releases matching keyword.

    Uses maniax domain with age_category[0]=18 to include R18 adult works.
    AJAX endpoint returns search_result as HTML string parsed with BeautifulSoup.
    No Playwright used. Never raises — returns [] on any error.
    """
    params = {
        "keyword": keyword,
        "order": "release_d",
        "per_page": "30",
        "page": "1",
        "age_category[0]": "18",
    }
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(_AJAX_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("[dlsite] Request failed for keyword=%s: %s", keyword, exc)
        return []

    html = data.get("search_result", "")
    if not html or not isinstance(html, str):
        logger.warning("[dlsite] No search_result HTML for keyword=%s", keyword)
        return []

    soup = BeautifulSoup(html, "html.parser")
    card_els = soup.select("li.search_result_img_box_inner[data-list_item_product_id]")
    if not card_els:
        logger.debug("[dlsite] No product cards found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for li in card_els:
        try:
            product_id = li.get("data-list_item_product_id", "").strip()
            if not product_id or product_id in seen_ids:
                continue
            seen_ids.add(product_id)

            # Name: anchor text pointing to product page
            name_el = li.select_one("a[href*='product_id']")
            name = name_el.get_text(strip=True)[:120] if name_el else ""
            if not name:
                continue

            # Price: take first numeric value (discounted price shown first)
            price_el = li.select_one(".work_price, [class*='price']")
            price = _parse_price(price_el.get_text()) if price_el else None

            # Image: from thumb-candidates attribute
            thumb_attr = str(li)
            m = re.search(r'thumb-candidates="\[\'(//[^\']+)\'', thumb_attr)
            image_url = ("https:" + m.group(1)) if m else None

            product_url = f"{_BASE_URL}/maniax/work/=/product_id/{product_id}.html"

            items.append(
                WatcherItem(
                    platform="dlsite",
                    item_id=product_id,
                    name=name,
                    price=price,
                    url=product_url,
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[dlsite] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
