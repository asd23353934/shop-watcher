## 1. 移除 DashboardLayout 中的 auth() 重複呼叫

- [ ] 1.1 在 `webapp/app/dashboard/layout.tsx` 中，移除 `auth()` 呼叫與 `if (!session?.user) redirect('/login')` 判斷，改由 NextAuth middleware 或 DashboardPage 負責路由保護；確認 header 顯示的 `session.user.name` 與 `session.user.image` 改由 props 或直接在 page 層傳入，或保留 layout 的 `auth()` 但移除 DashboardPage 中多餘的 redirect 判斷（依「移除 DashboardPage 中的 auth() 重複呼叫」設計決策執行）

## 2. Dashboard Suspense Boundary 設計

- [ ] 2.1 將 `webapp/app/dashboard/page.tsx` 改為同步 Server Component，移除 `Promise.all` 與 `await auth()`，改為只負責佈局殼與 `<Suspense>` 包裹；保留 `session` 取得（單一 `auth()` 呼叫）用於 `NotificationStatus` 子元件
- [ ] 2.2 新增 `webapp/components/ScanLogSection.tsx`（async Server Component），查詢 `prisma.scanLog.findUnique({ where: { id: 'global' } })`，渲染「上次掃描：{lastScanLabel}」標籤；搭配 Skeleton fallback（一個灰色佔位條）包在 `<Suspense>` 中
- [ ] 2.3 新增 `webapp/components/KeywordSection.tsx`（async Server Component），查詢 `prisma.keyword.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })`，將結果傳入新的 `KeywordClientSection` 元件；搭配 Skeleton fallback（三個灰色卡片佔位）包在 `<Suspense>` 中
- [ ] 2.4 新增 `webapp/components/NotificationStatus.tsx`（async Server Component），查詢 `prisma.notificationSetting.findUnique({ where: { userId } })`，依結果渲染 `<NotificationBanner>` 或不渲染；搭配 Skeleton fallback 包在 `<Suspense>` 中
- [ ] 2.5 確認 `dashboard/page.tsx` 最終只包含同步佈局程式碼（標題文字、grid 結構、Suspense 殼），無任何 DB query

## 3. Optimistic UI 架構：提升 KeywordList state 至 KeywordSection

- [ ] 3.1 新增 `webapp/components/KeywordClientSection.tsx`（`'use client'` Client Component），以 `useState<Keyword[]>(initialKeywords)` 持有關鍵字列表狀態；同時渲染 `<KeywordForm>` 與 `<KeywordList>`，並將 `onAdd`、`onToggle`、`onDelete` 回呼函式傳入子元件
- [ ] 3.2 修改 `webapp/components/KeywordList.tsx`，接受 `onOptimisticToggle: (id: string, newActive: boolean) => void` 與 `onOptimisticDelete: (id: string) => void` 回呼；使用 `useOptimistic` hook 實作「User can toggle a keyword's active status」的即時 UI 更新：呼叫回呼時先 optimistic 更新，API 失敗時 revert；同樣對「Authenticated user can delete a keyword」採用 optimistic delete
- [ ] 3.3 在 `KeywordList.tsx` 的 `handleToggleActive` 中加入錯誤處理：若 API 回應非 2xx，呼叫 `onOptimisticToggle` 回滾（傳回原始 `kw.active`），並以 `alert` 或 inline error 顯示錯誤訊息，以滿足「Toggle fails and UI reverts」場景
- [ ] 3.4 在 `KeywordList.tsx` 的 `handleDelete` 中加入錯誤處理：若 API 回應非 2xx，呼叫 `onOptimisticDelete` 回滾（將關鍵字加回列表），並顯示錯誤訊息，以滿足「Deletion fails and keyword reappears」場景
- [ ] 3.5 在 `KeywordList.tsx` 的 toggle 與 delete 操作中加入 `useTransition`，讓 `isPending` 控制按鈕 disabled 狀態；pending 時按鈕顯示半透明但 optimistic UI 已先反映

## 4. 新增關鍵字後改為局部 state 更新

- [ ] 4.1 修改 `webapp/components/KeywordForm.tsx`（或其 `handleSubmit`），在 API 回應成功時，從 `await res.json()` 取得完整新關鍵字物件，並透過 `onSuccess(newKeyword: Keyword)` 回呼傳出（將 `onSuccess?: () => void` 改為 `onSuccess?: (keyword: Keyword) => void`）
- [ ] 4.2 修改 `webapp/components/KeywordFormWrapper.tsx`，移除 `useRouter` 與 `router.refresh()` 呼叫；改為接受 `onAdd: (keyword: Keyword) => void` prop 並轉傳給 `<KeywordForm onSuccess={onAdd}>`，以滿足「Authenticated user can create a keyword」的「no full page reload or router.refresh() SHALL occur」場景
- [ ] 4.3 在 `KeywordClientSection.tsx` 的 `onAdd` handler 中，呼叫 `setKeywords(prev => [newKeyword, ...prev])` 將新關鍵字插入列表最前方（符合 `orderBy: { createdAt: 'desc' }` 排序）

## 5. NotificationForm 快取策略

- [ ] 5.1 在 `webapp/components/NotificationForm.tsx` 的 module scope 新增 `let cachedSettings: NotificationSettings | null = null`；在 `useEffect` 的 fetch 邏輯中，若 `cachedSettings !== null` 則直接 `setForm(cachedSettings)` 並 `setLoading(false)` 跳過 API 呼叫，以滿足「Settings are pre-filled from cache on subsequent loads within same session」場景
- [ ] 5.2 在 `handleSubmit` 成功後，更新 `cachedSettings` 為當前表單值（`cachedSettings = { ...form }`），以滿足「Cache is updated after successful save」場景
- [ ] 5.3 確認初次進入設定頁仍正確執行 `fetch('/api/settings')` 並預填欄位，以滿足「Settings are pre-filled with existing values on first load」與「Settings are pre-filled with existing values on load」場景
- [ ] 5.4 確認「Notification settings are isolated per user」的行為不受快取機制破壞：快取鍵不跨使用者共享（module singleton 在 SPA session 內屬於單一使用者），若偵測到登出後重新登入（session 變更），`cachedSettings` 須重設為 `null`

## 6. 驗收測試

- [ ] 6.1 手動測試：進入 Dashboard，確認頁面殼（標題 + grid 框架）先出現，關鍵字列表與掃描時間各自非同步填入，符合 Suspense boundary 設計決策預期
- [ ] 6.2 手動測試：新增關鍵字後，確認新關鍵字立即出現在列表最前方，且瀏覽器 Network tab 無整頁重刷（無 document 類型的新請求）
- [ ] 6.3 手動測試：切換關鍵字啟用/停用，確認開關立即翻轉（optimistic），等待 API 回應期間按鈕顯示 pending 狀態
- [ ] 6.4 手動測試：進入設定頁，完成儲存後離開再回來，確認 Network tab 無新的 `GET /api/settings` 請求，且欄位顯示上次儲存的值
- [ ] 6.5 執行 `cd webapp && npm run build`，確認無 TypeScript 編譯錯誤與 Next.js build 錯誤
