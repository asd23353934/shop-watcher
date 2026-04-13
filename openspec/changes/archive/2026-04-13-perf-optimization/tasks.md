## 1. 資料庫 Index（新增 Keyword userId index、新增 CircleFollow userId index、新增 PlatformScanStatus userId index、補充 SeenItem platform 過濾 index）

- [x] 1.1 在 `webapp/prisma/schema.prisma` 的 `Keyword` model 新增 `@@index([userId, createdAt(sort: Desc)])`，實作 Keyword userId query uses index，讓 `GET /api/keywords` 的 `WHERE userId ORDER BY createdAt DESC` 不再 full table scan
- [x] 1.2 在 `webapp/prisma/schema.prisma` 的 `CircleFollow` model 新增 `@@index([userId, createdAt(sort: Desc)])`，實作 CircleFollow userId query uses index，讓 `GET /api/circles` 查詢走 index
- [x] 1.3 在 `webapp/prisma/schema.prisma` 的 `PlatformScanStatus` model 新增 `@@index([userId])`，實作 PlatformScanStatus userId query uses index，讓 `/status` 頁面查詢走 index
- [x] 1.4 在 `webapp/prisma/schema.prisma` 的 `SeenItem` model 新增 `@@index([userId, platform, firstSeen(sort: Desc)])`，實作 SeenItem platform filter query uses index，讓 platform 過濾的 history 查詢走複合 index
- [x] 1.5 在 `webapp/prisma/schema.prisma` 的 `datasource db` 區塊加入 `directUrl = env("DIRECT_URL")`，實作 Neon pgbouncer 連線方案，migration 走 directUrl、runtime 走 pgbouncer 端點
- [x] 1.6 執行 `cd webapp && npx prisma migrate dev --name add-perf-indexes`，產生 migration SQL 並套用至本機 DB

## 2. 環境變數說明（Neon pgbouncer 連線）

- [x] 2.1 在 `webapp/.env.example` 新增 `DIRECT_URL` 欄位說明：Neon 直連字串（用於 Prisma Migrate，不加 pgbouncer 參數）；並標注 `DATABASE_URL` 應改為 Neon pgbouncer 端點格式（`postgres://...?pgbouncer=true&connection_limit=1`）

## 3. API Cache-Control headers（GET /api/history responds with cache headers、GET /api/keywords responds with cache headers、GET /api/circles responds with cache headers、Cache-Control headers）

- [x] 3.1 在 `webapp/app/api/history/route.ts` 的 `GET` handler 成功回應加入 `Cache-Control: private, stale-while-revalidate=60` header，實作 GET /api/history responds with cache headers；將 `return NextResponse.json({ items: pageItems, nextCursor })` 改為帶 headers 的形式
- [x] 3.2 在 `webapp/app/api/keywords/route.ts` 的 `GET` handler 成功回應加入 `Cache-Control: private, stale-while-revalidate=60` header，實作 GET /api/keywords responds with cache headers
- [x] 3.3 在 `webapp/app/api/circles/route.ts` 的 `GET` handler 成功回應加入 `Cache-Control: private, stale-while-revalidate=60` header，實作 GET /api/circles responds with cache headers

## 4. 驗證重複 fetch 已消除（消除 /history 頁面重複 fetch）

- [x] 4.1 確認 `webapp/app/history/page.tsx` 的 useEffect dependencies 正確：keywords useEffect 使用 `[]`、items useEffect 使用 `[selectedKeywordId, selectedPlatform, fetchItems]`，確保 消除 /history 頁面重複 fetch（重複請求由 Cache-Control stale-while-revalidate 在 browser 層消除，元件本身邏輯不需修改）
