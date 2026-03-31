## Context

Shop Watcher 目前只有 README 作為使用說明，缺乏視覺化的介紹頁面。新使用者需要一個可直接瀏覽的網站，清楚說明安裝方式與設定細節，同時作為專案的公開門面。

限制條件：
- 不需要後端服務（純靜態）
- 不需要 Node.js build 環境（使用者 clone 後能直接開啟 HTML）
- 與主 repo 同倉庫部署，不另建倉庫
- 免費部署（GitHub Pages）

## Goals / Non-Goals

**Goals:**
- 單一 `docs/index.html` 包含完整頁面內容（無分頁）
- Tailwind CSS v3 CDN + highlight.js v11 CDN（零 build step）
- 響應式設計（mobile 320px 至 desktop 1280px+）
- GitHub Pages 自動部署（push to main → pages 更新）
- 繁體中文介面

**Non-Goals:**
- 不實作多語系（i18n）切換
- 不實作搜尋功能
- 不動態載入 config.yaml 內容（欄位說明為靜態 HTML）
- 不加入 Google Analytics 或其他追蹤腳本
- 不實作深色模式切換按鈕（使用 Tailwind `dark:` class 配合系統偏好即可）

## Decisions

### 單一 HTML 檔案（不使用靜態網站產生器）

**決策**：所有內容寫入單一 `docs/index.html`，不使用 Astro / Hugo / Docusaurus 等靜態網站產生器。

**理由**：
- 零建置依賴，clone 後直接在瀏覽器開啟即可預覽
- 不需維護 `node_modules` 或 Python 虛擬環境
- 頁面內容量不大（單頁），不需要多頁面架構
- Tailwind CDN 在開發與生產環境完全一致

**替代方案考慮**：
- Astro → 需要 Node.js build，增加 CI 複雜度
- MkDocs → 適合文件網站，Hero 區塊客製化困難
- VitePress → 也需要 Node.js build

### Tailwind CSS v3 via CDN Play CDN（`@tailwindcss/browser`）

**決策**：使用 Tailwind CSS v3 的 Play CDN（`<script src="https://cdn.tailwindcss.com">`）在瀏覽器端動態編譯 class。

**理由**：
- 無需本地安裝，HTML 檔案即可獨立運作
- Play CDN 支援所有 Tailwind utility class，無 purge 問題
- 適合靜態展示頁面，效能需求不高（首次載入約 +100ms）

**替代方案考慮**：
- 預先編譯的 tailwind.min.css（完整版 ~3MB）→ 拒絕，過大
- 手動 CSS → 拒絕，維護成本高

### highlight.js v11 via CDN + GitHub Dark 主題

**決策**：使用 `cdnjs.cloudflare.com` 的 highlight.js v11，程式碼主題選用 `github-dark`，呼叫 `hljs.highlightAll()` 自動處理所有 `<pre><code>` 區塊。

**理由**：
- 支援 YAML / Bash / Shell 語法，剛好對應 config.yaml 與安裝指令
- GitHub Dark 主題視覺上與技術文件一致，且與 Tailwind 深色背景搭配良好
- CDN 載入速度快，Cloudflare CDN 全球覆蓋

### GitHub Pages 部署來源設為 `/docs` 資料夾

**決策**：GitHub Pages 設定來源為 `main` branch 的 `/docs` 資料夾，不使用獨立的 `gh-pages` branch。

**理由**：
- 不需要額外 branch 管理
- `docs/` 資料夾與主程式碼同一 commit，版本同步
- GitHub Actions workflow（`pages.yml`）在 push to main 時自動觸發 Pages 重新部署

**替代方案考慮**：`gh-pages` branch → 需要額外 push 步驟，不直觀

### 頁面色彩系統

**決策**：以深色（`bg-gray-900`）為主背景，搭配蝦皮橘（`#EE4D2D`）與露天藍（`#0066CC`）作為品牌強調色，白色文字。

**理由**：
- 呼應 Discord 與 shop-watcher 的深色通知設計
- 蝦皮橘 / 露天藍直接對應 Discord Embed 顏色，視覺一致

## Risks / Trade-offs

- **[Risk] Tailwind Play CDN 在慢速網路下延遲** → 可接受，Landing Page 非核心產品，載入 200ms 誤差不影響使用
- **[Risk] highlight.js CDN 無法存取** → 降級為純文字 `<pre>` 區塊，功能不受影響
- **[Risk] GitHub Pages URL 路徑異動**（repo 改名）→ 頁面內連結使用相對路徑，不寫死絕對 URL
- **[Risk] Tailwind Play CDN 在生產環境效能**（JIT 每次重新掃描 class）→ 可接受，頁面 class 總量少，掃描時間 < 50ms

## Migration Plan

1. 建立 `docs/index.html`（本機直接開啟瀏覽器預覽）
2. 建立 `.github/workflows/pages.yml`（push to main 自動部署）
3. GitHub repo Settings → Pages → Source: `main` branch, `/docs` folder → Save
4. 推送 commit → 等待約 1 分鐘 → 確認 `https://{user}.github.io/{repo}/` 正常顯示
