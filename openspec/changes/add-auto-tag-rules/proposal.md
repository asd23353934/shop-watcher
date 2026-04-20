## Why

既有的跨資源 Tag 系統只能手動掛在 Keyword / CircleFollow（監控規則層），對「捕捉到的商品」本身不具分類能力。使用者累積大量通知紀錄後，無法依商品類型（模型 / 盒玩 / 同人誌 / 作品名）快速篩選，導致 `/history` 頁面閱讀負擔高。

本次新增「商品自動標籤」能力：系統依使用者或內建規則（title regex → 既有 Tag）在 Worker 入庫 SeenItem 時自動套用 tag，並於通知歷史頁支援 tag 篩選。與既有 Tag 模型共用資料與 UI，避免重複實作。

## What Changes

- Prisma 新增 `TagRule`（規則來源：`systemDefault=true` 為系統預設；`userId` 非空為使用者自建；同一使用者可建立 override 關閉系統預設）與 `SeenItemTag`（SeenItem ↔ Tag join table，`onDelete: Cascade`）
- Worker API `POST /api/worker/notify/batch` 入庫新 SeenItem 時，對 `title` 跑該使用者適用的規則集合並批次寫入 `SeenItemTag`
- 新增 `/api/tag-rules` CRUD：列出啟用規則（含系統預設 + 使用者自建 + 關閉狀態）、新增使用者規則、更新 `enabled` / `pattern` / `tagId`、刪除使用者規則（系統預設只能 disable 不能刪）
- 首次啟用新增一份 seed 規則（20–30 條，涵蓋模型 / 盒玩 / 同人誌 / CD / 周邊 / 常見作品名），以 Prisma seed 或 migration data script 寫入 `systemDefault=true` 記錄
- `/history` 頁面加入 tag 篩選 chip（共用 `TagFilterBar` 元件，client-side AND filter），僅顯示該使用者捕捉到的 SeenItem
- 設定頁 (`/settings`) 新增「標籤規則」區塊（`TagRuleManager`）：列出適用規則、可切換 `enabled`、可新增 / 編輯 / 刪除使用者規則、以下拉選單指定規則對應的現有 Tag（不可自由輸入新 tag 名稱）
- 首次為使用者 seed 系統預設規則時，對該使用者近 30 天內（`cleanup.ts` 保留範圍內）的 SeenItem 執行一次性回填；此後規則變更不自動回填（僅對未來新品生效）

## Non-Goals

- 不自動生成 Tag 名稱（避免資料汙染）；規則只能對應使用者既有 Tag，建立規則前需先有 Tag
- 不使用 LLM 分類；僅 regex 比對，所有規則由使用者可見可審
- 不比對 `title` 以外欄位（seller / price / url）；保留未來擴充空間但本次不做
- 不支援規則優先順序 / 互斥；所有命中規則皆套用（一商品多 tag）
- 不支援正規表示式群組擷取或替換；pattern 單純作為「命中或未命中」判斷
- 不提供「每次規則變動自動重跑」或「跨使用者回填」功能；首次 seed 的一次性回填僅限該使用者自己的近 30 天 SeenItem
- 不改 Worker scraper，不調整通知排程或推播內容

## Capabilities

### New Capabilities

- `auto-item-tagging`：依使用者與系統規則於 SeenItem 入庫時自動套用 Tag，包括 TagRule CRUD、Worker 入庫套用、通知歷史 tag 篩選與規則管理 UI

### Modified Capabilities

- `notification-history`：歷史頁支援 tag 篩選 chip（client-side AND filter），顯示範圍仍限於登入使用者的 SeenItem
- `worker-api`：`POST /api/worker/notify/batch` 擴充：入庫 SeenItem 時額外回寫 SeenItemTag（不改變既有 request/response 欄位）

## Impact

- Affected specs：
  - 新 spec：`openspec/specs/auto-item-tagging/spec.md`
  - 修改 spec：`openspec/specs/notification-history/spec.md`、`openspec/specs/worker-api/spec.md`
- Affected code：
  - Prisma：`webapp/prisma/schema.prisma`（+ `TagRule`、`SeenItemTag`）、新 migration、seed script
  - API：`webapp/app/api/tag-rules/route.ts`、`webapp/app/api/tag-rules/[id]/route.ts`、`webapp/app/api/worker/notify/batch/route.ts`（入庫後套用規則）、`webapp/app/api/history/route.ts`（回應加 tags）
  - Lib：`webapp/lib/auto-tag.ts`（規則比對 helper）、`webapp/lib/tag-validation.ts`（複用 ownership 驗證）
  - UI：`webapp/components/TagRuleManager.tsx`、`webapp/components/HistoryClient.tsx`（tag filter）、`webapp/app/history/page.tsx`、`webapp/app/settings/page.tsx`（嵌入 TagRuleManager）
  - Seed：`webapp/prisma/seed-tag-rules.ts`（可由 `prisma migrate` 後手動執行，或於 migration data script 植入）
  - 型別：`webapp/types/tagRule.ts`
- 不動：Python Worker (`src/`)、scraper 邏輯、通知送出流程、現有 Tag / Keyword / CircleFollow API 契約
