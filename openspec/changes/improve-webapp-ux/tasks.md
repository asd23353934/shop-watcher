## 0. shadcn/ui 安裝與初始化（決策 0：引入 shadcn/ui 作為統一 UI 元件基礎）

- [ ] 0.1 在 `webapp/` 目錄執行 `npx shadcn@latest init`：選擇 Default style、slate base color、CSS variables: yes；確認 `tailwind.config.ts` 加入 shadcn/ui theme tokens 後，手動補回自訂色彩（`shopee: '#EE4D2D'`、`ruten: '#0066CC'`、`discord: '#5865F2'`）；確認 `webapp/app/globals.css` 加入 CSS variables（`--background`、`--foreground` 等）；確認 `webapp/lib/utils.ts` 建立（含 `cn()` helper）
- [ ] 0.2 執行以下指令安裝所需 shadcn/ui 元件：`npx shadcn@latest add sonner skeleton badge button switch`；確認以下檔案存在：`webapp/components/ui/sonner.tsx`、`webapp/components/ui/skeleton.tsx`、`webapp/components/ui/badge.tsx`、`webapp/components/ui/button.tsx`、`webapp/components/ui/switch.tsx`

## 1. Toast 通知系統（決策 1：Toast 使用 shadcn/ui Sonner，以 `toast()` 函式觸發）

- [ ] 1.1 確認 `webapp/components/ui/sonner.tsx` 存在（由 0.2 安裝）；不需要自行建立 ToastContext 或 useReducer（滿足：Global Toast notification system displays operation feedback）
- [ ] 1.2 修改 `webapp/app/layout.tsx`：從 `webapp/components/ui/sonner.tsx` 引入 `<Toaster>`，加入 `<Toaster position="bottom-right" richColors />` 至 `{children}` 之後，使所有子頁面可透過 `import { toast } from 'sonner'` 觸發 Toast（滿足：ToastProvider is mounted at root layout level）

## 2. Loading Skeleton 元件（決策 2：Skeleton 使用 shadcn/ui Skeleton，組合出 SkeletonCard / SkeletonRow）

- [ ] 2.1 建立 `webapp/components/ui/SkeletonCard.tsx`：從 `@/components/ui/skeleton` 引入 `Skeleton`；export `SkeletonCard({ count = 2 }: { count?: number })`，渲染 `<div className="grid grid-cols-2 gap-4">` 內含 `count` 個 `<Skeleton className="h-24 w-full rounded-xl" />`；export `SkeletonRow({ count = 4 }: { count?: number })`，渲染 `<div className="flex flex-col gap-3">` 內含 `count` 個 `<Skeleton className="h-16 w-full rounded-lg" />`（滿足：Dashboard displays Skeleton placeholders during data loading、Keyword list displays Skeleton rows during refresh）

## 3. Empty State 元件

- [ ] 3.1 建立 `webapp/components/EmptyState.tsx`：接受 props `heading: string`、`subtitle: string`、`icon?: React.ReactNode`；預設 icon 為望遠鏡/搜尋 SVG（`<svg ... className="w-12 h-12 text-gray-300">`）；以 `flex flex-col items-center justify-center py-16 text-center gap-3` 排版；heading 用 `text-lg font-semibold text-gray-700`；subtitle 用 `text-sm text-gray-400`（滿足：Empty keyword list displays a guided Empty State、Empty notification history displays a guided Empty State）

## 4. 關鍵字卡片重設計（決策 3：關鍵字卡片以單一元件 `KeywordCard` 重構，Badge / Switch / Button 使用 shadcn/ui）

