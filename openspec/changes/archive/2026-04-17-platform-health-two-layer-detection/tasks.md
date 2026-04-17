## 1. 資料層：建立 PlatformCanaryStatus

- [x] 1.1 於 `webapp/prisma/schema.prisma` 新增 `PlatformCanaryStatus` model，定義欄位 `platform`(unique)、`lastRunAt`、`itemCount`、`domIntact`、`consecutiveEmptyCount`、`healthState`、`unhealthyReason`、`createdAt`、`updatedAt`，對應「PlatformCanaryStatus tracks per-platform canary health」requirement
- [x] 1.2 執行 `prisma migrate dev --name add_platform_canary_status` 產生 migration SQL，確認 local DB 套用成功
- [x] 1.3 執行 `prisma generate` 更新 Prisma Client 型別

## 2. Webapp：Worker canary 回報 API

- [x] 2.1 新增 `webapp/app/api/worker/canary-status/route.ts`，實作 `PATCH` handler，依「Worker 以新增 API endpoint 上報，不合併到現有 `/platform-status`」建立獨立 route，並以 `verifyWorkerToken(request)` 驗證 Bearer token
- [x] 2.2 於 route 檔案頂部定義 payload interface `CanaryReportPayload`，驗證必填欄位 `platform`、`itemCount`、`domIntact`、`ranAt`，缺欄位回 `{ error }` 400
- [x] 2.3 實作「Worker reports canary results via dedicated API endpoint」requirement：每筆記錄先讀取現有 row，計算新的 `consecutiveEmptyCount`（0 筆→+1，非 0→reset 為 0），upsert 寫入
- [x] 2.4 實作「API updates healthState based on canary and DOM signals」requirement 與「`unhealthy` 狀態轉換以「連續異常計數」而非「單次」」決策：依規則 `domIntact==false → unhealthy/dom_broken`、`consecutiveEmptyCount>=2 → unhealthy/empty_canary`、否則 healthy/null 寫入 `healthState` 與 `unhealthyReason`
- [x] 2.5 確保 API route 完全不呼叫 `SYSTEM_ALERT_WEBHOOK` 或其他外部通知，符合「警示以 UI badge 呈現，不推播 Discord」決策；回應僅 HTTP 200 與 upsert 結果

## 3. Webapp：擴充 platform-status API

- [x] 3.1 修改 `webapp/app/api/platform-status/route.ts`，實作「GET /api/platform-status returns canary healthState for authenticated users」requirement：以 `platform` 關聯查詢 `PlatformCanaryStatus`，回應加上 `canaryHealthState`、`canaryUnhealthyReason`、`canaryLastRunAt`
- [x] 3.2 若某平台無 `PlatformCanaryStatus` row，對應欄位回傳 `healthy / null / null` 預設值
- [x] 3.3 更新 `webapp/types/` 下相關型別（或 route 檔案內 interface），確保 TypeScript 型別同步

## 4. Webapp：Dashboard UI 警示 badge

- [x] 4.1 修改 `webapp/components/PlatformScanHealthBadge.tsx`，依「前端在兩個位置顯示警示」決策與「Dashboard displays canary unhealthy badge next to platform scan health」requirement，支援 `canaryHealthState=unhealthy` 時額外顯示視覺上可區分的警示 badge
- [x] 4.2 修改 `webapp/components/PlatformScanHealthSection.tsx`，從 API 回應讀取 canary 欄位並傳入 badge
- [x] 4.3 於 badge tooltip 顯示 `canaryUnhealthyReason`（翻譯為人類可讀文字：`dom_broken`→「頁面結構可能已改版」、`empty_canary`→「canary 關鍵字連續無結果」）與 `canaryLastRunAt`（相對時間）
- [x] 4.4 確保 canary badge 與既有 `failCount >= 3` badge 視覺上可區分（不同顏色或圖示）

## 5. Webapp：關鍵字卡片警示 icon

- [x] 5.1 修改 `webapp/components/KeywordCard.tsx`，依「Keyword card shows canary warning icon for unhealthy platforms」requirement，於每個平台標籤旁根據 `canaryHealthState` 條件渲染警示 icon
- [x] 5.2 由父層（`KeywordList` 或 `KeywordClientSection`）fetch `GET /api/platform-status` 並將 canary 資訊下傳到 `KeywordCard`
- [x] 5.3 實作 icon hover tooltip，顯示原因與最後 canary 時間（相對時間格式）
- [x] 5.4 新增或更新 `webapp/constants/platform.ts`，加入 canary 原因代碼對應文案 map（避免散落在元件內）

## 6. Worker：Scraper DOM 結構檢查

