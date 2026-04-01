## 1. Cleanup Script（清理 Script 以 ts-node 執行 Prisma deleteMany，由 GitHub Actions 每日觸發）

- [x] 1.1 建立 webapp/scripts/cleanup.ts：import prisma from @/lib/prisma；讀取 SEEN_ITEM_RETENTION_DAYS（預設 30）與 SCAN_LOG_RETENTION_DAYS（預設 7）；計算各自截止時間；執行 prisma.seenItem.deleteMany({ where: { firstSeen: { lt: seenItemCutoff } } })；輸出刪除筆數到 stdout（Expired SeenItem rows are deleted daily）
- [x] 1.2 在 webapp/scripts/cleanup.ts 中執行 prisma.scanLog.deleteMany({ where: { scannedAt: { lt: scanLogCutoff } } })；輸出刪除筆數到 stdout；最後呼叫 prisma.$disconnect()（Expired ScanLog rows are deleted daily）
- [x] 1.3 在 webapp/package.json 新增 script: "cleanup": "ts-node --project tsconfig.json scripts/cleanup.ts"（保留天數以環境變數設定，預設 SeenItem 30 天，ScanLog 7 天）（Cleanup job outputs deletion count）

## 2. GitHub Actions Cleanup Workflow（GitHub Actions 每日觸發）

- [x] 2.1 建立 .github/workflows/cleanup.yml：on: schedule cron "0 2 * * *"（每日 UTC 02:00）；jobs: cleanup，runs-on: ubuntu-latest；steps: checkout、setup-node 22、在 webapp 目錄執行 npm ci、執行 npm run cleanup，並注入 DATABASE_URL secret（Expired SeenItem rows are deleted daily、Expired ScanLog rows are deleted daily）
