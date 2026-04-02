## Context

Dashboard 目前的渲染流程：`DashboardLayout` 呼叫 `auth()` 一次（用於導向未登入者），`DashboardPage` 再呼叫 `auth()` 一次（取 `userId` 執行 DB query）。兩次 `auth()` 是相互獨立的 async 函式呼叫，在同一 request 中沒有共享快取，造成雙重 IO 阻塞。

三個 DB query（keywords、notificationSetting、scanLog）以 `Promise.all` 並行，但 `DashboardPage` 本身是 async Server Component，在所有 query 完成前不會回傳任何 HTML，使用者會看到空白等待。

`KeywordList` 與 `KeywordFormWrapper` 的 state 是分離的：新增成功後只能 `router.refresh()` 觸發整頁重刷，重新執行所有 Server Component query，再 hydrate 整顆 Client Component 樹。

`NotificationForm` 每次 mount 都執行 `fetch('/api/settings')`，沒有任何快取策略，用戶在 Settings 頁快速進出時會反覆發送 API 請求。

## Goals / Non-Goals

**Goals:**

- 消除 `auth()` 的雙重呼叫，減少一次 IO round-trip
- 以 Suspense boundary 讓 Dashboard 分段串流渲染，先渲染靜態殼，再非同步填入各區塊
- 關鍵字的新增、啟用切換、刪除操作採 Optimistic UI：UI 先行更新，API 回應後確認或回滾
- 新增關鍵字後不再觸發整頁 `router.refresh()`，改為將新關鍵字 merge 進 `KeywordList` 的 local state
- `NotificationForm` 在 React module 層級快取第一次 fetch 結果，同一 session 內再訪問設定頁不重新 fetch
- 加入 `useTransition` 處理 pending 狀態，讓按鈕顯示 loading 時不阻塞 UI 互動

**Non-Goals:**

- 不引入 SWR、React Query、Zustand 等第三方狀態管理或資料層
- 不修改 API routes 或資料庫 schema
- 不處理 Worker 端效能
- 不實作 Service Worker 或 HTTP cache header 調整

## Decisions

### 移除 DashboardPage 中的 auth() 重複呼叫

`DashboardPage` 依賴 layout 已保護路由（未登入者在 layout 層即被 redirect），因此 page 層不需要再次呼叫 `auth()` 做登入檢查。

取得 `userId` 的方式改為使用 NextAuth v5 提供的 `auth()` 但僅在 layout 傳遞 session 給子頁，或直接在 page 呼叫 `auth()` 一次（layout 與 page 的 `auth()` 在 Next.js 15 + NextAuth v5 中各自是獨立請求，無法共用）。

**實際決策**：保留 `DashboardPage` 中的單一 `auth()` 呼叫（因為 page 需要 `userId` 執行 DB query），**移除 `layout.tsx` 中的 `auth()` 呼叫**，改由 middleware 或 NextAuth 的 `auth` middleware 負責路由保護，這樣整條 dashboard request 只剩 page 層的一次 `auth()`。

若無 middleware 設定，layout 的 `auth()` 也可保留作為 redirect guard，但 page 層的 `auth()` 須改為接受 layout 透過 props 傳入的 session，以避免重複呼叫。由於 App Router layout 無法直接傳 props 給 children page，最簡單的做法是確認是否可依賴 NextAuth v5 的內建 session cache（同一 request 內多次 `auth()` 是否共用快取）。

**最終決策**：NextAuth v5 的 `auth()` 在同一 request 內會命中 session cache，因此雙重呼叫的實際 IO 成本接近零。但為了代碼清晰度，`DashboardPage` 移除冗餘的登入 redirect 判斷（redirect guard 已在 layout 完成），只保留取 `userId` 的部分，移除 `if (!session?.user?.id) redirect('/login')` 這行防禦性重複判斷。

### Dashboard Suspense Boundary 設計

將 `DashboardPage` 拆成多個 async 子元件，各自負責一個 DB query，並以 `<Suspense fallback={<Skeleton/>}>` 包裹：

