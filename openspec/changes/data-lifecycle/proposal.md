## Why

SeenItem 與 ScanLog 無限累積，Neon.tech free tier 只有 0.5GB 儲存空間，長期運作會耗盡配額，導致服務中斷。

## What Changes

- 新增 GitHub Actions cleanup workflow，每天 UTC 02:00 自動執行清理作業
- 清理超過 30 天的 SeenItem（可透過環境變數調整保留天數）
- 清理超過 7 天的 ScanLog（可透過環境變數調整保留天數）
- 清理以 TypeScript 腳本搭配 Prisma 執行，不影響近期通知去重功能

## Non-Goals (optional)

## Capabilities

### New Capabilities

- `data-cleanup`: 自動每日清理過期 SeenItem 與 ScanLog 資料

### Modified Capabilities

## Impact

- .github/workflows/cleanup.yml（新增）
- webapp/scripts/cleanup.ts（新增）
- webapp/package.json
