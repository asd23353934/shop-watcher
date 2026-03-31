"""
Shopee Taiwan watcher.

Uses Shopee's internal search API (same endpoint the website uses).
Sorted by ctime (newest first) so we catch fresh listings quickly.

Note: Shopee may update their API or add stricter bot-detection over time.
If requests start returning empty results, try adding/rotating User-Agent strings.
"""

import httpx
import urllib.parse
from .base import BaseWatcher, WatcherItem

SEARCH_URL = "https://shopee.tw/api/v4/search/search_items"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://shopee.tw/",
    "Accept": "application/json",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    "x-api-source": "pc",
    "x-shopee-language": "zh-Hant",
    # csrf token: Shopee accepts an empty string for read-only GET searches
    "x-csrftoken": "",
}


class ShopeeWatcher(BaseWatcher):
    PLATFORM = "shopee"

    async def search(self, keyword: str, max_results: int = 20) -> list[WatcherItem]:
        params = {
            "by": "ctime",          # sort by creation time = newest first
            "keyword": keyword,
            "limit": max_results,
            "newest": 0,
            "order": "desc",
            "page_type": "search",
            "scenario": "PAGE_GLOBAL_SEARCH",
            "version": 2,
        }

        try:
            async with httpx.AsyncClient(
                headers=HEADERS, timeout=15, follow_redirects=True
            ) as client:
                resp = await client.get(SEARCH_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            print(f"[shopee] Search failed for '{keyword}': {e}")
            return []

        items: list[WatcherItem] = []
        for entry in data.get("items") or []:
            basic = entry.get("item_basic") or entry  # API shape varies slightly
            try:
                item_id = str(basic["itemid"])
                shop_id = str(basic["shopid"])
                name = basic.get("name", "")
                # price is stored as integer × 100000 (e.g. 1000000 = NT$10)
                raw_price = basic.get("price") or basic.get("price_min")
                price = round(raw_price / 100000, 0) if raw_price else None
                slug = urllib.parse.quote(name.replace(" ", "-"), safe="")
                url = f"https://shopee.tw/{slug}-i.{shop_id}.{item_id}"
                image = basic.get("image")
                image_url = f"https://cf.shopee.tw/file/{image}" if image else None
                seller = basic.get("shop_name") or basic.get("shopee_verified_name")

                items.append(WatcherItem(
                    platform=self.PLATFORM,
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=url,
                    image_url=image_url,
                    seller=seller,
                ))
            except (KeyError, TypeError):
                continue

        return items