- [x] 6.1 於 `src/scrapers/ruten.py` 實作「Scrapers perform DOM structure check before extracting items」，新增 `_check_dom_structure(page) -> bool`，檢查外層商品列表容器是否存在；於 `scrape_ruten` 內呼叫並將結果納入回傳
- [x] 6.2 同上對 `src/scrapers/pchome.py` 新增 `_check_dom_structure`
- [x] 6.3 同上對 `src/scrapers/momo.py` 新增 `_check_dom_structure`
- [x] 6.4 同上對 `src/scrapers/animate.py` 新增 `_check_dom_structure`
- [x] 6.5 同上對 `src/scrapers/yahoo_auction.py` 新增 `_check_dom_structure`
- [x] 6.6 同上對 `src/scrapers/mandarake.py` 新增 `_check_dom_structure`
- [x] 6.7 同上對 `src/scrapers/myacg.py` 新增 `_check_dom_structure`
- [x] 6.8 同上對 `src/scrapers/kingstone.py` 新增 `_check_dom_structure`
- [x] 6.9 同上對 `src/scrapers/melonbooks.py` 新增 `_check_dom_structure`
- [x] 6.10 同上對 `src/scrapers/toranoana.py` 新增 `_check_dom_structure`
- [x] 6.11 同上對 `src/scrapers/booth.py` 新增 `_check_dom_structure`
- [x] 6.12 同上對 `src/scrapers/dlsite.py` 新增 `_check_dom_structure`
- [x] 6.13 於 `src/watchers/base.py`（或新建 `src/scrapers/types.py`）定義 scraper 回傳結構，加入 `dom_intact: bool` 欄位，並依「DOM 結構檢查以 scraper 內 `check_dom_structure()` 實作，不抽象成框架」保持模組自包含

## 7. Worker：Canary 清單與執行邏輯

- [x] 7.1 新建 `src/canary.py`，依「Canary keyword list is maintained as a Python constant」requirement 與「Canary 清單以 Python 常數維護，不進資料庫」決策，定義 `CANARY_KEYWORDS: dict[str, str]`，涵蓋所有關鍵字搜尋 scraper（ruten、pchome、momo、animate、yahoo_auction、mandarake、myacg、kingstone、melonbooks、toranoana、booth、dlsite）
- [x] 7.2 於 `src/canary.py` 實作 `async def run_canary_cycle(page, api_client) -> None`，對應「Worker executes a canary keyword scan for each platform once per scan cycle」requirement：依序對每個平台跑 canary keyword，收集 `itemCount` 與 `dom_intact`，並以 try/except 包覆避免失敗中斷
- [x] 7.3 canary 失敗時依「Canary scrape failure does not raise」scenario 視為 `itemCount=0, domIntact=false` 並繼續下一個平台
- [x] 7.4 於 `src/canary.py` 內確保 canary 執行過程不呼叫 notify batch、不寫入 `SeenItem`（僅呼叫 scraper 並收集結果）
- [x] 7.5 加入 smoke test / 腳本驗證「Every active search scraper has a canary entry」與「Circle-follow platforms are excluded from canary」scenario

## 8. Worker：API client 與 scheduler 整合

- [x] 8.1 於 `src/api_client.py` 的 `WorkerApiClient` 新增 `report_canary_status(records: list[CanaryRecord])` 方法，POST 至 `/api/worker/canary-status`
- [x] 8.2 修改 `src/scheduler.py` 的 `run_scan_cycle()`，依「Canary 執行頻率與現有 scan cycle 同步」決策，在使用者 scan 完成、`report_scan_completion()` 之前呼叫 `run_canary_cycle()`
- [x] 8.3 canary 結果透過 `report_canary_status()` 上報；Worker 端呼叫 API 失敗時僅記 log、不 raise，避免影響主流程
- [x] 8.4 新增 `ENABLE_CANARY` 環境變數（預設 true），提供 rollback 開關，於 `scheduler.py` 判斷是否執行 canary

## 9. 文件

- [x] 9.1 更新 `CLAUDE.md` 專案說明，補充「平台健康監控」段落的雙層訊號（canary + DOM）與 UI 呈現策略，並將「採用雙訊號而非單一訊號」的結論記入
- [x] 9.2 更新 `README.md` 對應段落（注意 public repo 僅描述功能，不洩露 canary 關鍵字清單或 DOM selector 細節）

## 10. 驗證

- [ ] 10.1 Local 跑 `run_scan_cycle()` 單輪，確認 canary 對 12 個平台都有回報且 `PlatformCanaryStatus` 表正確寫入
- [x] 10.2 手動將某個 scraper 的 DOM selector 改成失效選擇器，驗證「DOM broken immediately transitions to unhealthy」scenario：`healthState` 變為 `unhealthy`，Dashboard 與關鍵字卡片均顯示警示
- [x] 10.3 手動將某平台 canary keyword 改為極冷門字（預期 0 筆），連續跑兩輪後驗證「Two consecutive empty canaries transition to unhealthy」scenario
- [x] 10.4 跑一輪正常掃描，驗證 UI 在 `healthState=healthy` 時不顯示警示 badge/icon
- [x] 10.5 驗證「API does not send external notifications」scenario：確認整個流程未呼叫 `SYSTEM_ALERT_WEBHOOK`（grep 程式碼並觀察 test run log）
- [x] 10.6 驗證「Recovery to healthy clears unhealthyReason」scenario：異常平台恢復後，UI 警示應消失
