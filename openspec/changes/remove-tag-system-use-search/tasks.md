## 1. 前端 Tag UI 移除

- [x] 1.1 修改 `webapp/app/history/page.tsx`：移除 `TagChip` / `TagFilterBar` / `useTags` / `availableTags` / `selectedTagIds` / `HistoryTag` interface 與 `item.tags` 渲染區塊；同時把 `SeenItem` interface 中的 `tags` 欄位刪除
- [x] 1.2 修改 `webapp/app/settings/page.tsx`：移除「標籤管理」與「標籤規則」兩個 `<div>` 區塊（含 `TagManager` 與 `TagRuleManager` import）
- [x] 1.3 修改 `webapp/components/KeywordForm.tsx`：移除 `TagSelector` 使用與 `tagIds` state、submit payload 中的 `tagIds`
- [x] 1.4 修改 `webapp/components/KeywordList.tsx`：移除 inline edit form 的 `TagSelector`；移除 card header 的 tag 顯示；移除 `tagIds` 欄位處理
- [x] 1.5 修改 `webapp/components/KeywordCard.tsx`：移除 tag chip 渲染
- [x] 1.6 修改 `webapp/components/KeywordClientSection.tsx`：移除 `TagFilterBar` 渲染與 `selectedTagIds` client-side filter（`filtered` 計算）
- [x] 1.7 修改 `webapp/app/circles/page.tsx`：移除 `TagFilterBar` 渲染、`selectedTagIds` state 與 client-side tag filter
- [x] 1.8 修改 `webapp/components/CircleFollowForm.tsx`：移除 `TagSelector` 與 submit payload 中的 `tagIds`
- [x] 1.9 刪除檔案：`webapp/components/TagChip.tsx`、`TagFilterBar.tsx`、`TagSelector.tsx`、`TagManager.tsx`、`TagRuleManager.tsx`
- [x] 1.10 修改 `webapp/types/keyword.ts`：移除 `tags` 欄位

## 2. 後端 API 與 lib 移除

- [x] 2.1 刪除目錄：`webapp/app/api/tags/`、`webapp/app/api/tag-rules/`
- [x] 2.2 修改 `webapp/app/api/keywords/route.ts`（POST）：移除 `tagIds` body 處理、`assertTagIdsOwnedBy` 呼叫、`KeywordTag.createMany`
- [x] 2.3 修改 `webapp/app/api/keywords/[id]/route.ts`（PATCH/DELETE）：移除 `tagIds` body 處理與 `KeywordTag` upsert；GET include 移除 `tags`
- [x] 2.4 修改 `webapp/app/api/circles/route.ts`（POST）：移除 `tagIds` body 處理與 `CircleFollowTag.createMany`
- [x] 2.5 修改 `webapp/app/api/circles/[id]/route.ts`（PATCH）：移除 `tagIds` body 處理與 `CircleFollowTag` upsert；include 移除 `tags`
- [x] 2.6 修改 `webapp/app/api/worker/notify/batch/route.ts`：刪除 `ensureSystemTagRules` 呼叫、compile rules 區塊、`seenRows` 查詢、`SeenItemTag.createMany`；保留既有 batch response 結構（`new` / `price_drop` / `duplicate`）。此步驟同時落實 spec「REMOVED: History response includes auto-applied tags」（worker 不再產生 SeenItemTag，因此 history 無 tags 可回應）
- [x] 2.7 刪除檔案：`webapp/lib/auto-tag.ts`、`webapp/lib/system-tag-rules.ts`、`webapp/lib/tag-validation.ts`、`webapp/lib/hooks/useTags.ts`（若資料夾空再刪 `webapp/lib/hooks/`）
- [x] 2.8 刪除檔案：`webapp/types/tag.ts`、`webapp/types/tagRule.ts`

## 3. Prisma schema 與 migration

