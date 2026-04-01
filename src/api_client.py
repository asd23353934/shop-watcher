"""
WorkerApiClient — HTTP client for Worker ↔ Next.js API communication.

All requests use Bearer token authentication (WORKER_SECRET).
Base URL is read from NEXT_PUBLIC_API_URL environment variable.
"""

import logging
import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class WorkerApiClient:
    """Stateless HTTP client for the SaaS Worker API."""

    def __init__(self) -> None:
        secret = os.environ.get("WORKER_SECRET")
        if not secret:
            raise ValueError("WORKER_SECRET is required")

        base_url = os.environ.get("NEXT_PUBLIC_API_URL")
        if not base_url:
            raise ValueError("NEXT_PUBLIC_API_URL is required")

        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {secret}"},
            timeout=10.0,
        )

    async def get_keywords(self) -> list[dict]:
        """
        GET /api/worker/keywords

        Returns list of active keyword dicts:
          { id, keyword, platforms, min_price, max_price,
            discordWebhookUrl, discordUserId, emailAddress }

        Returns empty list on any error (non-2xx or network exception).
        """
        url = f"{self._base_url}/api/worker/keywords"
        try:
            resp = await self._client.get(url)
            if resp.status_code == 200:
                return resp.json()
            logger.error(
                "get_keywords: HTTP %s — %s",
                resp.status_code,
                resp.text[:200],
            )
            return []
        except httpx.HTTPError as exc:
            logger.error("get_keywords: network error — %s", exc)
            return []

    async def notify_item(self, keyword_id: str, item) -> bool:
        """
        POST /api/worker/notify

        Reports a single scraped WatcherItem to the Next.js API.
        Returns True on HTTP 200/201, False on any error.
        """
        url = f"{self._base_url}/api/worker/notify"
        payload = {
            "keyword_id": keyword_id,
            "platform": item.platform,
            "item_id": item.item_id,
            "name": item.name,
            "price": item.price,
            "url": item.url,
            "image_url": item.image_url,
        }
        try:
            resp = await self._client.post(url, json=payload)
            if resp.status_code in (200, 201):
                return True
            logger.error(
                "notify_item: HTTP %s — %s",
                resp.status_code,
                resp.text[:200],
            )
            return False
        except httpx.HTTPError as exc:
            logger.error("notify_item: network error — %s", exc)
            return False

    async def post_scan_log(self, scanned_at: str) -> bool:
        """
        POST /api/worker/scan-log

        Records the scan completion time to the Next.js API.
        Returns True on HTTP 200, False on any error.
        """
        url = f"{self._base_url}/api/worker/scan-log"
        payload = {"scannedAt": scanned_at}
        try:
            resp = await self._client.post(url, json=payload)
            if resp.status_code in (200, 201):
                return True
            logger.error(
                "post_scan_log: HTTP %s — %s",
                resp.status_code,
                resp.text[:200],
            )
            return False
        except httpx.HTTPError as exc:
            logger.error("post_scan_log: network error — %s", exc)
            return False

    async def notify_batch(self, keyword_id: str, items: list) -> dict:
        """
        POST /api/worker/notify/batch

        Sends a batch of scraped WatcherItems to the Next.js API in a single request.
        Returns { "new": N, "duplicate": M } on success, or { "new": 0, "duplicate": 0 } on error.
        """
        url = f"{self._base_url}/api/worker/notify/batch"
        payload = {
            "keyword_id": keyword_id,
            "items": [
                {
                    "platform": item.platform,
                    "item_id": item.item_id,
                    "name": item.name,
                    "price": item.price,
                    "price_text": item.price_text,
                    "url": item.url,
                    "image_url": item.image_url,
                    "seller_name": item.seller_name,
                }
                for item in items
            ],
        }
        try:
            resp = await self._client.post(url, json=payload)
            if resp.status_code in (200, 201):
                return resp.json()
            logger.error(
                "notify_batch: HTTP %s — %s",
                resp.status_code,
                resp.text[:200],
            )
            return {"new": 0, "duplicate": 0}
        except httpx.HTTPError as exc:
            logger.error("notify_batch: network error — %s", exc)
            return {"new": 0, "duplicate": 0}

    async def close(self) -> None:
        await self._client.aclose()
