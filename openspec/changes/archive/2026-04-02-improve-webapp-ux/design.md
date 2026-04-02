## Context

Shop Watcher webapp 以 Next.js 15 App Router + Tailwind CSS 建構，目前所有頁面元件皆為 Client Components（`"use client"`）。互動狀態（loading、error、success）由各元件自行以 `useState` 管理，並以 inline JSX 文字顯示結果。Navbar 為固定 HTML，無響應式展開/收合邏輯。現有元件路徑：`webapp/components/`，頁面路徑：`webapp/app/`。

本次異動橫跨 Dashboard、關鍵字管理、通知歷史、全域 Layout 四個區域，需要統一的 UI primitive（Toast、Skeleton）作為共用基礎。

## Goals / Non-Goals

**Goals:**

- 建立可重用的 `Toast`、`Skeleton`、`EmptyState` UI primitive
- 全域 ToastProvider 掛載於 `layout.tsx`，所有頁面可觸發 Toast
- Skeleton 覆蓋 Dashboard 統計區塊與關鍵字列表的非同步載入期間
- 關鍵字卡片重設計納入平台 badge、價格區間、toggle 狀態色彩、最後掃描時間
- Navbar hamburger menu 解決行動裝置導覽問題
- 以 shadcn/ui 作為統一 UI 元件基礎（Sonner、Skeleton、Badge、Button、Switch）

**Non-Goals:**

- 不修改任何 API route 或資料庫查詢
- 不引入 React Query / SWR 等資料層
- 不實作伺服器端 Streaming（RSC Suspense 邊界）
- 不處理無障礙（a11y）ARIA 標準以外的合規需求

## Decisions

### 決策 0：引入 shadcn/ui 作為統一 UI 元件基礎

**理由**：shadcn/ui 採「複製貼上」模式，元件程式碼直接進入 `webapp/components/ui/`，不增加 runtime bundle，且與現有 Tailwind CSS 完全相容。相較於自行實作 Toast、Skeleton、Badge、Switch，shadcn/ui 提供完整的 a11y、鍵盤導覽與動畫支援，節省 ~300 行重複程式碼。

**安裝步驟**（在 `webapp/` 目錄下執行）：
```bash
npx shadcn@latest init          # 選 Default style、slate color、CSS variables: yes
npx shadcn@latest add sonner    # Toast（Sonner）
npx shadcn@latest add skeleton  # Skeleton
npx shadcn@latest add badge     # 平台標籤
npx shadcn@latest add button    # Action buttons
npx shadcn@latest add switch    # 啟用/停用 toggle
```

`shadcn init` 自動修改 `tailwind.config.ts`（加入 CSS variable theme tokens）、`app/globals.css`（加入 `--background`、`--foreground` 等 CSS 變數）、建立 `lib/utils.ts`（`cn()` helper，合併 clsx + tailwind-merge）。

**替代方案**：Mantine / Chakra UI — 有自己的 CSS 系統，與 Tailwind 衝突，排除。

### 決策 1：Toast 使用 shadcn/ui Sonner，以 `toast()` 函式觸發

**理由**：Sonner 是 shadcn/ui 官方推薦的 Toast 方案，支援 promise toast、stack 堆疊、richColors，無需自行管理 Context 或計時器，API 極簡。

**使用方式**：
```ts
import { toast } from 'sonner'
toast.success('關鍵字已新增')
toast.error('新增失敗，請重試')
```

`<Toaster>` 元件掛載於 `webapp/app/layout.tsx`，props：`position="bottom-right" richColors`（滿足：ToastProvider is mounted at root layout level、Global Toast notification system displays operation feedback）

### 決策 2：Skeleton 使用 shadcn/ui Skeleton，組合出 SkeletonCard / SkeletonRow

**理由**：shadcn/ui `<Skeleton>` 元件提供 `animate-pulse` 基礎，由父層組合出語意化的 `SkeletonCard` / `SkeletonRow`，父元件在 `isLoading === true` 時渲染佔位，`isLoading === false` 時渲染真實內容。

**組合方式**：
```tsx
// SkeletonCard（統計區塊）
<div className="grid grid-cols-2 gap-4">
  {Array.from({ length: 2 }).map((_, i) => (
    <Skeleton key={i} className="h-24 w-full rounded-xl" />
  ))}
</div>
// SkeletonRow（關鍵字列表）
<div className="flex flex-col gap-3">
  {Array.from({ length: count }).map((_, i) => (
    <Skeleton key={i} className="h-16 w-full rounded-lg" />
  ))}
</div>
```

### 決策 3：關鍵字卡片以單一元件 `KeywordCard` 重構，Badge / Switch / Button 使用 shadcn/ui

**理由**：目前 `KeywordList.tsx` 在迴圈內直接渲染卡片 JSX，夾雜編輯狀態邏輯。拆出 `KeywordCard` 後職責清晰。元件內使用：
- `<Badge variant="outline">` — 平台標籤（蝦皮：`text-orange-700 border-orange-300`；露天：`text-blue-700 border-blue-300`）
- `<Switch checked={active} onCheckedChange={onToggle}>` — 啟用/停用（shadcn/ui 內建綠/灰動畫）
- `<Button variant="ghost" size="icon">` — 編輯、刪除按鈕（44×44px 點擊區域）

### 決策 4：Navbar hamburger menu 以 `useState` 控制展開/收合

**理由**：不引入動畫函式庫，以 `md:hidden` 控制 desktop/mobile 版面切換。hamburger icon 使用 SVG（三條線 ↔ X），展開時顯示垂直導覽列（`flex-col`），`absolute top-full left-0 w-full bg-white shadow-md`。點擊導覽項目後呼叫 `setIsOpen(false)` 自動收合。

### 決策 5：Dashboard 統計數字由現有 API 資料衍生，不新增 endpoint

**理由**：Dashboard 已呼叫 `/api/keywords` 取得關鍵字列表，陣列長度即「關鍵字數量」。「今日通知數」從 `/api/history`（最近 50 筆）篩選 `createdAt` 為今日 UTC+8 的筆數。無需新增 API endpoint。

## Risks / Trade-offs

- **shadcn/ui 修改 tailwind.config.ts / globals.css**：初始化時會覆寫部分設定，需確認既有自訂 Tailwind 色彩（如 `shopee`、`ruten`）不被清除 → 初始化後手動合併保留自訂 token。
- **Skeleton 高度預估**：Skeleton 高度為預估值，真實內容高度不同時會輕微版面跳動（CLS）→ 可接受的 trade-off。
- **Navbar 展開覆蓋內容**：mobile menu 以 `absolute` 定位覆蓋頁面 → 點擊導覽項目後自動收合。
- **統計數字延遲**：今日通知數依賴 `/api/history` 回傳 → 統計區塊獨立 loading state，不阻塞關鍵字列表渲染。
