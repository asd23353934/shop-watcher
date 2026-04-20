## Why

上一輪剛落地的 Tag 系統（跨資源標籤 + 商品自動標籤規則）在實務評估後證實 ROI 偏低：

- **維護成本高**：要讓分類有意義需從 category（10 條）→ IP（50-80 條）→ character（數百至數千條）逐層擴充，character 層級手動維護不可行
- **個人化無價值**：使用者只有一個（擁有者），per-user 複製系統規則、per-user tag 命名空間都是多餘的抽象
- **Keyword/Circle 掛 tag 無意義**：關鍵字 tag 純粹是列表 UI 分組工具，不會傳遞到捕捉到的 SeenItem，實際幫助有限
- **regex 涵蓋度有限**：只能比對 `itemName`，同義詞（蔚藍檔案 / ブルアカ / blue archive）要手寫 alternation，又無法覆蓋長尾

文字搜尋在 `/history` 頁面直接打 `檔案 公仔` 就能達成 90% 的篩選需求，零維護、零誤標、天然支援角色層級查詢，且不需要預先建立 tag。

## What Changes

- **BREAKING**：移除 `Tag` / `TagRule` / `SeenItemTag` / `KeywordTag` / `CircleFollowTag` 五張資料表與對應 migration（以新 migration 執行 `DROP TABLE`）
- **BREAKING**：移除 API `GET/POST /api/tags`、`PATCH/DELETE /api/tags/[id]`、`GET/POST /api/tag-rules`、`PATCH/DELETE /api/tag-rules/[id]`
- **BREAKING**：`GET /api/history` 取消 `tagIds` query 參數與回應中的 `tags` 欄位
- **BREAKING**：`POST /api/worker/notify/batch` 不再寫入 `SeenItemTag`，payload 與 response 結構不變
- **BREAKING**：`POST/PATCH /api/keywords`、`POST/PATCH /api/circles` 不再接受 `tagIds` 欄位
- 移除 component：`TagChip`、`TagFilterBar`、`TagSelector`、`TagManager`、`TagRuleManager`
- 移除 lib：`webapp/lib/auto-tag.ts`、`webapp/lib/system-tag-rules.ts`、`webapp/lib/tag-validation.ts`、`webapp/lib/hooks/useTags.ts`
- 移除 type：`webapp/types/tag.ts`、`webapp/types/tagRule.ts`
- `/settings` 頁面移除「標籤管理」與「標籤規則」兩個區塊
- Dashboard 與 `/circles` 頁面移除 tag filter UI（保留其他 filter）
- `KeywordForm` / `KeywordList` / `KeywordCard` / `CircleFollowForm` 移除 tag 顯示、編輯、建立入口
- **新增**：`GET /api/history` 加入 `q` query 參數，值為 URL-encoded 搜尋字串；以空白切詞後對 `itemName` 做 case-insensitive AND 包含比對（Postgres `ILIKE`）
- **新增**：`/history` 頁面在篩選列加入搜尋輸入框，change 後 debounce 300ms 觸發 query
- `types/keyword.ts` 移除 `tags` 欄位

## Non-Goals

- 不移除 `Tag` 模型以外的其他 Keyword 欄位（`blocklist` / `mustInclude` / `sellerBlocklist` 保留）
- 不實作全文索引（pg_trgm / tsvector）：預期資料量維持 30 天 retention 下 SeenItem 總數 < 10k，`ILIKE` 足夠
- 不新增搜尋歷史或建議
- 不保留 tag 資料以供未來回滾：DROP TABLE 直接清除，回滾走 git revert + `prisma migrate`
- 不提供「從 tag 搜尋跳轉到文字搜尋」的轉換工具，資料已被視為可丟棄

## Capabilities

### New Capabilities

（無新增）

### Modified Capabilities

- `notification-history`：新增 title search 子能力；移除 tag chip 顯示與 tagIds 篩選子能力

## Impact

- **Affected specs**：`notification-history`
- **Affected code (新增/修改)**：
  - `webapp/app/api/history/route.ts`（移除 tagIds / tags include，加入 q 參數與 ILIKE AND 條件）
  - `webapp/app/history/page.tsx`（移除 TagFilterBar / TagChip 使用，加入搜尋輸入框 + debounce）
  - `webapp/app/dashboard/page.tsx` 或相關 client component（移除 tag filter）
  - `webapp/app/circles/page.tsx`（移除 tag filter）
  - `webapp/app/settings/page.tsx`（移除 TagManager / TagRuleManager 區塊）
  - `webapp/app/api/worker/notify/batch/route.ts`（移除 auto-tag 邏輯區塊）
  - `webapp/app/api/keywords/route.ts`、`webapp/app/api/keywords/[id]/route.ts`（移除 tagIds 處理）
  - `webapp/app/api/circles/route.ts`、`webapp/app/api/circles/[id]/route.ts`（移除 tagIds 處理）
  - `webapp/components/KeywordForm.tsx`、`KeywordList.tsx`、`KeywordCard.tsx`、`KeywordClientSection.tsx`、`CircleFollowForm.tsx`（移除 tag UI）
  - `webapp/types/keyword.ts`（移除 tags 欄位）
  - `webapp/prisma/schema.prisma`（刪除五個 model 與對應 relation）
  - `CLAUDE.md`、`README.md`（移除對應章節/表格列）
- **Affected code (刪除)**：
  - `webapp/app/api/tags/`、`webapp/app/api/tag-rules/` 兩個路由目錄
  - `webapp/components/TagChip.tsx`、`TagFilterBar.tsx`、`TagSelector.tsx`、`TagManager.tsx`、`TagRuleManager.tsx`
  - `webapp/lib/auto-tag.ts`、`system-tag-rules.ts`、`tag-validation.ts`、`hooks/useTags.ts`
  - `webapp/types/tag.ts`、`tagRule.ts`
- **新增 migration**：`webapp/prisma/migrations/<ts>_remove_tag_system/migration.sql`，內容為 `DROP TABLE IF EXISTS "SeenItemTag", "TagRule", "KeywordTag", "CircleFollowTag", "Tag" CASCADE;`
- **Spectra changes 清理**：`openspec/changes/add-cross-resource-tags/`、`add-auto-tag-rules/` 這兩個 in-progress change 在本 change archive 之前一併歸檔或刪除（由實作者決定）
