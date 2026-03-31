"""
單次掃描入口 — 供 GitHub Actions 使用。
執行一次完整的掃描循環後退出。
"""

import asyncio
import logging
import sys

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)

from src.api_client import WorkerApiClient  # noqa: E402
from src.scheduler import run_scan_cycle    # noqa: E402


async def main() -> None:
    api = WorkerApiClient()
    try:
        await run_scan_cycle(api)
    finally:
        await api.close()


if __name__ == "__main__":
    asyncio.run(main())
