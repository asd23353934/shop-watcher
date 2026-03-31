import aiosqlite
from datetime import datetime

DB_PATH = "watcher.db"


async def init_db(db_path: str = DB_PATH) -> None:
    async with aiosqlite.connect(db_path) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS seen_items (
                platform    TEXT NOT NULL,
                item_id     TEXT NOT NULL,
                keyword     TEXT NOT NULL,
                first_seen  TEXT NOT NULL,
                PRIMARY KEY (platform, item_id)
            )
        """)
        await db.commit()


async def is_new_item(platform: str, item_id: str, keyword: str, db_path: str = DB_PATH) -> bool:
    """Returns True if item has NOT been seen before, and records it."""
    async with aiosqlite.connect(db_path) as db:
        async with db.execute(
            "SELECT 1 FROM seen_items WHERE platform = ? AND item_id = ?",
            (platform, item_id),
        ) as cursor:
            row = await cursor.fetchone()

        if row:
            return False

        await db.execute(
            "INSERT INTO seen_items (platform, item_id, keyword, first_seen) VALUES (?, ?, ?, ?)",
            (platform, item_id, keyword, datetime.utcnow().isoformat()),
        )
        await db.commit()
        return True


async def get_stats(db_path: str = DB_PATH) -> dict:
    async with aiosqlite.connect(db_path) as db:
        async with db.execute("SELECT COUNT(*) FROM seen_items") as cursor:
            total = (await cursor.fetchone())[0]
        async with db.execute(
            "SELECT platform, COUNT(*) FROM seen_items GROUP BY platform"
        ) as cursor:
            by_platform = {row[0]: row[1] for row in await cursor.fetchall()}
    return {"total": total, "by_platform": by_platform}
