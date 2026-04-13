## Context

目前三支高頻 API（`/api/keywords`、`/api/history`、`/api/circles`）TTFB 均達 3-4.5 秒，TTFB 佔總回應時間 99%+，代表瓶頸在 Server-side。HAR 分析顯示同一頁面內相同 API 重複被呼叫，且 Vercel serverless 每次冷啟動都需重新建立資料庫連線。

現有 index 狀況：
- `SeenItem`：已有 `@@index([userId, keywordId, firstSeen(sort: Desc)])` 與 `@@index([userId, firstSeen(sort: Desc)])`
- `Keyword`：**無** userId index
- `CircleFollow`：**無** userId index（只有 `@@unique([userId, platform, circleId])`）
- `PlatformScanStatus`：**無** userId index（只有 `@@unique([userId, platform])`）

Prisma client 已採用 global singleton 模式，但 Vercel serverless 環境下每個 function invocation 仍需重新連線。Neon 提供 pgbouncer 相容端點可解決此問題。

## Goals / Non-Goals

**Goals:**

- 消除 `Keyword`、`CircleFollow`、`PlatformScanStatus` 對 `userId` 的 full table scan
- 補充 `SeenItem` 含 `platform` 過濾的複合 index
- Neon 改用 pgbouncer 連線，減少 serverless 冷連線開銷
- API GET 端點加入 `Cache-Control: private, stale-while-revalidate=60` header，讓重複請求可在 60 秒內 serve from cache
- 消除 `/history` 頁面 `'use client'` useEffect 在 filter 初始化時可能造成的重複 fetch

**Non-Goals:**

- 不引入 Redis 或外部快取層
- 不修改 Worker Python 程式碼
- 不變更任何 API 回應的資料結構

## Decisions

### 新增 Keyword userId index

**決策**：新增 `@@index([userId, createdAt(sort: Desc)])` 至 `Keyword`。

**理由**：`GET /api/keywords` 查詢 `WHERE userId = ? ORDER BY createdAt DESC`，目前無對應 index 導致 full table scan。加入複合 index 可同時滿足 WHERE 與 ORDER BY，不需額外 filesort。

**替代方案**：單欄位 `@@index([userId])` — 可解決 WHERE，但 ORDER BY 仍需 filesort；複合 index 更佳。

### 新增 CircleFollow userId index

**決策**：新增 `@@index([userId, createdAt(sort: Desc)])` 至 `CircleFollow`。

**理由**：`GET /api/circles` 查詢 `WHERE userId = ? ORDER BY createdAt DESC`，模式與 Keyword 相同。

### 新增 PlatformScanStatus userId index

**決策**：新增 `@@index([userId])` 至 `PlatformScanStatus`。

**理由**：`/status` 頁面查詢 `WHERE userId = ? ORDER BY platform ASC`，platform 是固定字串排序，不需含入 index；只需 userId 過濾 index 即可。

### 補充 SeenItem platform 過濾 index

**決策**：新增 `@@index([userId, platform, firstSeen(sort: Desc)])` 至 `SeenItem`。

**理由**：當使用者在 `/history` 用 platform dropdown 過濾時，現有 index `[userId, keywordId, firstSeen]` 無法覆蓋 `WHERE userId = ? AND platform = ?`，導致 full scan。

### Neon pgbouncer 連線

**決策**：在 `DATABASE_URL` 使用 Neon pgbouncer 端點（`?pgbouncer=true&connection_limit=1`），並另設 `DIRECT_URL` 供 Prisma Migrate 使用（migrate 不支援 pgbouncer）。

**理由**：Vercel serverless 每次 invocation 建立新 TCP 連線至 Neon，冷連線約需 300-800ms；pgbouncer 維護連線池，serverless function 複用已有連線，大幅降低連線開銷。

**影響**：`schema.prisma` datasource 需加 `directUrl = env("DIRECT_URL")`。

### Cache-Control headers

**決策**：三支 GET API 加入 `Cache-Control: private, stale-while-revalidate=60` header。

**理由**：`private` 確保 CDN 不快取使用者私人資料；`stale-while-revalidate=60` 讓同一 session 在 60 秒內的重複請求（如頁面切換回來）可立即回應 stale 資料同時背景重新驗證，消除重複 TTFB 等待。

**替代方案**：`max-age=60` — 資料更新後 60 秒內仍顯示舊資料，stale-while-revalidate 更佳因為背景更新。

### 消除 /history 頁面重複 fetch

**決策**：檢查 `useCallback` 的 fetchItems 是否被 ESLint exhaustive-deps 觸發多餘 deps，並確認兩個 useEffect（keywords 與 items）不會因 React re-render 重複觸發。

**理由**：HAR 顯示 `/api/keywords` 被請求兩次。`history/page.tsx` 的 useEffect for keywords 使用 `[]` deps 不會重複觸發；但 fetchItems useCallback 也是 `[]` deps，若 ESLint 警告被誤修改成含 fetchItems 為 dep，會導致 fetchItems 每次 render 重建，再觸發第二個 useEffect。目前程式碼邏輯正確，重複請求應來自 Next.js prefetch。Cache-Control header 加入後，prefetch 結果可重用，無需修改元件。

## Risks / Trade-offs

- [Risk] pgbouncer 模式與 Prisma interactive transactions 不相容 → 檢查現有程式碼無使用 `$transaction` 的互動式 transaction，僅使用批次 query，無影響
- [Risk] `stale-while-revalidate` 導致使用者看到舊資料（最多 60 秒）→ 監控資料（keyword 列表、history）60 秒 stale 可接受；若使用者剛新增 keyword 切頁後看不到，可縮短至 30 秒
- [Risk] DB migration 需 downtime → Neon 支援 online DDL（ADD INDEX 不鎖表），可零停機上線

## Migration Plan

1. 在 `schema.prisma` 加入新 index 與 `directUrl`
2. 執行 `prisma migrate dev` 產生 migration SQL
3. 更新 `.env.example` 說明 `DIRECT_URL`
4. 部署後 Neon 在背景建立 index（不鎖表）
5. Rollback：移除 index 不影響功能，只影響效能
