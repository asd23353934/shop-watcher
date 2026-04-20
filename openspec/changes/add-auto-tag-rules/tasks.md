## 1. Prisma schema 與 migration

- [x] 1.1 於 `webapp/prisma/schema.prisma` 新增 `TagRule` model（依據設計決策「資料模型：`TagRule` 以 `systemDefault` + `userId` 表達三種規則來源」的最終簡化版：`userId String`、`pattern String`、`tagId String`、`enabled Boolean @default(true)`、`systemDefault Boolean @default(false)`、`createdAt`、`updatedAt`、FK 皆 `onDelete: Cascade`、`@@index([userId, enabled])`）
- [x] 1.2 於同一 schema 新增 `SeenItemTag` join table（`seenItemId` + `tagId` 複合主鍵、兩個 FK 皆 `onDelete: Cascade`、`@@index([tagId])`）；於 `SeenItem` 與 `Tag` model 加對應 relation 欄位
- [x] 1.3 於 `User` model 加 `tagRules TagRule[]` relation
- [x] 1.4 執行 `pnpm prisma migrate dev --name add_tag_rules` 產生 migration；跑 `pnpm prisma generate` 驗證 client 型別含新 model 與 relation

## 2. 共用型別與系統 seed 常數

- [x] 2.1 新增 `webapp/types/tagRule.ts` 匯出 `TagRule` interface（`id`、`userId`、`pattern`、`enabled`、`systemDefault`、`tag: { id, name, color }`、`createdAt`、`updatedAt`）
- [x] 2.2 新增 `webapp/lib/system-tag-rules.ts` 常數陣列，落實「系統預設規則的 Tag 擁有者：每個 user 首次登入時 clone 一份」決策；至少包含 20 條覆蓋「模型 / 盒玩 / 同人誌 / CD / 周邊 / 常見作品名（初音、IA、鏡音、Fate、原神）」的 `{ tagName, pattern, color? }` 項目
- [x] 2.3 新增 `webapp/lib/auto-tag.ts` 內的 `ensureSystemTagRules(userId)` helper，同時滿足 spec「System seeds default tag rules per user on demand」與落實設計「系統規則初始化採 lazy seed（首次 GET 時）」：以 `upsert` 建立該 user 缺少的 `Tag`（以 `(userId, name)` 為唯一鍵），再以 `createMany({ skipDuplicates: true })` 補齊對應 `TagRule(systemDefault=true, enabled=true)`；不更動使用者已 toggle 的 `enabled` 狀態；回傳「本次是否實際新建規則」旗標供呼叫端判斷是否啟動回填
- [x] 2.4 於 `webapp/lib/auto-tag.ts` 新增 `backfillRecentSeenItems(userId, rules)` helper，落實設計「首次 seed 時對近 30 天 SeenItem 一次性回填」並滿足 spec「System backfills recent SeenItems on first seed」：以 `findMany` 取該 user 的所有 SeenItem（依靠 `cleanup.ts` 保留的 30 天範圍），用記憶體規則跑 `applyRulesToTitle`，蒐集 `{ seenItemId, tagId }[]` 後以 `SeenItemTag.createMany({ data, skipDuplicates: true })` 同步寫入；`ensureSystemTagRules` 在偵測到實際新建規則時同步呼叫此 helper（不發動於使用者後續 POST/PATCH 規則）

## 3. Regex 比對與驗證 helper

- [x] 3.1 於 `webapp/lib/auto-tag.ts` 新增 `compilePattern(pattern)` helper，落實「Regex 比對採 PostgreSQL 不處理、Node 端處理」：輸入失敗回傳 `{ ok: false, reason: 'syntax' }`；catastrophic backtracking 以 `safe-regex` 套件（或等價 heuristic）檢查，失敗回傳 `{ ok: false, reason: 'unsafe' }`
- [x] 3.2 於 `webapp/lib/auto-tag.ts` 新增 `applyRulesToTitle(title, rules)`：回傳命中 `tagId[]`；case-insensitive；單條規則拋錯時 console.warn 並跳過，不拋給上層

## 4. TagRule CRUD API

- [x] 4.1 實作 `GET /api/tag-rules`（`webapp/app/api/tag-rules/route.ts`）滿足「User can list their tag rules」；內部先呼叫 `ensureSystemTagRules(userId)` 再 `findMany` 包含 `tag` relation 回傳
- [x] 4.2 實作 `POST /api/tag-rules`（同檔）滿足「User can create a tag rule」：驗證 `pattern` 以 `compilePattern` 通過（syntax 錯回 422「規則格式錯誤」、unsafe 錯回 422「規則過於複雜，可能導致效能問題」）；驗證 `tagId` 屬於該 user（用 `webapp/lib/tag-validation.ts` 的 `assertTagIdsOwnedBy` helper），失敗回 404「標籤不存在」；成功建立 `TagRule(systemDefault=false, enabled=true)` 回 201
- [x] 4.3 實作 `PATCH /api/tag-rules/[id]`（`webapp/app/api/tag-rules/[id]/route.ts`）滿足「User can update a tag rule」：驗證 rule 屬該 user；若 `systemDefault=true` 且 body 含 `pattern` 或 `tagId` 回 403「系統預設規則僅能啟用或停用」；否則依欄位更新（`pattern` 跑 `compilePattern`、`tagId` 跑 ownership 驗證）
- [x] 4.4 實作 `DELETE /api/tag-rules/[id]`（同檔）滿足「User can delete a tag rule」：`systemDefault=true` 回 403「系統預設規則不可刪除，可改為停用」；否則刪除並回 204

