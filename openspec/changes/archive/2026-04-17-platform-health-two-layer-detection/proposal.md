## Why

現有 `PlatformScanStatus` 僅以「scraper 是否 raise 例外」判斷平台健康度，無法偵測「HTTP 200 回應但 selector 失效」導致全平台掃描返回 0 筆的情境。單純以「使用者關鍵字 0 筆」作為警示訊號會大量誤報，因為可能只是該關鍵字在該平台本來就無商品（例：日文關鍵字搜尋 PChome、冷門關鍵字搜尋 Booth）。結果是：當 scraper 因網站改版而靜默失效時，系統無法察覺，使用者要等到發現「最近都沒通知」才回報。

## What Changes

- 新增 **Canary Keyword 機制**：每個平台設定一組保證有結果的對照關鍵字（台灣平台用「公仔」、日系平台用「初音」等），Worker 每次 scan cycle 結束後執行 canary 掃描
- 新增 **DOM 結構檢查**：每個 scraper 在擷取商品前檢查商品列表容器是否存在，區分「容器在但 0 筆」（正常無貨）與「容器不存在」（平台改版）
- 新增 `PlatformCanaryStatus` 資料表，記錄每個平台最近一次 canary 結果（`lastRunAt`、`itemCount`、`domIntact`、`consecutiveEmptyCount`、`healthState`）
- 警示規則：canary 連續 N 次 0 筆 **或** DOM 結構異常 → 將平台 `healthState` 標記為 `unhealthy`，**不推播任何 Discord webhook**，僅於 webapp UI 呈現
- UI 呈現：Dashboard 既有的平台健康區塊顯示 canary 警示 badge；使用者關鍵字卡片上，若該關鍵字所屬平台為 `unhealthy`，於平台標籤旁附上警示 icon（hover 顯示原因與最近 canary 時間）
- 修改 `platform-scan-health` spec：新增 canary 與 DOM 結構檢查相關 requirement
- Canary 執行由 Worker 主導，不佔用使用者關鍵字配額、不寫入 `SeenItem`、不觸發使用者通知

## Non-Goals

- 不自動修復 scraper（偵測到改版由 operator 介入）
- 不透過 Discord/Email 推播系統警示（僅 UI 呈現，避免打擾；`SYSTEM_ALERT_WEBHOOK` 仍保留給既有逾時告警使用）
- 不取代現有 `PlatformScanStatus` 的 `failCount` 機制（兩者並存，涵蓋不同失敗模式）
- 不對 canary 實作「自動修正 selector」或 AI 推斷，維持單純的訊號偵測
- 不針對 `circle-follow`（店舖追蹤）加 canary，僅覆蓋關鍵字搜尋 scraper

## Capabilities

### New Capabilities

- `platform-canary-monitoring`: Canary keyword 週期性執行、結果記錄、DOM 結構檢查，以及將健康狀態暴露給 webapp 供 UI 讀取

### Modified Capabilities

- `platform-scan-health`: 新增 DOM 結構檢查要求，scraper 回報的 health signal 需包含 `domIntact` 欄位，Dashboard 顯示 canary 警示 badge
- `keyword-management`: 關鍵字卡片的平台標籤需能顯示該平台 `unhealthy` 警示

## Impact

- **Affected specs**:
  - 新增 `openspec/specs/platform-canary-monitoring/spec.md`
  - 修改 `openspec/specs/platform-scan-health/spec.md`（delta）
  - 修改 `openspec/specs/keyword-management/spec.md`（delta，加警示 badge requirement）
- **Affected code**:
  - `webapp/prisma/schema.prisma`：新增 `PlatformCanaryStatus` model
  - `webapp/app/api/worker/canary-status/route.ts`：新增 Worker 回報 canary 結果 API（Bearer token）
  - `webapp/app/api/platform-status/route.ts`：回傳內容加上 canary `healthState`，供 UI 使用
  - `webapp/components/PlatformScanHealthBadge.tsx`、`PlatformScanHealthSection.tsx`：顯示 canary 警示
  - `webapp/components/KeywordCard.tsx`：平台標籤旁加上警示 icon（當 `healthState=unhealthy`）
  - `webapp/constants/platform.ts`：可能需補 canary 警示 label 文案
  - `src/scrapers/*.py`（12 個 scraper）：每個 scraper 新增 `_check_dom_structure()` 內部檢查，回傳 `dom_intact` 布林
  - `src/watchers/base.py`：scan 結果結構新增 `dom_intact` 欄位
  - `src/canary.py`（新檔）：canary keyword 清單與執行邏輯
  - `src/scheduler.py`：`run_scan_cycle()` 結尾呼叫 canary scan
  - `src/api_client.py`：新增 `report_canary_status()` 方法
- **Environment variables**: 無新增（`SYSTEM_ALERT_WEBHOOK` 仍維持原用途，不被 canary 使用）
- **Migration**: 需執行 `prisma migrate dev` 建立 `PlatformCanaryStatus` table
