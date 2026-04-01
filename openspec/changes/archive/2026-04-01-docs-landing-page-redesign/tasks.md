## 1. 視覺主題與基礎設定

- [x] 1.1 在 `docs/index.html` `<head>` 引入 Google Fonts（Inter + Noto Sans TC），並在 Tailwind config 設定 `fontFamily.sans`
- [x] 1.2 在 Tailwind config 新增自訂顏色：`darkbg (#0B0F19)`、`cardbg (#131B2F)`、`shopee (#EE4D2D)`、`ruten (#0066CC)`、`discord (#5865F2)`
- [x] 1.3 在 Tailwind config 新增 `fade-in-up` 與 `float` animation keyframes
- [x] 1.4 新增 `<style>` 自訂捲軸樣式（`::-webkit-scrollbar`）
- [x] 1.5 新增背景光暈裝飾元素（`.bg-glow` / `.bg-glow-right`，radial-gradient）

## 2. Navbar 重設計

- [x] 2.1 將 `<header>` 改為 `fixed` 定位，加入 `backdrop-blur-lg` 與 `border-b border-white/5`
- [x] 2.2 Logo 改為品牌圖示（indigo→purple 漸層方形）+ 文字組合
- [x] 2.3 「登入控制台」CTA 按鈕改為 3D 位移動畫效果（兩層 span 疊加實現）

## 3. Hero Section 重設計

- [x] 3.1 將 Hero 版面改為左文右圖兩欄 layout（`flex-col lg:flex-row`），實作 Hero section displays project name, tagline, and feature highlights 的響應式兩欄需求
- [x] 3.2 H1 標題部分文字套用 indigo-to-cyan 漸層色（`bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent`）
- [x] 3.3 新增「系統穩定監控中 v1.0」狀態 badge，實作 Hero section displays a system status badge 需求（含 `animate-ping` 指示燈）
- [x] 3.4 平台標籤（蝦皮 / 露天 / Discord）重設計為帶邊框的 badge，Discord 改用 SVG logo
- [x] 3.5 實作 Hero section right column displays a Discord notification mockup 需求：右欄加入 Discord 風格 Mockup 視窗，包含標題列（紅黃綠圓點 + 頻道名）、Bot 訊息、Shopee 風格 embed 區塊
- [x] 3.6 Mockup 容器套用 `animate-float` 動畫（`animation-delay: 0.2s`）

## 4. Features Section 重設計

- [x] 4.1 實作 Feature section displays three capability cards 需求：更新 section 標題為「為什麼選擇 Shop Watcher？」，更新三張 Card 標題與說明文字
- [x] 4.2 每張 Card 圖示區塊改為 SVG icon（搜尋、閃電、調整），各自對應 indigo / discord / cyan 色系
- [x] 4.3 實作 Feature cards respond to hover with visual feedback 需求：Card 加入 `hover:-translate-y-1`、`hover:border-indigo-500/50`、`hover:shadow-[0_10px_30px_rgba(99,102,241,0.1)]`
- [x] 4.4 每張 Card 右上角加入裝飾圓弧元素，hover 時 `scale-110`

## 5. How It Works Section 重設計

- [x] 5.1 步驟圓圈改為圓角方形（`rounded-2xl`），加入 indigo 邊框與光暈 shadow
- [x] 5.2 桌面版加入步驟連接線（絕對定位 `h-0.5 bg-gray-800`）
- [x] 5.3 底部加入 CTA 漸層卡片（`bg-gradient-to-b from-indigo-900/40 to-darkbg`）

## 6. Footer 重設計

- [x] 6.1 Footer 改為左右兩欄排版（`flex-col md:flex-row justify-between`）
- [x] 6.2 GitHub 連結加入 SVG 圖示

## 7. 驗收

- [x] 7.1 在桌面（1280px）與手機（375px）各自開啟 `docs/index.html` 確認版面無破版
- [x] 7.2 確認所有連結（登入控制台、免費開始使用、GitHub）指向正確 URL
- [x] 7.3 確認 `animate-ping`、`animate-float`、`animate-fade-in-up` 動畫正常運作
- [x] 7.4 確認 Discord Mockup embed 的左邊框顯示 Shopee 品牌色（`#EE4D2D`）
