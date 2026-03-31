## Why

多人 SaaS 平台需要一個無狀態的後端 Worker 服務，定期對蝦皮（Shopee）與露天拍賣（Ruten）執行關鍵字搜尋，並將結果回報給 Next.js 後端 API。去重、通知（Discord / Email）、用戶管理均由 Next.js 負責；Worker 只負責爬蟲與回報，保持精簡且可水平擴展。

**PoC 驗證結果（2026-03-31）：**
- 蝦皮：先訪問首頁取 cookie，再搜尋即可繞過 bot 偵測。selector `[data-sqe="item"]` 命中，`a[href*="-i."]` 可取商品連結
- 露天：selector `a[href*="ruten.com.tw/item/"]` 命中 31 筆，URL 格式為 `ruten.com.tw/item/{22-digit-id}/`，價格與圖片均可取得

## What Changes

- **新增** 蝦皮 Playwright 搜尋（`keyword-search`）：先訪問首頁取 cookie，再搜尋頁取商品卡片 DOM；selector `[data-sqe="item"]` + `a[href*="-i."]`
- **新增** 露天 Playwright 搜尋（`keyword-search`）：SPA 等待渲染後取 `a[href*="ruten.com.tw/item/"]`；URL 格式 `ruten.com.tw/item/{id}/`
- **新增** Worker → Next.js API 通訊（`worker-api-client`）：定時 `GET /api/worker/keywords` 取關鍵字清單；每筆商品 `POST /api/worker/notify` 回報；`Authorization: Bearer {WORKER_SECRET}` 驗證
- **新增** 排程執行器（`watcher-scheduler`）：asyncio 迴圈，每 `CHECK_INTERVAL` 秒執行一次全域掃描；每次掃描共用一個 Playwright browser instance
- **新增** Worker 容器化（`deployment-setup`）：`mcr.microsoft.com/playwright/python` 映像，Fly.io 部署，GitHub Actions CD
- **移除** config.yaml 關鍵字設定 → 改由 `GET /api/worker/keywords` 動態取得
- **移除** SQLite 去重 → 去重邏輯移至 Next.js API（`seen_items` table 在 PostgreSQL）
- **移除** Worker 直接發送 Discord/Email 通知 → 改由 Next.js API 統一處理

## Non-Goals

（見 design.md）

## Capabilities

### New Capabilities

- `keyword-search`: 使用 Playwright headless Chromium 對蝦皮與露天拍賣執行關鍵字搜尋，回傳 `WatcherItem` 列表；支援 per-keyword 價格篩選
- `worker-api-client`: Worker 與 Next.js API 之間的 HTTP 通訊模組；取關鍵字清單、回報商品、Bearer token 驗證
- `watcher-scheduler`: asyncio 排程迴圈，管理 browser 生命週期，協調 keyword-search 與 worker-api-client
- `deployment-setup`: Playwright Docker 映像、`.env` 設定（WORKER_SECRET / NEXT_PUBLIC_API_URL）、Fly.io + GitHub Actions CI/CD

### Modified Capabilities

（無 — item-deduplication 與 discord-notification 已移至 Next.js saas-webapp change，不在本 worker 範疇）

## Impact

- **新增依賴**: `playwright`（Python）、`httpx`（API 通訊）、`python-dotenv`
- **移除依賴**: `aiosqlite`、`pyyaml`、`beautifulsoup4`（不再需要）
- **新增設定**: `.env`（`WORKER_SECRET`、`NEXT_PUBLIC_API_URL`、`CHECK_INTERVAL`）
- **移除設定**: `config.yaml`（不再存在）、`watcher.db`（SQLite 不再使用）
- **外部服務**: Shopee Taiwan（Playwright）、Ruten Taiwan（Playwright）、Next.js API（HTTP）
- **部署環境**: `mcr.microsoft.com/playwright/python:v1.44.0-focal` → Fly.io
- **環境變數**: `WORKER_SECRET`（必填）、`NEXT_PUBLIC_API_URL`（必填）、`CHECK_INTERVAL`（選填，預設 300）