## 5. Worker 批次入庫整合

- [x] 5.1 修改 `webapp/app/api/worker/notify/batch/route.ts`，落實「Worker 入庫流程：SeenItem upsert 後 batch-insert SeenItemTag」與滿足「notify/batch applies user tag rules to newly inserted SeenItems」、「Worker applies enabled rules when inserting new SeenItems」：在 handler 開頭呼叫 `ensureSystemTagRules(userId)`，接著 `findMany({ userId, enabled: true })` 載入該 user 啟用規則並預先 `compilePattern` 快取
- [x] 5.2 於既有 SeenItem upsert 迴圈區分「本次新插入」與「既有更新」（依 upsert 回傳的 `firstSeen === now` 或改用顯式 `create + catch P2002` 流程）；對「新插入」的 row 呼叫 `applyRulesToTitle(title, rules)`，蒐集 `{ seenItemId, tagId }[]` 後以 `SeenItemTag.createMany({ data, skipDuplicates: true })` 一次寫入
- [x] 5.3 確保既有 batch response 欄位與 HTTP 狀態碼不變；在 `webapp/scripts/test-batch-api.mjs`（若存在）或新增一個最小 integration fixture 驗證新品會產生 `SeenItemTag`、既有品不會重新標

## 6. /history API 與頁面整合

- [x] 6.1 修改 `webapp/app/api/history/route.ts` 滿足「History response includes auto-applied tags」：Prisma query 加 `include: { SeenItemTag: { include: { tag: true } } }`，回應將 `tags: SeenItemTag[].map(st => ({ id: st.tag.id, name: st.tag.name, color: st.tag.color }))` 加入每一列
- [x] 6.2 於同一 route 落實「`/history` 頁面的 tag 篩選採 server-side filter」與滿足「History API supports tagIds filter with AND semantics」：接受 `tagIds` query（CSV），解析為陣列；用 `webapp/lib/tag-validation.ts` 的 `assertTagIdsOwnedBy` 過濾 user 不擁有的 id（silently drop）；合法 id 以 `AND { SeenItemTag: { some: { tagId: id } } }` 疊加實現 AND 語意
- [x] 6.3 修改 `webapp/app/history/page.tsx`（或對應 client component）滿足「History page displays tag chips and supports tag filter bar」：以 `useTags()` 讀取該 user 所有 tag 渲染 `<TagFilterBar>`；選取 tag 後以 query string 觸發 `GET /api/history?tagIds=...`；每列於 item 名稱旁渲染 `<TagChip>`（共用既有元件）；reload 後 filter 重設

## 7. 規則管理 UI

- [x] 7.1 新增 `webapp/components/TagRuleManager.tsx` 滿足「Rule management UI on settings page」與落實「規則管理 UI 用 Tag 下拉選單而非文字輸入」：分組顯示 systemDefault 與 user 規則；所有規則可切換 `enabled`（呼叫 PATCH）；user 規則提供 inline 編輯 `pattern`（即時 regex compile 驗證，錯誤顯示「規則格式錯誤」並 disable 送出）與 tag 下拉選單（僅列該 user 既有 tag，`<select>` 不含「新增 tag」入口）；user 規則顯示刪除按鈕（systemDefault 隱藏）
- [x] 7.2 於 `webapp/app/settings/page.tsx` 加入「標籤規則」區塊並掛入 `<TagRuleManager />`，排在既有 `<TagManager />` 後方

## 8. 文件與驗證

- [x] 8.1 更新 `CLAUDE.md`「核心功能」章節加入「商品自動標籤」簡述，「目錄結構」加入 `webapp/lib/auto-tag.ts`、`webapp/lib/system-tag-rules.ts`、`webapp/components/TagRuleManager.tsx`、`webapp/types/tagRule.ts`、`webapp/app/api/tag-rules/` 路徑
- [x] 8.2 更新 `README.md` 功能特色表格加入「🤖 商品自動標籤」一列（不涉及平台反爬或 fraud detection 敏感細節）
- [ ] 8.3 手動驗證：(a) 新 user 登入 → 開啟 `/settings` → 確認標籤規則列表含 20+ 系統預設；(b) 觸發一次 worker scan（或 `scripts/test-batch-api.mjs`）→ 檢查 SeenItem 有 `SeenItemTag`；(c) 於 `/history` 點 tag chip 驗證 AND filter 正確；(d) 停用一條 system rule → 再跑 scan → 新商品不再命中；(e) 刪除 user-created rule → 確認回 204；刪除 system rule → 確認 403；(f) 對已累積 SeenItem 的既有 user 首次觸發 seed → 確認近 30 天 SeenItem 有被回填 tag；(g) 二次呼叫 `GET /api/tag-rules` → 確認沒有重複 `SeenItemTag` 產生
- [ ] 8.4 commit 前依 CLAUDE.md 規範執行 `/simplify` 與 `/spectra:audit`
