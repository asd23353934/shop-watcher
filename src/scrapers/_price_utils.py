"""
Shared price parsing helpers for all scrapers.
"""

import re
from typing import Optional

from src.watchers.base import WatcherItem


def _parse_price(text: str) -> Optional[float]:
    """Parse TWD price string → float (min price for ranges). Returns None if unparseable."""
    if not text:
        return None
    numbers = re.findall(r"[\d,]+", text)
    if not numbers:
        return None
    try:
        return float(numbers[0].replace(",", ""))
    except ValueError:
        return None


def _extract_price_text(text: str) -> Optional[str]:
    """
    Extract display price text for price ranges (e.g. '100 ~ 1,000').
    Returns None for single prices (let the caller format normally).
    """
    if not text:
        return None
    numbers = re.findall(r"[\d,]+", text)
    if len(numbers) < 2:
        return None
    try:
        first = int(numbers[0].replace(",", ""))
        second = int(numbers[1].replace(",", ""))
        if first != second:
            return f"{first:,} ~ {second:,}"
    except ValueError:
        pass
    return None


def _apply_price_filter(
    items: list[WatcherItem],
    min_price: Optional[float],
    max_price: Optional[float],
) -> list[WatcherItem]:
    """
    Filter items by price range.
    Items with price=None are always kept — some listing pages omit prices,
    and dropping them would produce false negatives.
    """
    result = []
    for item in items:
        if item.price is None:
            result.append(item)
            continue
        if min_price is not None and item.price < min_price:
            continue
        if max_price is not None and item.price > max_price:
            continue
        result.append(item)
    return result
