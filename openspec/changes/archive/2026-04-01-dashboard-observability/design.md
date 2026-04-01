## Context

`SeenItem` 已存有所有通知商品紀錄，只差 UI 呈現層。Worker 掃描時間目前無任何持久化機制，用戶無從得知上次掃描是何時發生。關鍵字預覽功能（scan-preview）需要 Worker 配合提供 dry-run 模式，技術複雜度較高，本次暫不實作。

## Goals / Non-Goals

**Goals:**

- 建立通知歷史 API `GET /api/history`，回傳當前用戶的 SeenItem（按 firstSeen desc，最多 50 筆）
- 建立通知歷史頁面 `/history`，以表格呈現 keyword、platform、itemId、firstSeen
- 新增 ScanLog 資料表（單一 global 記錄），Worker 每次掃描後更新
- Dashboard 顯示最後一筆 ScanLog 時間

**Non-Goals:**

- 不實作關鍵字預覽功能（留至第二階段）
- 不支援通知歷史分頁超過 50 筆（本次不實作 cursor-based pagination）
- 不實作 ScanLog 清理機制（由 data-lifecycle change 處理）

## Decisions

### 通知歷史以 SeenItem 反查，每頁最多 50 筆

`GET /api/history` 以 session 驗證當前用戶，查詢 `prisma.seenItem.findMany({ where: { userId }, orderBy: { firstSeen: 'desc' }, take: 50 })`，回傳 JSON 陣列。前端 `/history` 以 Server Component 直接呼叫 Prisma（無需額外 API fetch）。

**替代方案考慮：** 建立獨立的 NotificationLog 資料表。拒絕原因：SeenItem 已包含所需資訊，增加新資料表會造成資料重複。

### Worker 掃描後回傳掃描時間，儲存於新 ScanLog 表

新增 ScanLog model，id 固定為 `"global"`，僅維護一筆記錄（upsert）。Worker 在 `run_scan_cycle()` 完成後，額外呼叫 `POST /api/worker/scan-log` 帶上 `{ scannedAt: ISO8601 }`，使用 Bearer Token 驗證。Dashboard 查詢此筆記錄並格式化顯示。

**替代方案考慮：** 保留多筆 ScanLog 記錄以供歷史分析。拒絕原因：目前只需顯示最後一次，單一記錄足夠且無需清理。

## Risks / Trade-offs

- **[風險] ScanLog 若改為多筆記錄會有累積問題** → 本次設計為單一 global 記錄，upsert 不累積
- **[風險] Worker 呼叫 scan-log API 失敗不應中斷掃描流程** → Worker 端 try/except 包覆，失敗僅記錄 warning
- **[風險] SeenItem 無 itemName 欄位，歷史頁只能顯示 itemId** → 可接受，itemId 可點擊連結至原商品

## Migration Plan

1. 在 schema.prisma 新增 ScanLog model
2. 執行 `prisma migrate dev --name add_scan_log`
3. 部署 Worker 側的 scan-log 回報邏輯
4. 部署 API 端點與前端頁面

## Open Questions

- 是否需要在歷史頁顯示商品縮圖？（本次不實作，SeenItem 無 imageUrl 欄位）
