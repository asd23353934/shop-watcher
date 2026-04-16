from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class WatcherItem:
    platform: str
    item_id: str
    name: str
    price: Optional[float]      # TWD (min price for ranges; used for filtering/price-drop)
    url: str
    image_url: Optional[str] = None
    seller_name: Optional[str] = None
    seller_id: Optional[str] = None   # Platform-specific seller/shop identifier
    price_text: Optional[str] = None  # Display text for price ranges, e.g. "100 ~ 1,000"


class BaseWatcher(ABC):
    PLATFORM = ""

    @abstractmethod
    async def search(self, keyword: str, max_results: int = 20) -> list[WatcherItem]:
        """Search for items matching keyword. Return newest items first.

        All scrapers MUST be async-compatible so they can be executed via
        asyncio.gather() with per-platform Semaphore concurrency control in
        the scheduler.
        """
        ...

    async def search_async(self, keyword: str, max_results: int = 20) -> list[WatcherItem]:
        """Async-safe wrapper — delegates to search().

        If a subclass implements search() as a blocking synchronous method,
        override this method to use asyncio.to_thread(self.search, keyword, max_results)
        so it can safely run inside asyncio.gather without blocking the event loop.
        """
        return await self.search(keyword, max_results)
