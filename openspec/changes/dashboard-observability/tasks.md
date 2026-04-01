## 1. ScanLog 資料模型（Worker 掃描後回傳掃描時間，儲存於新 ScanLog 表）

- [x] 1.1 在 webapp/prisma/schema.prisma 新增 ScanLog model：id String @id @default(cuid())，scannedAt DateTime，createdAt DateTime @default(now())；執行 prisma migrate dev --name add_scan_log（Worker records scan completion time to API）
- [x] 1.2 建立 webapp/app/api/worker/scan-log/route.ts：POST handler 以 Bearer auth 驗證，upsert 單一 ScanLog 記錄（id 固定為 "global"，更新 scannedAt）（Worker records scan completion time to API）
- [x] 1.3 在 src/run_once.py 或 src/scheduler.py 的 run_scan_cycle() 完成後，額外呼叫 POST /api/worker/scan-log { "scannedAt": datetime.utcnow().isoformat() }（Worker posts scan log after cycle）
- [x] 1.4 在 webapp/app/dashboard/page.tsx 查詢最新 ScanLog，在頁面頂部顯示「上次掃描：{time} 前」或「尚未掃描」（Dashboard shows last scan time）

## 2. 通知歷史頁面（通知歷史以 SeenItem 反查，每頁最多 50 筆）

- [x] 2.1 建立 webapp/app/api/history/route.ts：GET handler 取當前用戶的 SeenItem，orderBy firstSeen desc，take 50，回傳 JSON 陣列（User can view notification history）
- [x] 2.2 建立 webapp/app/history/page.tsx：Server Component，呼叫 prisma 取 SeenItem，以表格顯示 keyword、platform、itemId、firstSeen；無資料時顯示佔位文字（Empty history shows placeholder）
- [x] 2.3 在 webapp/app/dashboard/layout.tsx 或導覽列新增「通知記錄」連結指向 /history（User can view notification history）
