"""
MOMO購物 scraper using Next.js App Router RSC payload.

URL: https://www.momoshop.com.tw/search/{keyword}?searchType=1&cateLevel=0&_isFuzzy=0
Products are embedded in goodsInfoList inside the RSC (React Server Component) payload.
Requesting with RSC:1 header returns text/x-component payload containing product JSON.
No Playwright needed. verify=False required due to missing Subject Key Identifier in cert.
"""

import json
import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers.shopee import _apply_price_filter, _parse_price

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.momoshop.com.tw"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/x-component, */*",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
    "Referer": _BASE_URL + "/",
    "RSC": "1",
}


def _extract_goods_info_list(rsc_text: str) -> list[dict]:
    """Extract goodsInfoList JSON array from RSC payload text."""
    idx = rsc_text.find('"goodsInfoList":[')
    if idx == -1:
        return []
    start = idx + len('"goodsInfoList":[')
    brace_count = 0
    i = start
    while i < len(rsc_text):
        c = rsc_text[i]
        if c == "{":
            brace_count += 1
        elif c == "}":
            brace_count -= 1
        elif c == "]" and brace_count == 0:
            break
        i += 1
    try:
        return json.loads("[" + rsc_text[start:i] + "]")
    except json.JSONDecodeError:
        return []


async def scrape_momo(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search MOMO購物 for listings matching keyword.

    Fetches RSC payload (RSC:1 header) and extracts goodsInfoList.
    verify=False required: momoshop.com.tw cert lacks Subject Key Identifier.
    No Playwright used. Never raises — returns [] on any error.
    """
    url = f"{_BASE_URL}/search/{quote(keyword)}?searchType=1&cateLevel=0&_isFuzzy=0"
    try:
        async with httpx.AsyncClient(
            headers=_HEADERS, timeout=20, follow_redirects=True, verify=False
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            rsc_text = resp.text
    except Exception as exc:
        logger.warning("[momo] Request failed for keyword=%s: %s", keyword, exc)
        return []

    goods_list = _extract_goods_info_list(rsc_text)
    if not goods_list:
        logger.warning("[momo] No goodsInfoList found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for prod in goods_list:
        try:
            goods_code = str(prod.get("goodsCode") or "").strip()
            if not goods_code or goods_code in seen_ids:
                continue
            seen_ids.add(goods_code)

            name = str(prod.get("goodsName") or "").strip()[:120]
            if not name:
                continue

            # SALE_PRICE is numeric; goodsPrice is display string like "$$2,080"
            raw_price = prod.get("SALE_PRICE")
            price = float(raw_price) if raw_price else None

            product_url = prod.get("goodsUrl") or (
                f"{_BASE_URL}/goods/GoodsDetail.jsp?i_code={goods_code}"
            )

            # imgUrl is a prefix; append _B.jpg for the standard product image
            img_prefix = prod.get("imgUrl") or ""
            image_url = (img_prefix + "_B.jpg") if img_prefix else None

            items.append(
                WatcherItem(
                    platform="momo",
                    item_id=goods_code,
                    name=name,
                    price=price,
                    url=product_url,
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[momo] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