- [ ] 4.1 建立 `webapp/components/KeywordCard.tsx`：引入 `Badge` from `@/components/ui/badge`、`Switch` from `@/components/ui/switch`、`Button` from `@/components/ui/button`；接受 props `keyword` 資料物件（含 `id`, `keyword`, `platform`, `minPrice`, `maxPrice`, `active`）與 `onEdit`、`onDelete`、`onToggle` callback；卡片顯示：關鍵字文字（`font-semibold`）、平台 `<Badge variant="outline">` （蝦皮：`className="text-orange-700 border-orange-300"`；露天：`className="text-blue-700 border-blue-300"`）、價格區間（`minPrice`/`maxPrice` 非 null 時顯示 `NT$ {min} – {max}`，僅 min 顯示 `NT$ {min} 以上`，僅 max 顯示 `NT$ {max} 以下`）、`<Switch checked={keyword.active} onCheckedChange={onToggle} />`、編輯與刪除 `<Button variant="ghost" size="icon">` 各自含 SVG icon（滿足：Keyword card displays platform badge, price range, toggle state, and last scan time）
- [ ] 4.2 修改 `webapp/components/KeywordList.tsx`：移除迴圈內的內聯卡片 JSX，改用 `<KeywordCard>`；在 `isLoading === true` 時渲染 `<SkeletonRow count={Math.max(keywords.length, 3)} />`；在 `isLoading === false && keywords.length === 0` 時渲染 `<EmptyState heading="尚無監控關鍵字" subtitle="新增你的第一個監控關鍵字，開始接收商品通知" />`；在 `isLoading === false && keywords.length > 0` 時渲染 `<KeywordCard>` 列表（滿足：Empty keyword list displays a guided Empty State、Keyword list displays Skeleton rows during refresh）

## 5. KeywordForm Toast 整合（取代 inline 成功/失敗文字）

- [ ] 5.1 修改 `webapp/components/KeywordForm.tsx`：加入 `import { toast } from 'sonner'`；新增關鍵字成功後呼叫 `toast.success('關鍵字已新增')`，失敗呼叫 `toast.error(errorMessage)`；移除現有 inline `<p className="text-green-600">` 與 `<p className="text-red-600">` 成功/失敗文字（滿足：Authenticated user can create a keyword — User creates a keyword with required fields、Keyword creation with empty keyword string is rejected）
- [ ] 5.2 修改 `webapp/components/KeywordCard.tsx` 的 `onEdit`/`onDelete` handler：更新成功後呼叫 `toast.success('關鍵字已更新')`，刪除成功後呼叫 `toast.success('關鍵字已刪除')`，失敗時呼叫 `toast.error(errorMessage)`；移除相應 inline 狀態文字（滿足：Authenticated user can edit an existing keyword、Authenticated user can delete a keyword）

## 6. Dashboard 統計區塊（決策 5：Dashboard 統計數字由現有 API 資料衍生，不新增 endpoint）

- [ ] 6.1 修改 `webapp/app/dashboard/page.tsx`：新增獨立統計 loading state；keywords 與 history 資料載入期間於統計區塊渲染 `<SkeletonCard count={2} />`；資料載入完成後顯示 2 個統計卡片：「監控關鍵字」（keywords 陣列長度）與「今日通知」（從 `/api/history` 篩選 `createdAt` 為今日 UTC+8 的筆數）；統計卡片以 `grid grid-cols-2 gap-4` 排版，各含 `text-3xl font-bold` 數字與 `text-sm text-gray-500` 標籤（滿足：Dashboard displays statistics summary block）
- [ ] 6.2 修改 `webapp/app/dashboard/page.tsx`：加入頁面標題 `<h1>監控儀表板</h1>` 與說明文字 `管理你的關鍵字，即時掌握新品上架`；以 `<section>` 分隔統計、新增關鍵字、關鍵字列表三個區塊，各 section 間加入 `<hr className="border-gray-100">` 分隔線

## 7. Navbar 行動裝置 Hamburger Menu（決策 4：Navbar hamburger menu 以 `useState` 控制展開/收合）

- [ ] 7.1 修改 `webapp/components/Navbar.tsx`（或對應 layout 元件）：新增 `isOpen` state（`useState(false)`）；在 `md:hidden` 區域加入 hamburger `<Button variant="ghost" size="icon">`（`isOpen` 為 false 時顯示三條線 SVG，true 時顯示 X SVG）；展開時於 Navbar 下方以 `absolute top-full left-0 w-full bg-white shadow-md flex flex-col py-2` 顯示導覽項目（Dashboard、History、Settings、登出）；每個項目點擊後呼叫 `setIsOpen(false)`；`md:flex` 區域保留原有水平導覽列（滿足：Navbar includes hamburger menu for mobile navigation）

## 8. 通知歷史 Empty State 整合

- [ ] 8.1 修改 `webapp/app/history/page.tsx`：在 `isLoading === false && items.length === 0` 時渲染 `<EmptyState heading="尚無通知紀錄" subtitle="當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡" />`；移除現有純文字空狀態訊息；確認有資料時仍正確渲染 SeenItem 行（keyword、platform label、item ID、firstSeen timestamp），排序為 firstSeen 降冪（滿足：Empty notification history displays a guided Empty State、User can view notification history）