- [x] 3.1 修改 `webapp/prisma/schema.prisma`：刪除 `Tag` / `TagRule` / `SeenItemTag` / `KeywordTag` / `CircleFollowTag` 五個 model；刪除 `User.tags`、`User.tagRules`、`Keyword.tags`、`CircleFollow.tags`、`SeenItem.tags` 五個 relation 欄位
- [x] 3.2 執行 `pnpm prisma migrate dev --name remove_tag_system`；檢查 Prisma 自動產生的 SQL，改寫為顯式 `DROP TABLE IF EXISTS "SeenItemTag" CASCADE; DROP TABLE IF EXISTS "TagRule" CASCADE; DROP TABLE IF EXISTS "KeywordTag" CASCADE; DROP TABLE IF EXISTS "CircleFollowTag" CASCADE; DROP TABLE IF EXISTS "Tag" CASCADE;`（依 FK 依賴順序）。落實 design 決策「DROP TABLE 走新 migration，不逆向 prisma migrate resolve」
- [x] 3.3 執行 `pnpm prisma generate` 驗證 client 型別不再含上述五個 model；跑 `npx tsc --noEmit` 確認無殘留 import 或型別引用

## 4. History 搜尋功能實作

- [x] 4.1 修改 `webapp/app/api/history/route.ts`：新增 `q` query 參數解析（URL decode 透過 `searchParams.get` 自動處理；`.trim()`；以 `/[\s\u3000]+/` split 為 tokens）；每個 token 轉為 `{ itemName: { contains: token, mode: 'insensitive' } }` 並以 `AND` 疊加於 `where`；保留 `itemName: { not: null }` 約束使 null row 不匹配。此任務落實 spec「ADDED: History API supports title search via q parameter」並同時完成「REMOVED: History API supports tagIds filter with AND semantics」（移除 `tagIds` 參數處理）與「REMOVED: History response includes auto-applied tags」（移除 `include: { tags: ... }` 與 response `shaped` map 的 `tags` 欄位）。參考 design 決策「搜尋採 Postgres `ILIKE` + 多詞 AND，不引入 full-text 索引」
- [x] 4.2 修改 `webapp/app/history/page.tsx`：在既有 keyword / platform `<select>` 之後新增 `<input type="search">` 搜尋框；state `q: string`；使用 `useEffect` 搭配 `setTimeout` 300ms debounce 於 `q` 變更時觸發 refetch（落實 design 決策「前端搜尋輸入 debounce 300ms」）；清空（`q === ''`）時立即 refetch 不等 debounce（於 onChange 判斷並 clearTimeout）；fetchItems 簽名加入 `q: string` 參數並於 `params.set('q', q)` 當 `q.trim()` 非空時附加；同時移除 `TagChip` / `TagFilterBar` / `useTags` / `HistoryTag` / `item.tags` 相關 JSX 與 state。此任務落實 spec「ADDED: History page provides title search input」並完成「REMOVED: History page displays tag chips and supports tag filter bar」
- [x] 4.3 於 `webapp/app/history/page.tsx` 加入 `useEffect` cleanup：unmount 或依賴變更時 `clearTimeout` 避免 leak
- [ ] 4.4 手動驗證：本地 dev server 開啟 `/history` → 輸入 `公仔` 確認 < 1s 返回；輸入 `檔案 公仔` 確認 AND 語意；清空搜尋確認還原列表；與 keyword / platform filter 疊加正確；`q` 為全形空白或純空白時不觸發 filter

## 5. 文件與清理

- [x] 5.1 修改 `CLAUDE.md`：「核心功能」章節移除「商品自動標籤」與「跨資源標籤」兩個 bullet；「目錄結構」移除 `auto-tag.ts` / `system-tag-rules.ts` / `hooks/useTags.ts` 與 `components/Tag*.tsx`；於「通知歷史」相關段落加入「支援標題關鍵字搜尋」一句
- [x] 5.2 修改 `README.md`：功能特色表格移除「🏷️ 跨資源標籤」與「🤖 商品自動標籤」兩列；若 `/history` 在表格有敘述，加入「支援商品名稱關鍵字搜尋」
- [x] 5.3 刪除 `openspec/changes/add-cross-resource-tags/` 與 `openspec/changes/add-auto-tag-rules/` 兩個目錄（已於 master commit 但能力被本 change 取消，保留會造成 `spectra list` 永久噪音）。落實 design 決策「Spectra in-progress changes 保留不歸檔、從此 change 併入 archive 時一併清理」
- [ ] 5.4 執行 pre-commit 檢查：`/simplify` 掃視變更、`/spectra:audit` 檢查新搜尋端點是否有注入或 ReDoS 風險（`contains` 採 Prisma 參數化，非字串拼接，應為安全）
