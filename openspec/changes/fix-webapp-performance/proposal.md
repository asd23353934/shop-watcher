## Why

webapp 目前存在多個效能瓶頸：重複的 `auth()` 呼叫、缺乏 Suspense boundary 導致頁面全量阻塞、表單操作沒有 Optimistic UI 造成明顯的送出延遲感。這些問題直接影響使用者的操作體驗，應立即修復。

## What Changes

- 移除 `dashboard/layout.tsx` 中多餘的 `auth()` 呼叫，讓 session 僅在 page 層取得一次
- 在 `dashboard/page.tsx` 加入 Suspense boundary，讓掃描統計、關鍵字列表、通知歷史各自獨立串流渲染
- `KeywordList` 與 `KeywordFormWrapper` 改用 `useOptimistic` + `useTransition`，新增、切換啟用/停用、刪除關鍵字時 UI 立即反應
- `KeywordFormWrapper` 移除 `router.refresh()`，改為局部 state 更新避免重新執行所有 DB query
- `NotificationForm` 加入簡易快取（`useRef` 儲存上次 fetch 結果），避免每次進入頁面重複拉取設定資料

## Non-Goals

- 不引入 SWR、React Query 等第三方資料層套件
- 不修改後端 API 路由或資料庫 schema
- 不處理 Worker 端效能問題
- 不實作 Service Worker 或離線快取

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `keyword-management`：關鍵字的新增、切換啟用、刪除操作加入 Optimistic UI，使用者操作立即反映於畫面，不再等待 API 回應完成
- `notification-settings`：設定頁面的資料載入加入快取機制，避免每次進入頁面重新 fetch

## Impact

- Affected specs: `keyword-management`、`notification-settings`
- Affected code:
  - `webapp/app/dashboard/layout.tsx`
  - `webapp/app/dashboard/page.tsx`
  - `webapp/components/KeywordFormWrapper.tsx`
  - `webapp/components/KeywordForm.tsx`
  - `webapp/components/KeywordList.tsx`
  - `webapp/components/NotificationForm.tsx`
