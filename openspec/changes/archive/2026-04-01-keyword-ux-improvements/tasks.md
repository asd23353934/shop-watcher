## 1. 重複關鍵字驗證（duplicate keyword creation is rejected）

- [x] 1.1 在 `webapp/app/api/keywords/route.ts` 的 POST handler 中，以「重複關鍵字驗證在 API 層以查詢判斷，不加資料庫 unique constraint」設計決策為準：insert 前以 `prisma.keyword.findFirst({ where: { userId, keyword, platforms } })` 查詢是否已存在相同組合；若存在則回傳 `Response.json({ error: '關鍵字已存在' }, { status: 409 })`；此修改屬於「Authenticated user can create a keyword」需求的延伸驗證（Duplicate keyword creation is rejected for the same user）
- [x] 1.2 在 `webapp/components/KeywordForm.tsx` 前端表單中，處理 API 回傳 409 的情況：顯示錯誤提示訊息「此關鍵字與平台組合已存在」於表單下方

## 2. 新增後列表即時刷新（keyword list refresh after creation）

- [x] 2.1 在 `webapp/components/KeywordForm.tsx` 中，import `useRouter` from `next/navigation`；POST 成功後呼叫 `router.refresh()` 觸發 Server Component 重新 fetch，讓 `KeywordList` 顯示新關鍵字（以 router.refresh() 觸發列表刷新）
- [x] 2.2 確認表單提交成功後清空輸入欄位（keyword 文字、價格欄位），避免重複提交

## 3. 通知設定引導 Banner（dashboard warns user when no notification method is configured）

- [x] 3.1 按照「通知設定引導以前端 Banner 呈現，在 Dashboard 載入時檢查」設計決策：在 `webapp/app/dashboard/page.tsx` 的 Server Component 中，新增 `prisma.notificationSetting.findUnique({ where: { userId } })` 查詢；將結果傳入 Client Component 作為 prop（Dashboard warns user when no notification method is configured）
- [x] 3.2 建立（或修改）Dashboard 中的通知警示 Banner 元件：當 `discordWebhookUrl` 為 null **且** `notifyEmail` 為 null（或無 NotificationSetting 記錄）時，顯示黃色警示 Banner，內容包含說明文字與「前往設定」連結（`href="/settings"`）
- [x] 3.3 確認已設定 Discord Webhook 或 Email 的用戶不顯示 Banner（User with Discord webhook configured does not see warning banner、User with only email configured does not see warning banner）
