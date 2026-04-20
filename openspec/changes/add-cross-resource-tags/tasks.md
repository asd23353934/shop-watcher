## 1. Prisma schema 與 migration

- [x] 1.1 在 `webapp/prisma/schema.prisma` 新增 `Tag` model（`id String @id @default(cuid())`、`userId String`、`name String`、`color String?`、`createdAt`、`updatedAt`、`@@unique([userId, name])`、`@@index([userId])`），落實「Tag 唯一性以 `(userId, name)` 為鍵」與「Tag 色碼儲存 hex 字串，nullable」之決策
- [x] 1.2 新增 `KeywordTag` join table（`keywordId`、`tagId` 複合主鍵 `@@id([keywordId, tagId])`、兩個 FK 皆 `onDelete: Cascade`），實現「使用 join table 而非 PostgreSQL array 欄位」
- [x] 1.3 新增 `CircleFollowTag` join table（`circleFollowId`、`tagId` 複合主鍵、兩 FK `onDelete: Cascade`），支援「刪除 tag 採 cascade，刪除 Keyword / Circle 亦 cascade 解除關聯」
- [x] 1.4 在 `User` model 加 `tags Tag[]` relation；在 `Keyword`、`CircleFollow` model 加對應 join table relation
- [x] 1.5 執行 `pnpm prisma migrate dev --name add_tags`（或 `npx`）產生 migration SQL
- [x] 1.6 本地跑 `pnpm prisma generate` 並確認 TypeScript client 型別含新 model

## 2. 共用型別與 utility

- [x] 2.1 在 `webapp/types/` 或適當位置新增 `Tag` TypeScript interface（`id`、`name`、`color`、`keywordCount?`、`circleCount?`）
- [x] 2.2 在 `webapp/lib/validation.ts`（或新檔）新增 hex 色碼驗證 regex `/^#[0-9A-Fa-f]{6}$/` 供 API 與前端共用
- [x] 2.3 新增 helper：驗證 `tagIds` 陣列中每個 id 皆屬於指定 `userId`（回傳合法 ids 或 throw）

## 3. Tag CRUD API

- [x] 3.1 實作 `POST /api/tags`（`webapp/app/api/tags/route.ts`）滿足「User can create a tag」：trim name、驗證非空、hex color 格式、處理 P2002 → 回 409
- [x] 3.2 實作 `GET /api/tags`（同檔）滿足「User can list their own tags」：以 groupBy 或兩次 count 聚合 `keywordCount` 與 `circleCount`
- [x] 3.3 實作 `PATCH /api/tags/[id]`（`webapp/app/api/tags/[id]/route.ts`）滿足「User can update a tag they own」：先驗證 ownership（userId 比對），再更新 name/color，處理 P2002 → 409
- [x] 3.4 實作 `DELETE /api/tags/[id]`（同檔）滿足「User can delete a tag they own」：驗證 ownership 後刪除，依靠 cascade 清空 join table

## 4. Keyword API 整合 tag

- [x] 4.1 修改 `webapp/app/api/keywords/route.ts` 的 `POST` handler：接收 `tagIds`、驗證所有 id 屬於該 user、以 `tags: { connect: tagIds.map(...) }` 或 nested `KeywordTag.createMany` 一次建立，滿足「Keyword creation accepts tagIds field」
- [x] 4.2 修改 `GET /api/keywords`：在 Prisma query 加 `include: { tags: { include: { tag: true } } }`，回應中把 `tags` 映射為 `{id, name, color}[]`，滿足「GET /api/keywords response includes tags」
- [x] 4.3 修改 `webapp/app/api/keywords/[id]/route.ts` 的 `PATCH` handler：當 `tagIds` 出現時，以 transaction `deleteMany` + `createMany` 替換 KeywordTag 集合；欄位不出現則不動，滿足「Keyword edit accepts tagIds field」

## 5. CircleFollow API 整合 tag

