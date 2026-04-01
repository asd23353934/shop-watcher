## Why

原版 Landing Page 視覺層次薄弱、缺乏品牌感，無法有效傳遞 SaaS 產品價值。以現代 SaaS Landing Page 標準全面翻新，提升第一印象與轉換率。

## What Changes

- **視覺主題**：深色背景從 `gray-900` 升級為品牌色 `darkbg (#0B0F19)` + `cardbg (#131B2F)`；加入背景光暈裝飾（radial-gradient glow）與自訂捲軸
- **字型**：引入 Google Fonts（Inter + Noto Sans TC），提升中英文排版品質
- **Navbar**：`sticky` → `fixed`，加入 `backdrop-blur-lg`；Logo 改為品牌圖示 + 文字組合；CTA 按鈕改為 3D 位移動畫效果
- **Hero Section**：從置中單欄改為左文右圖兩欄 layout（`lg` breakpoint）；新增「系統穩定監控中 v1.0」狀態 badge（含 ping 動畫）；H1 加入漸層色文字；右欄加入 Discord Mockup 視窗（含 float 動畫）；平台標籤依 shopee / ruten / discord 各自色系重設計
- **Features Section**：Card 加入 hover 上移 + 邊框發光效果；右上角加入色彩裝飾圓弧；圖示換為 SVG icon
- **How It Works Section**：步驟圓圈改為圓角方形；新增桌面版步驟連接線；底部新增 CTA 漸層卡片
- **Footer**：改為左右兩欄排版，加入 GitHub SVG 圖示

## Non-Goals

- 不新增任何新功能頁面或路由
- 不修改 webapp/ 任何程式碼
- 不更動 GitHub Actions 部署流程
- 不引入 JavaScript 框架（維持純 HTML + Tailwind CDN）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `hero-section`：新增兩欄 layout、狀態 badge、Discord Mockup 右欄視覺展示，及 float 動畫
- `feature-section`：Card hover 效果升級（上移 + 邊框發光 + 裝飾圓弧）、圖示改為 SVG

## Impact

- Affected specs: `hero-section`、`feature-section`
- Affected code: `docs/index.html`
