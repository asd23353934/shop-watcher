"""
Watcher Scheduler — asyncio loop that drives all keyword-platform scans.

- Reads keywords from Next.js API before each cycle
- Shares one Playwright browser instance per scan cycle
- Reports found items to Next.js API
- Runs indefinitely; exits cleanly on KeyboardInterrupt / SIGTERM
"""

import asyncio
import logging
import os
import signal
from typing import Optional

from playwright.async_api import async_playwright

from src.api_client import WorkerApiClient
from src.scrapers.shopee import scrape_shopee
from src.scrapers.ruten import scrape_ruten

logger = logging.getLogger(__name__)


def _get_check_interval() -> int:
    """Read CHECK_INTERVAL from env, default 300."""
    try:
        return int(os.environ.get("CHECK_INTERVAL", "300"))
    except ValueError:
        return 300


async def run_scan_cycle(api: WorkerApiClient) -> None:
    """
    Execute one full scan cycle:
    1. Fetch keywords from API
    2. Launch one shared browser (A single Playwright browser instance is shared across all searches in one scan cycle)
    3. For each keyword × platform, scrape and report items
    4. Close browser
    """
    keywords = await api.get_keywords()

    if not keywords:
        logger.info("No active keywords, skipping scan")
        return

    # Launch shared browser instance
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
            ],
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="zh-TW",
            timezone_id="Asia/Taipei",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )

        try:
            for kw in keywords:
                keyword_id: str = kw.get("id", "")
                keyword_text: str = kw.get("keyword", "")
                platforms: list[str] = kw.get("platforms", ["shopee", "ruten"])
                min_price: Optional[float] = kw.get("minPrice")
                max_price: Optional[float] = kw.get("maxPrice")

                # Each keyword-platform pair is searched independently
                for platform in platforms:
                    page = await context.new_page()
                    try:
                        if platform == "shopee":
                            items = await scrape_shopee(
                                page, keyword_text, min_price, max_price
                            )
                        elif platform == "ruten":
                            items = await scrape_ruten(
                                page, keyword_text, min_price, max_price
                            )
                        else:
                            logger.warning("Unknown platform: %s", platform)
                            items = []
                    except Exception as exc:
                        logger.error(
                            "[%s] %s — unhandled error: %s",
                            platform, keyword_text, exc,
                        )
                        items = []
                    finally:
                        await page.close()

                    # Found items are reported to Next.js API immediately after each search
                    reported = 0
                    for item in items:
                        ok = await api.notify_item(keyword_id, item)
                        if ok:
                            reported += 1

                    # Per-scan summary is logged to stdout
                    logger.info(
                        "[%s] %s — %d found, %d reported",
                        platform, keyword_text, len(items), reported,
                    )
        finally:
            # Browser is always closed after a scan cycle
            await browser.close()


async def run_scheduler() -> None:
    """
    Main scheduler loop. Runs indefinitely until interrupted.

    Validates environment variables before entering the loop
    (Application environment is validated before the scheduler starts).
    """
    # Validate required env vars
    if not os.environ.get("WORKER_SECRET"):
        raise SystemExit("WORKER_SECRET is required")
    if not os.environ.get("NEXT_PUBLIC_API_URL"):
        raise SystemExit("NEXT_PUBLIC_API_URL is required")

    interval = _get_check_interval()
    logger.info("Shop Watcher started (interval=%ds)", interval)

    api = WorkerApiClient()
    stop_event = asyncio.Event()

    def _handle_signal(sig, frame):  # noqa: ARG001
        logger.info("Received signal %s, shutting down...", sig)
        stop_event.set()

    # Scheduler runs indefinitely until interrupted
    signal.signal(signal.SIGTERM, _handle_signal)

    try:
        while not stop_event.is_set():
            try:
                await run_scan_cycle(api)
            except Exception as exc:
                logger.error("Scan cycle error: %s", exc)

            # Sleep between scans, but wake up early if stopped
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=interval)
            except asyncio.TimeoutError:
                pass
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt received, shutting down...")
    finally:
        await api.close()
        logger.info("Shop Watcher stopped.")
