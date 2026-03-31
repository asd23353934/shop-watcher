## Why

Shop Watcher 缺乏一個公開的介紹頁面，新使用者必須直接閱讀 README 才能了解專案功能與設定方式，門檻較高。需要一個靜態 Landing Page 清楚呈現功能亮點、安裝步驟與設定說明，降低上手成本。

## What Changes

- **新增** `docs/index.html`：單一頁面靜態網站，使用 Tailwind CSS CDN + highlight.js CDN，不需 build step
- **新增** Hero 區塊（`hero-section`）：專案名稱、一句話介紹、功能亮點標籤（蝦皮、露天、Discord 即時通知、per-user mention）
- **新增** 功能介紹區塊（`feature-section`）：三欄卡片說明平台支援、通知方式、設定彈性
- **新增** 安裝教學區塊（`installation-guide`）：pip install → playwright install → config.yaml → Discord Webhook 設定，四步驟帶編號說明與程式碼區塊
- **新增** config.yaml 欄位說明區塊（`installation-guide`）：完整欄位表格，包含型別、說明、範例值
- **新增** 部署教學區塊（`installation-guide`）：本機 docker compose up 步驟與 Fly.io 雲端部署步驟
- **新增** GitHub Pages 部署設定（`github-pages-deployment`）：在 repo Settings 開啟 Pages，來源設為 `/docs` 資料夾

## Non-Goals

（見 design.md）

## Capabilities

### New Capabilities

- `hero-section`: Landing page 頂部英雄區塊，含專案名稱、標語、功能亮點標籤列
- `feature-section`: 功能介紹三欄卡片區塊，說明平台、通知方式、設定彈性
- `installation-guide`: 安裝教學、config.yaml 欄位說明、Docker/Fly.io 部署教學區塊（含 syntax-highlighted 程式碼）
- `github-pages-deployment`: GitHub Pages 靜態部署設定（`/docs` 資料夾 + `gh-pages` workflow）

### Modified Capabilities

（無，此為全新功能）

## Impact

- **新增檔案**: `docs/index.html`
- **新增 CI/CD**: `.github/workflows/pages.yml`（自動部署 GitHub Pages）
- **新增依賴（CDN only）**: Tailwind CSS v3、highlight.js v11
- **部署環境**: GitHub Pages（免費，與主 repo 同倉，URL 為 `https://{user}.github.io/{repo}/`）
- **不影響**: 主程式邏輯、watcher 執行、Discord 通知
