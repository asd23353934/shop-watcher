"""
買動漫 (MyACG / myacg.com.tw) scraper.

AJAX endpoint: /goods_list_show_005.php?keyword_body={keyword}
Returns keyword-filtered product HTML fragment (newest first by default).
Age gate requires cookies r18=18 and m_search_r18=1 to include R18 items.
No Playwright needed.
"""

import logging
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers._price_utils import _apply_price_filter, _parse_price

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.myacg.com.tw"
_AJAX_URL = _BASE_URL + "/goods_list_show_005.php"
_DETAIL_URL = _BASE_URL + "/goods_detail.php?gid={gid}"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
    "Referer": _BASE_URL + "/",
    "X-Requested-With": "XMLHttpRequest",
}

# Age verification cookies: r18=18 confirms 18+ modal; m_search_r18=1 enables R18 search results.
_COOKIES = {"r18": "18", "m_search_r18": "1"}


async def scrape_myacg(
    page: Page,  # unused — kept for consistent scraper signature
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search 買動漫 (MyACG) for newest listings matching keyword.

    Calls goods_list_show_005.php AJAX endpoint directly.
    Cookies r18=18 and m_search_r18=1 include R18 products. No Playwright used.
    price may be null if not present in AJAX fragment.
    Never raises — returns [] on any error.
    """
    params = {"keyword_body": keyword}
    try:
        async with httpx.AsyncClient(headers=_HEADERS, cookies=_COOKIES, timeout=15, follow_redirects=True) as client:
            resp = await client.get(_AJAX_URL, params=params)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[myacg] Request failed for keyword=%s: %s", keyword, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")

    # Each product: <li> or container with a link to goods_detail.php?gid=...
    product_links = soup.select('a[href*="goods_detail.php"]')
    if not product_links:
        logger.warning("[myacg] No product links found for keyword=%s (html_len=%d)", keyword, len(html))
        return []

    items: list[WatcherItem] = []
    seen_gids: set[str] = set()

    for a in product_links:
        try:
            href = a.get("href", "")
            m = re.search(r"gid=(\d+)", href)
            if not m:
                continue
            gid = m.group(1)
            if gid in seen_gids:
                continue
            seen_gids.add(gid)

            # Each product is wrapped in <li> containing div.pic and div.name
            li = a.find_parent("li")

            # Name: prefer div.name > a text (more reliable than img alt which may be garbled)
            name = ""
            if li:
                name_a = li.select_one("div.name a")
                if name_a:
                    name = name_a.get_text(strip=True)[:120]
            if not name:
                img_el = a.select_one("img")
                name = (img_el.get("alt", "") if img_el else a.get_text(separator=" ", strip=True)).strip()[:120]
            if not name:
                continue

            # Image: CDN image from cdn.myacg.com.tw
            img = a.select_one("img")
            image_url = None
            if img:
                src = img.get("src", "") or img.get("data-src", "")
                if src and not src.startswith("data:"):
                    image_url = src if src.startswith("http") else _BASE_URL + src

            # Price: in <li> > div.priceBox span.t_price (e.g. "550")
            price = None
            if li:
                price_span = li.select_one("span.t_price")
                if price_span:
                    price = _parse_price(price_span.get_text())

            items.append(
                WatcherItem(
                    platform="myacg",
                    item_id=gid,
                    name=name,
                    price=price,
                    url=_DETAIL_URL.format(gid=gid),
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[myacg] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
