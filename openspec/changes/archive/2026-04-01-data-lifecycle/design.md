## Context

SeenItem 目前無 TTL（Time-To-Live）機制，每個通知過的商品永久留存資料庫。ScanLog 設計為單一 global 記錄（upsert），理論上不累積；但若未來改為多筆記錄則需要清理。Neon.tech free tier 儲存上限為 0.5GB，隨著監控商品數量與頻率增加，長期不清理必然耗盡配額。

## Goals / Non-Goals

**Goals:**

- 建立 `webapp/scripts/cleanup.ts`：以 ts-node 執行 Prisma deleteMany，清除過期資料
- 建立 `.github/workflows/cleanup.yml`：每日 UTC 02:00 觸發 cleanup script
- 以環境變數 `SEEN_ITEM_RETENTION_DAYS`（預設 30）與 `SCAN_LOG_RETENTION_DAYS`（預設 7）控制保留天數
- 清理完成後輸出刪除筆數到 stdout，便於 GitHub Actions 日誌追蹤

**Non-Goals:**

- 不實作手動觸發 cleanup 的 API 端點
- 不實作 cleanup 失敗通知（依賴 GitHub Actions 原生失敗通知）
- 不清理 User 或 Keyword 資料（僅清理自動生成的日誌/去重資料）

## Decisions

### 清理 Script 以 ts-node 執行 Prisma deleteMany，由 GitHub Actions 每日觸發

建立 `webapp/scripts/cleanup.ts`：
1. 從環境變數讀取保留天數
2. 計算截止時間：`new Date(Date.now() - retentionDays * 86400_000)`
3. 呼叫 `prisma.seenItem.deleteMany({ where: { firstSeen: { lt: cutoff } } })`
4. 呼叫 `prisma.scanLog.deleteMany({ where: { scannedAt: { lt: cutoff } } })`
5. 輸出刪除筆數後 `prisma.$disconnect()`

**替代方案考慮：** 在 Next.js API route 建立 cleanup 端點，以外部 cron 服務呼叫。拒絕原因：引入額外外部依賴（cron 服務），且 GitHub Actions 已有 schedule trigger，不需額外費用。

### 保留天數以環境變數設定，預設 SeenItem 30 天，ScanLog 7 天

`SEEN_ITEM_RETENTION_DAYS=30`（30 天內的商品去重仍有效）、`SCAN_LOG_RETENTION_DAYS=7`（掃描日誌保留一週已足夠除錯）。

**替代方案考慮：** 寫死保留天數。拒絕原因：不同部署環境（開發/生產）可能需要不同保留策略。

## Risks / Trade-offs

- **[風險] SeenItem 被清除後，30 天前的商品可能在用戶重建相同關鍵字後重新通知** → 可接受，說明文件告知用戶此行為
- **[風險] GitHub Actions 若使用量超過 free tier 限制則不執行** → 每日一次 cleanup 遠低於 free tier 用量上限
- **[風險] `ts-node` 執行速度較慢** → cleanup 為非即時性任務，啟動時間可接受

## Migration Plan

1. 新增 `webapp/scripts/cleanup.ts`
2. 更新 `webapp/package.json` 加入 cleanup script
3. 新增 `.github/workflows/cleanup.yml`
4. 在 GitHub Repository Secrets 設定 `DATABASE_URL`（若尚未設定）

## Open Questions

- 是否需要在清理前先備份？（本次不實作，Neon.tech 有每日自動備份）
