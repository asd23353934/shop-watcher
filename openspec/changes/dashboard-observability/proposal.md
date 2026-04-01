## Why

Dashboard 目前無法得知 Worker 上次掃描時間、有沒有出錯、通知了哪些商品，用戶完全看不到系統運作狀況，無從判斷系統是否正常運行。

## What Changes

- 新增「通知記錄」頁面（/history），列出 SeenItem 最近 50 筆，讓用戶查看哪些商品曾被通知
- Dashboard 顯示「上次掃描時間」，Worker 每次掃描完成後回報時間戳，儲存於新 ScanLog 資料表
- 在導覽列加入「通知記錄」連結

## Non-Goals (optional)

## Capabilities

### New Capabilities

- `notification-history`: 通知歷史頁面，以 SeenItem 反查並分頁顯示
- `worker-scan-log`: Worker 掃描完成後記錄時間戳，Dashboard 顯示上次掃描時間

### Modified Capabilities

## Impact

- webapp/app/history/page.tsx（新增）
- webapp/app/api/history/route.ts（新增）
- webapp/app/api/worker/scan-log/route.ts（新增）
- webapp/prisma/schema.prisma（新增 ScanLog model）
- webapp/prisma/migrations/
- webapp/app/dashboard/page.tsx
- src/run_once.py 或 src/scheduler.py
