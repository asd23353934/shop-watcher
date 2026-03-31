## 1. 基礎 HTML 結構與 CDN 設定（單一 HTML 檔案決策）

- [x] 1.1 建立 `docs/` 目錄；建立 `docs/index.html`，加入 `<!DOCTYPE html>` 與 `<html lang="zh-TW">` 基本結構（單一 HTML 檔案（不使用靜態網站產生器）決策：所有內容寫入單一 `docs/index.html`，零建置依賴）
- [x] 1.2 在 `<head>` 加入 Tailwind CSS v3 via CDN Play CDN（`@tailwindcss/browser`）：`<script src="https://cdn.tailwindcss.com">`；設定 `tailwind.config` 深色模式為 `class`（無需本地安裝，HTML 獨立運作）
- [x] 1.3 在 `<head>` 加入 highlight.js v11 CDN（`cdnjs.cloudflare.com`）CSS 連結（`github-dark` 主題）與 JS 連結；在 `</body>` 前加入 `<script>hljs.highlightAll();</script>`（highlight.js v11 via CDN + GitHub Dark 主題決策）
- [x] 1.4 設定頁面主色系：`<body class="bg-gray-900 text-white">`（頁面色彩系統決策，深色主背景）；確認本機直接以瀏覽器開啟 `docs/index.html` 顯示深色背景

## 2. Hero 區塊（hero-section）

- [x] 2.1 實作 `Hero section displays project name, tagline, and feature highlights`：在 `<main>` 加入 `<section>` Hero 區塊；`<h1>` 顯示 "Shop Watcher"，desktop font-size 至少 `text-5xl`（≥3rem）、mobile `text-3xl`（≥1.875rem）（`Project name is prominently displayed`）
- [x] 2.2 在 `<h1>` 下方加入 `<p>` 副標題，說明監控電商平台並透過 Discord 通知新商品（`Tagline communicates the core value proposition`）
- [x] 2.3 實作功能標籤列（至少 4 個）：蝦皮 Shopee（背景 `#EE4D2D`）、露天拍賣 Ruten（背景 `#0066CC`）、Discord 即時通知（中性背景）、關鍵字監控（中性背景）；使用 `flex flex-wrap` 確保 mobile 換行無水平溢出（`Feature highlight tags are displayed in a row`、`Feature tags SHALL wrap to multiple lines without horizontal overflow`）
- [x] 2.4 加入 CTA 按鈕「開始使用」，`href="#installation"`，點擊時 `scroll-behavior: smooth`（`Hero section CTA button links to installation guide`）

## 3. 功能介紹區塊（feature-section）

- [x] 3.1 實作 `Feature section displays three capability cards`：加入 `<section>` 功能介紹區塊；`<h2>` 標題文字 "核心功能"（`Feature section has a visible section heading`）
- [x] 3.2 建立 3 欄響應式 grid（`grid grid-cols-1 md:grid-cols-3 gap-6`）：螢幕寬 ≥768px 時 3 欄並排、<768px 時單欄堆疊（`Feature grid is responsive`）
- [x] 3.3 實作 3 張功能卡片（`Each card contains an icon, title, and description`），標題依序為：
  - 多平台監控 — 同時監控蝦皮與露天拍賣
  - Discord 即時通知 — 發現新商品立即 Ping 指定用戶（描述 SHALL 提及不同關鍵字可 mention 不同 `discord_user_id`）
  - 靈活設定 — 關鍵字、價格範圍、掃描間隔自由配置
- [x] 3.4 每張卡片加入 SVG icon 或 emoji、bold 標題、2–3 句描述（`Three feature cards are rendered`）

## 4. 安裝教學區塊（installation-guide）

- [x] 4.1 加入 `<section id="installation">` 區塊，`<h2>` 文字 "快速上手"（`Installation guide section displays numbered setup steps`、`Installation section has a visible section heading with anchor`）
- [x] 4.2 實作 4 個編號步驟（`Four numbered steps are displayed in order`）：
  1. 安裝依賴 — `pip install -r requirements.txt`（`<pre><code class="language-bash">`）
  2. 安裝 Playwright — `playwright install --with-deps chromium`
  3. 設定環境變數 — 複製 `.env.example` 為 `.env`，填入 `WORKER_SECRET` 與 `NEXT_PUBLIC_API_URL`
  4. 啟動 Worker — `python main.py`
- [x] 4.3 確認 highlight.js 對所有 `language-bash` 區塊套用 `github-dark` 主題語法高亮（`Installation guide displays syntax-highlighted code blocks`、`Shell commands are syntax highlighted`）
- [x] 4.4 建立環境變數參考表格（`Installation guide includes environment variable reference table`、`Environment variable table lists all Worker variables`）：3 欄（變數名 monospace、是否必填、說明），含 `WORKER_SECRET`、`NEXT_PUBLIC_API_URL`、`CHECK_INTERVAL`
- [x] 4.5 加入 Docker 部署區段（`Installation guide includes Docker deployment instructions`、`Docker run command is shown with syntax highlighting`）：`<pre><code class="language-bash">` 顯示 `docker build` + `docker run -e WORKER_SECRET=... -e NEXT_PUBLIC_API_URL=...` 指令（使用 `mcr.microsoft.com/playwright/python` 映像）
- [x] 4.6 加入 Fly.io 部署區段（`Installation guide includes Fly.io cloud deployment instructions`、`Fly.io deployment steps are shown in order`）：code block 依序顯示 `fly launch`、`fly secrets set WORKER_SECRET=... NEXT_PUBLIC_API_URL=...`、`fly deploy`；加入說明 Worker 為無狀態（無需 persistent volume）

## 5. GitHub Pages 部署設定（github-pages-deployment）

- [x] 5.1 建立 `.github/workflows/pages.yml`（`GitHub Actions workflow automatically deploys docs/ to GitHub Pages on push to main`）：`on: push: branches: [main]`；使用 `actions/configure-pages`、`actions/upload-pages-artifact`（path: `docs`）、`actions/deploy-pages`；確認只在 `main` push 觸發（`Workflow does not run on pushes to other branches`）
- [x] 5.2 確認 `docs/index.html` 所有外部資源均使用 CDN 絕對 URL，無本地資源連結（`docs/index.html uses only relative paths for assets`、`Page renders correctly when repo is renamed`）
- [ ] 5.3 在 GitHub repo Settings → Pages 設定 Source 為 `main` branch, `/docs` folder（GitHub Pages 部署來源設為 `/docs` 資料夾決策；`GitHub Pages source is configured to serve from the /docs folder on main branch`、`No gh-pages branch is required`）
- [ ] 5.4 推送一次 commit 至 `main`，確認 GitHub Actions workflow 成功完成（綠色 checkmark），並在 2 分鐘內於 `https://{user}.github.io/{repo}/` 看到頁面（`GitHub Pages deployment completes within 2 minutes of a push to main`）
