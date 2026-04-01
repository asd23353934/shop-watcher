## Context

Dashboard 目前的關鍵字管理流程存在三個問題：

1. **列表不刷新**：`KeywordForm` 提交後呼叫 `POST /api/keywords`，成功後沒有觸發 `KeywordList` 重新載入，用戶必須手動重整頁面才能看到新關鍵字。
2. **無重複防護**：`POST /api/keywords` 只檢查欄位是否為空，未檢查同一用戶是否已存在相同 keyword + platforms 組合，會在資料庫建立重複列。
3. **無通知設定引導**：用戶可以在未設定任何通知方式（Discord Webhook 或 Email）的情況下新增關鍵字，導致 Worker 掃描到商品後無法發出任何通知，用戶不知道為什麼沒收到通知。

相關檔案：
- `webapp/app/dashboard/page.tsx` — Server Component，初始 render 關鍵字列表
- `webapp/components/KeywordFormWrapper.tsx` — Client Component 包裝器
- `webapp/components/KeywordForm.tsx` — 新增關鍵字表單
- `webapp/components/KeywordList.tsx` — 關鍵字列表展示
- `webapp/app/api/keywords/route.ts` — POST 建立 / GET 取得關鍵字
- `webapp/prisma/schema.prisma` — Keyword model 定義

## Goals / Non-Goals

**Goals:**
- 新增關鍵字後列表即時顯示新項目，無需重整頁面
- 同一用戶建立重複關鍵字時，API 回傳 409 並顯示明確提示
- 用戶在未設定通知方式時，新增關鍵字表單顯示警示 Banner 引導至設定頁

**Non-Goals:**
- 不實作全域關鍵字黑名單或禁詞功能
- 不改動 Worker 掃描行為
- 不修改關鍵字價格區間或平台選擇邏輯
- 不強制阻擋未設定通知的用戶新增關鍵字（警示僅為引導，不禁止操作）

## Decisions

### 以 router.refresh() 觸發列表刷新

**決策**：`KeywordForm` 成功提交後，呼叫 Next.js App Router 的 `router.refresh()`，讓 Server Component 重新 fetch 資料，`KeywordList` 即時顯示新關鍵字。

**理由**：Dashboard 的 `KeywordList` 由 Server Component render（資料在 server 端用 Prisma 取得）。Client Component 無法直接操作 server state，但 `router.refresh()` 會在不導航的情況下重新執行 server render，是 Next.js App Router 的標準做法，無需引入額外 state 管理。

**替代方案（棄用）**：
- 前端 optimistic update（在 state 中直接 push 新項目）→ 需要前端維護完整的關鍵字列表 state，與 Server Component 架構衝突，複雜度高
- 改為全 Client Component + SWR/React Query → 需要大幅重構現有架構，範圍過大

---

### 重複關鍵字驗證在 API 層以查詢判斷，不加資料庫 unique constraint

**決策**：在 `POST /api/keywords` 中，insert 前先用 Prisma `findFirst` 查詢是否已存在相同 `userId + keyword + platforms` 組合，若存在則回傳 HTTP 409。**不**在 `schema.prisma` 加 `@@unique` constraint。

**理由**：`platforms` 欄位型別為 `String[]`（PostgreSQL array），Prisma 目前不支援在 array 欄位上建立 `@@unique` compound index，強制加入會造成 migration 失敗。API 層查詢雖有極小的競態條件風險，但對此應用場景（單人手動操作）可接受。

**替代方案（棄用）**：
- `@@unique([userId, keyword])` 忽略 platforms → 邏輯不正確，同一關鍵字不同平台應被允許
- 資料庫觸發器（trigger）→ 超出 Prisma 管理範圍，維護複雜

---

### 通知設定引導以前端 Banner 呈現，在 Dashboard 載入時檢查

**決策**：Dashboard Server Component 在 render 時，同時取得當前用戶的 `NotificationSetting`。若 `discordWebhookUrl` 為 null **且** `notifyEmail` 為 null，則在關鍵字表單上方渲染一個警示 Banner，內含連結至 `/settings` 頁面。

**理由**：Server Component 已有 session 資訊，可直接在同一次 Prisma query 中取得 NotificationSetting，無需額外 API call。Banner 僅為引導，不阻擋操作，保持操作彈性。

**替代方案（棄用）**：
- 阻擋新增（disable 按鈕）→ 過於強硬，用戶可能先設定關鍵字後再填 webhook，行為合理
- Modal 彈窗引導 → 較突兀，Banner 更符合現有 UI 風格

## Risks / Trade-offs

- **競態條件（重複驗證）**：兩個請求同時送出相同關鍵字，理論上都能通過 findFirst 查詢。因屬單人操作場景，機率極低，可接受。
- **router.refresh() 額外 server round-trip**：每次新增關鍵字都觸發一次完整 server render。在關鍵字數量少（<50）時效能可接受。
- **Banner 只在 Dashboard 顯示**：若用戶直接從其他頁面新增關鍵字（未來功能），將看不到警示。目前無此路徑，不影響。
