"""
WorkerApiClient — HTTP client for Worker ↔ Next.js API communication.

All requests use Bearer token authentication (WORKER_SECRET).
Base URL is read from NEXT_PUBLIC_API_URL environment variable.
"""

import asyncio
import logging
import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Max concurrent notify_batch HTTP calls — prevents burst congestion on the API
_NOTIFY_BATCH_CONCURRENCY = 8
assert _NOTIFY_BATCH_CONCURRENCY > 0, "_NOTIFY_BATCH_CONCURRENCY must be positive"


class WorkerApiClient:
    """HTTP client for Worker ↔ Next.js API communication."""

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
            follow_redirects=True,
        )
        self._batch_semaphore = asyncio.Semaphore(_NOTIFY_BATCH_CONCURRENCY)

    async def get_keywords(self) -> list[dict]:
        """
        GET /api/worker/keywords

        Returns list of active keyword dicts:
          { id, userId, keyword, platforms, minPrice, maxPrice,
            blocklist, mustInclude, matchMode, sellerBlocklist,
            discordWebhookUrl, maxNotifyPerScan }
        Notification settings are resolved server-side in /api/worker/notify/batch.

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

    async def notify_batch(
        self,
        keyword_id: Optional[str],
        items: list,
        keyword_webhook_url: Optional[str] = None,
        max_notify_per_scan: Optional[int] = None,
        circle_follow_id: Optional[str] = None,
    ) -> dict:
        """
        POST /api/worker/notify/batch

        Sends a batch of scraped WatcherItems to the Next.js API in a single request.
        Exactly one of keyword_id or circle_follow_id must be provided.
        Optional fields forwarded to the API for server-side filtering:
          - keyword_webhook_url: per-keyword Discord webhook (None = use global)
          - max_notify_per_scan: cap on new notifications per scan cycle
          - circle_follow_id: for CircleFollow notifications (instead of keyword_id)
        Returns { "new": N, "price_drop": P, "duplicate": M } on success,
        or { "new": 0, "price_drop": 0, "duplicate": 0 } on error.
        """
        url = f"{self._base_url}/api/worker/notify/batch"
        payload: dict = {
            "items": [
                {
                    "platform": item.platform,
                    "itemId": item.item_id,
                    "name": item.name,
                    "price": item.price,
                    "priceText": item.price_text,
                    "url": item.url,
                    "imageUrl": item.image_url,
                    "sellerName": item.seller_name,
                    "sellerId": item.seller_id,
                }
                for item in items
            ],
        }
        # Set either keywordId or circleFollowId
        if keyword_id is not None:
            payload["keywordId"] = keyword_id
        if circle_follow_id is not None:
            payload["circleFollowId"] = circle_follow_id
        # Forward per-keyword overrides only when explicitly provided
        if keyword_webhook_url is not None:
            payload["keywordWebhookUrl"] = keyword_webhook_url
        if max_notify_per_scan is not None:
            payload["maxNotifyPerScan"] = max_notify_per_scan
        async with self._batch_semaphore:
            try:
                resp = await self._client.post(url, json=payload)
                if resp.status_code in (200, 201):
                    return resp.json()
                logger.error(
                    "notify_batch: HTTP %s — %s",
                    resp.status_code,
                    resp.text[:200],
                )
                return {"new": 0, "price_drop": 0, "duplicate": 0}
            except httpx.HTTPError as exc:
                logger.error("notify_batch: network error — %s", exc)
                return {"new": 0, "price_drop": 0, "duplicate": 0}

    async def get_circle_follows(self) -> list[dict]:
        """
        GET /api/worker/circles

        Returns list of all active CircleFollow records across all users:
          { id, userId, platform, circleId, circleName, webhookUrl }

        Returns empty list on any error (non-2xx or network exception).
        """
        url = f"{self._base_url}/api/worker/circles"
        try:
            resp = await self._client.get(url)
            if resp.status_code == 200:
                return resp.json()
            logger.error(
                "get_circle_follows: HTTP %s — %s",
                resp.status_code,
                resp.text[:200],
            )
            return []
        except httpx.HTTPError as exc:
            logger.error("get_circle_follows: network error — %s", exc)
            return []

    async def update_platform_scan_status(
        self,
        platform: str,
        success: bool,
        error: Optional[str] = None,
        user_id: str = "",
    ) -> bool:
        """
        PATCH /api/worker/platform-status

        Upserts PlatformScanStatus for the given userId + platform.
        - success=True: updates lastSuccess, resets failCount to 0
        - success=False: increments failCount, records error message

        Returns True on HTTP 200, False on any error.
        """
        url = f"{self._base_url}/api/worker/platform-status"
        payload: dict = {
            "userId": user_id,
            "platform": platform,
            "success": success,
        }
        if error is not None:
            payload["error"] = error[:500]  # truncate long stack traces
        try:
            resp = await self._client.patch(url, json=payload)
            if resp.status_code == 200:
                return True
            logger.error(
                "update_platform_scan_status: HTTP %s — %s",
                resp.status_code,
                resp.text[:200],
            )
            return False
        except httpx.HTTPError as exc:
            logger.error("update_platform_scan_status: network error — %s", exc)
            return False

    async def report_canary_status(self, records: list[dict]) -> bool:
        """
        PATCH /api/worker/canary-status

        Batched upsert of PlatformCanaryStatus rows. Each record must carry
        `platform`, `itemCount`, `domIntact`, `ranAt` (ISO-8601 UTC).

        Returns True on HTTP 200, False on any error. Never raises.
        """
        url = f"{self._base_url}/api/worker/canary-status"
        try:
            resp = await self._client.patch(url, json={"records": records})
            if resp.status_code == 200:
                return True
            logger.error(
                "report_canary_status: HTTP %s — %s",
                resp.status_code,
                resp.text[:200],
            )
            return False
        except httpx.HTTPError as exc:
            logger.error("report_canary_status: network error — %s", exc)
            return False

    async def close(self) -> None:
        await self._client.aclose()