- [x] 5.1 修改 `webapp/app/api/circles/route.ts` 的 `POST` handler：接受 `tagIds` 並驗證 ownership，建立對應 `CircleFollowTag` 關聯，滿足「CircleFollow creation accepts tagIds field」
- [x] 5.2 修改 `GET /api/circles`：include tags 並映射，滿足「GET /api/circles response includes tags」
- [x] 5.3 修改 `webapp/app/api/circles/[id]/route.ts` 的 `PATCH` handler：支援 `tagIds` 替換語意，滿足「CircleFollow edit accepts tagIds field」

## 6. 前端共用元件

- [x] 6.1 新增 `webapp/components/TagChip.tsx`：顯示 tag 名稱 + 背景色（null 色 fallback 灰色），用於「Resource cards display their tags」
- [x] 6.2 新增 `webapp/components/TagSelector.tsx`：列出既有 tag 可多選、支援 inline 建立新 tag（呼叫 `POST /api/tags`、回 201 後 auto-select），用於「Tag selector supports inline tag creation」與「建立資源時支援 inline 建立新 tag」
- [x] 6.3 新增 `webapp/components/TagFilterBar.tsx`：顯示使用者所有 tag 為可切換 chip，對外以 `selectedTagIds` state 與 `onChange` callback 運作；當 tag 列表為空時不渲染
- [x] 6.4 在 `webapp/lib/hooks/` 或對應位置新增 `useTags()` hook：`GET /api/tags` 並提供 refetch，供 Dashboard / Circles / Selector 共用

## 7. Dashboard 整合

- [x] 7.1 在 Dashboard client component 加入 `TagFilterBar`，並實作 client-side AND filter（落實「Tag filter 採 client-side 過濾（首版）」），滿足「Dashboard supports tag filter chips」
- [x] 7.2 在 `webapp/components/KeywordCard.tsx` 加入 tag chip 區塊（使用 `TagChip`）
- [x] 7.3 在 `webapp/components/KeywordForm.tsx`（建立）與 Keyword 編輯 modal 加入 `TagSelector`，把選取的 `tagIds` 帶入 POST/PATCH 請求

## 8. Circles 頁面整合

- [x] 8.1 在 `webapp/app/circles/page.tsx` 或其 client component 加入 `TagFilterBar` 與 AND filter，滿足「Circles page supports tag filter chips」
- [x] 8.2 在 CircleFollow 卡片元件加入 tag chip 顯示
- [x] 8.3 在 `webapp/components/CircleFollowForm.tsx` 加入 `TagSelector`，把 `tagIds` 帶入 POST/PATCH

## 9. UX 細節與驗證

- [x] 9.1 Tag 刪除前在 UI 顯示 `AlertDialog`：「此 tag 目前套用於 N 個 keyword / M 個 circle，確定刪除？」使用 `GET /api/tags` 提供的 count
- [x] 9.2 `TagSelector` 與 `POST /api/tags` 表單送出前執行 `name.trim()`，避免誤建立重複 tag
- [x] 9.3 若 inline 建立 tag 時 API 回 409，在 selector 顯示錯誤 toast 並不中斷使用者編輯主表單

## 10. 文件與測試

- [x] 10.1 更新 `CLAUDE.md`「核心功能」章節加入 tag 系統簡述；更新「目錄結構」加入新檔案；更新 API Route 規範表（若需要）
- [x] 10.2 更新 `README.md` 功能列表加上「跨資源標籤」（注意：不含平台反爬 / fraud detection 敏感細節）
- [ ] 10.3 手動驗證：建立 2 個 tag → 建立 1 keyword + 1 circle 各掛不同 tag → Dashboard / Circles 分別用 tag filter 驗證 AND 語意 → 刪除其中一個 tag 確認 join table 清空但資源仍在
- [ ] 10.4 commit 前依 CLAUDE.md 規範執行 `/simplify` 與 `/spectra:audit`