- `<ScanLogSection>` — 查詢 `scanLog`，渲染「上次掃描」標籤
- `<KeywordSection>` — 查詢 `keywords`，渲染 `KeywordList` + `KeywordFormWrapper`
- `<NotificationStatus>` — 查詢 `notificationSetting`，渲染 `NotificationBanner`

`DashboardPage` 本身改為同步元件，只負責佈局與 Suspense 殼，讓 HTML 立即回傳，各區塊異步填入。

**替代方案考量**：繼續用單一 async page + `loading.tsx`，但這只能做整頁 loading，無法分段。Suspense 子元件方案可讓關鍵字列表與掃描統計互不阻塞，體驗更好。

### Optimistic UI 架構：提升 KeywordList state 至 KeywordSection

目前 `KeywordFormWrapper`（新增）與 `KeywordList`（顯示/操作）的狀態是分離的，新增後只能靠 `router.refresh()` 橋接。

重構後：
1. `KeywordSection`（新 Server Component）負責查詢關鍵字並傳入初始列表
2. `KeywordClientSection`（新 Client Component）持有 `keywords` state，同時渲染 `KeywordForm` 與 `KeywordList`
3. `KeywordForm` 的 `onSuccess` 回傳完整的新關鍵字物件（從 API response 取得），由 `KeywordClientSection` 直接 `setState` append
4. `KeywordList` 的啟用切換與刪除操作改用 `useOptimistic` 實作：操作觸發時先 optimistic 更新 UI，等 API 回應後若失敗則 revert

`useTransition` 用於包裹 API 呼叫，讓 `isPending` 控制按鈕 disabled 狀態，但不會阻塞 optimistic UI 的即時顯示。

### NotificationForm 快取策略

使用 module-level 變數（React module singleton）儲存第一次 fetch 的結果：

```
let cachedSettings: NotificationSettings | null = null
```

元件 mount 時若 `cachedSettings !== null` 則跳過 fetch，直接用快取值初始化 form state。儲存成功後更新 `cachedSettings`，確保快取與後端同步。

**為何不用 SWR/React Query**：專案明確列為 Non-Goal，避免引入非必要依賴。module singleton 方案在單用戶 SaaS 場景（每個 tab 獨立 session）下足夠，且實現簡單。

**風險**：同一 browser session 開多個 tab 時，一個 tab 儲存設定不會反映到另一個 tab 的快取。考量到設定頁非高頻操作，此風險可接受。

## Risks / Trade-offs

- **Optimistic UI revert**：toggle active 操作若 API 失敗，UI 需要回滾，使用者會感知到一次閃爍。需確保錯誤處理的 revert 邏輯正確。→ `useOptimistic` 在 transition 結束後自動回到 actual state，天然解決 revert 問題。
- **Suspense 骨架**：各區塊需要設計 Skeleton fallback，否則 Suspense 期間出現空白區塊，體驗比 waterfall 更差。→ 每個 Suspense fallback 使用簡單的灰色骨架線條即可。
- **KeywordSection 重構範圍大**：需新增 `KeywordSection.tsx`（Server）與 `KeywordClientSection.tsx`（Client）兩個元件，並調整 `KeywordFormWrapper` 的職責。變更檔案數較多，需注意 import 路徑正確性。
- **module singleton 快取生命週期**：Next.js 在 development 模式下 HMR 會重置 module 狀態，快取失效屬於預期行為。Production 模式下 module 存活於整個頁面生命週期，無額外問題。

## Migration Plan

1. 修改 `dashboard/layout.tsx`（移除 redirect guard，保留 header 用的 session 資料）
2. 修改 `dashboard/page.tsx`（改為同步殼 + Suspense，抽出 async 子元件）
3. 新增 `components/KeywordSection.tsx`（Server Component，查詢 keywords）
4. 新增 `components/KeywordClientSection.tsx`（Client Component，持有 state + optimistic）
5. 修改 `components/KeywordList.tsx`（接受 onAdd/onToggle/onDelete callbacks，加入 useOptimistic）
6. 修改 `components/KeywordFormWrapper.tsx`（移除 router，改接受 onAdd callback）
7. 修改 `components/NotificationForm.tsx`（加入 module-level cache）

無資料庫 migration，無 API 變更，可直接部署。Rollback 只需 revert commit。
