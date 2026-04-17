"""
Canary keyword cycle — runs a single high-traffic keyword per platform to
produce a two-layer health signal (itemCount + dom_intact) independent of
user keyword results.

Reports to POST /api/worker/canary-status. Never raises — scraper failures
are recorded as itemCount=0 / domIntact=False and the cycle continues.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Callable, Awaitable

from playwright.async_api import BrowserContext

from src.scrapers._dom_signal import consume_dom_intact
from src.scrapers.ruten import scrape_ruten
from src.scrapers.pchome import scrape_pchome
from src.scrapers.momo import scrape_momo
from src.scrapers.animate import scrape_animate
from src.scrapers.yahoo_auction import scrape_yahoo_auction
from src.scrapers.mandarake import scrape_mandarake
from src.scrapers.myacg import scrape_myacg
from src.scrapers.kingstone import scrape_kingstone
from src.scrapers.melonbooks import scrape_melonbooks
from src.scrapers.toranoana import scrape_toranoana
from src.scrapers.booth import scrape_booth
from src.scrapers.dlsite import scrape_dlsite

if TYPE_CHECKING:
    from src.api_client import WorkerApiClient

logger = logging.getLogger(__name__)

# High-traffic reference keywords chosen to guarantee non-zero results under
# normal site operation. Circle-follow-only platforms are intentionally
# excluded (they have no keyword search endpoint).
CANARY_KEYWORDS: dict[str, str] = {
    "ruten":         "公仔",
    "pchome":        "公仔",
    "momo":          "公仔",
    "animate":       "公仔",
    "yahoo-auction": "公仔",
    "myacg":         "公仔",
    "kingstone":     "漫畫",
    "mandarake":     "初音",
    "melonbooks":    "初音",
    "toranoana":     "初音",
    "booth":         "初音",
    "dlsite":        "初音",
}

_ScrapeFn = Callable[..., Awaitable[list]]

# Circle-follow-only platforms: excluded from canary because they have no
# keyword search entry point. Guarded by the assertion below.
_CIRCLE_ONLY_PLATFORMS = frozenset()

_SCRAPERS: dict[str, _ScrapeFn] = {
    "ruten":         scrape_ruten,
    "pchome":        scrape_pchome,
    "momo":          scrape_momo,
    "animate":       scrape_animate,
    "yahoo-auction": scrape_yahoo_auction,
    "myacg":         scrape_myacg,
    "kingstone":     scrape_kingstone,
    "mandarake":     scrape_mandarake,
    "melonbooks":    scrape_melonbooks,
    "toranoana":     scrape_toranoana,
    "booth":         scrape_booth,
    "dlsite":        scrape_dlsite,
}

# Invariant: every registered scraper has a canary keyword and vice versa,
# and no circle-only platform is canary-tracked.
assert set(CANARY_KEYWORDS) == set(_SCRAPERS), (
    "CANARY_KEYWORDS / _SCRAPERS platform sets diverged: "
    f"{set(CANARY_KEYWORDS) ^ set(_SCRAPERS)}"
)
assert _CIRCLE_ONLY_PLATFORMS.isdisjoint(CANARY_KEYWORDS), (
    "Circle-follow-only platforms must be excluded from canary"
)


async def run_canary_cycle(context: BrowserContext, api: "WorkerApiClient") -> None:
    """
    Execute one canary scan per platform and upload results in a single
    batched PATCH to /api/worker/canary-status.

    Never raises; individual platform failures degrade to (0, False).
    """
    records: list[dict] = []

    for platform, keyword in CANARY_KEYWORDS.items():
        scrape = _SCRAPERS.get(platform)
        if scrape is None:
            logger.warning("[canary] No scraper registered for %s", platform)
            continue

        page = await context.new_page()
        item_count = 0
        dom_intact = False
        try:
            items = await scrape(page, keyword)
            item_count = len(items)
            dom_intact = consume_dom_intact(platform, default=False)
        except Exception as exc:
            logger.error("[canary/%s] scrape failed: %s", platform, exc)
        finally:
            try:
                await page.close()
            except Exception:
                pass

        records.append({
            "platform": platform,
            "itemCount": item_count,
            "domIntact": dom_intact,
            "ranAt": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(
            "[canary/%s] keyword=%s itemCount=%d domIntact=%s",
            platform, keyword, item_count, dom_intact,
        )

    if records:
        await api.report_canary_status(records)
