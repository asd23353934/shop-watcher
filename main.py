"""
Shop Watcher — SaaS Worker entry point.

Usage:
    python main.py

Required environment variables (see .env.example):
    WORKER_SECRET          — shared secret with Next.js API
    NEXT_PUBLIC_API_URL    — Next.js API base URL
    CHECK_INTERVAL         — scan interval in seconds (default: 300)
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

from src.scheduler import run_scheduler  # noqa: E402

if __name__ == "__main__":
    asyncio.run(run_scheduler())
