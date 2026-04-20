## Context

`add-cross-resource-tags` 已建立 `Tag` 模型（`(userId, name)` 唯一）、`KeywordTag` / `CircleFollowTag` 兩張 join table、`TagChip` / `TagFilterBar` / `TagSelector` / `TagManager` 四個 UI 元件、`useTags` hook。該系統將 tag 掛在「監控規則」層（Keyword / CircleFollow），使用者必須手動選取。

實務上使用者發現：當累積 500+ 筆通知紀錄時，主要痛點不在於監控規則分類（規則本身數量有限），而是「無法快速在歷史頁找到特定類型的商品」。由於 scraper 目前只能穩定抓到 `title / price / seller / url / imageUrl`，沒有平台原生分類欄位，自動分類唯一可靠輸入是 `title`。

另一方面，若讓系統憑空生成 tag 名稱（例如抽取 title 片段或透過 LLM），會造成：
1. 同義詞汙染（`ミク` vs `Miku` vs `初音`）
2. 不可預期的 tag 大爆炸
3. 難以與使用者手動 tag 整合

因此本設計採「規則對應既有 Tag」模式：使用者或系統預設規則只能將 title match 映射到**已存在的 Tag**，tag 來源仍由人類掌控。

## Goals / Non-Goals

**Goals:**

- SeenItem 入庫時依啟用規則自動掛上 Tag，Worker API 回應不變
- 使用者在 `/history` 可以點 Tag chip 做 AND filter
- 設定頁提供規則管理 UI，可新增 / 編輯 / 停用 / 刪除使用者規則，且可停用系統預設
- 系統預設規則以資料列形式存在資料庫（非硬編碼），方便未來經由 migration 增補
- 與既有 Tag / KeywordTag / CircleFollowTag 共用 Tag 表，不重複建模

**Non-Goals:**

- 不對 `title` 以外欄位（seller / price / url）比對
- 不使用 LLM / ML 分類
- 不支援 regex 擷取群組、不做文字替換
- 不自動生成新 Tag（規則 `tagId` 必須指向既有 Tag，且需屬於同 user；系統預設規則的 tag 由 seed 同時種入並標記）
- 不回填超過保留期（30 天）的舊 SeenItem；不在每次規則新增 / 編輯時自動回填
- 不提供跨使用者規則共享（系統預設除外）
- 不支援規則優先級 / 互斥；所有命中規則皆套用

## Decisions

### 資料模型：`TagRule` 以 `systemDefault` + `userId` 表達三種規則來源

`TagRule` 欄位：

```prisma
model TagRule {
  id            String   @id @default(cuid())
  userId        String?                    // null 表系統預設；非 null 表使用者自建或 override
  pattern       String                     // regex 字串，儲存原始使用者輸入
  tagId         String                     // FK → Tag.id
  enabled       Boolean  @default(true)
  systemDefault Boolean  @default(false)
  overridesId   String?                    // 使用者建立的 override 指向被覆蓋的 systemDefault 規則
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  overrides TagRule? @relation("RuleOverride", fields: [overridesId], references: [id], onDelete: Cascade)
  overriddenBy TagRule[] @relation("RuleOverride")

  @@index([userId, enabled])
  @@index([systemDefault])
}
```

三種記錄組合：

1. **系統預設規則**：`systemDefault=true`、`userId=null`、`tagId` 指向專屬的「系統 Tag」（於 seed 時為共用擁有者帳號或每個使用者種一份 Tag；見下一條 decision）
2. **使用者自建規則**：`systemDefault=false`、`userId=<user>`、`tagId` 指向該 user 的 Tag
3. **使用者停用系統預設**：`systemDefault=false`、`userId=<user>`、`overridesId=<system rule id>`、`enabled=false`；查詢時若發現某 user 對某 system rule 有 override 記錄則以 override 的 `enabled` 為準

**替代方案考慮**：以單一布林欄位 `isDisabledBySystem` 並搭配 `(userId, ruleId)` 雙 key 表達「user 停用 system rule」——被否決，因為 system rule 無 userId，且與 TagRule 本表混在一起導致 JOIN 複雜；使用 `overridesId` 自我參照關聯較清晰。

### 系統預設規則的 Tag 擁有者：每個 user 首次登入時 clone 一份

系統預設 tag（例：`模型`、`盒玩`、`同人誌`）不可能跨 user 共用同一個 `Tag` 列，因為 Tag 是 per-user scope。做法：

- `prisma/seed-tag-rules.ts` 維護一份純資料 map：`[{ patterns: ["figma","nendoroid","figuarts"], tagName: "模型" }, ...]`
- 使用者首次呼叫 `GET /api/tag-rules`（或首次建立 Keyword/Circle 時）觸發 `ensureSystemTagsForUser(userId)`：確保該使用者的 Tag 表含系統預設名稱，若缺則 `createMany` 補齊；並為每個系統規則建立 `TagRule(systemDefault=true, userId=user, tagId=<該 user 的該 tag>)`

**這與「`systemDefault=true` 且 `userId=null`」設計衝突，重新評估**：

- 改為 `systemDefault=true` 意味「該規則來自系統 seed」，但仍 **per-user** 存在（`userId` 非空）
- `userId=null` 的記錄不再使用；去除 `overridesId` 欄位
- 三種狀態簡化為：`systemDefault + enabled` 組合
  - `(systemDefault=true, enabled=true)`：啟用中的系統預設（user 初始化時為每個使用者種）
  - `(systemDefault=true, enabled=false)`：user 停用的系統預設
  - `(systemDefault=false, enabled=*)`：user 自建規則

這樣單表查詢一次搞定：`WHERE userId=? AND enabled=true`。**採用此簡化版。**

最終 schema（修正）：

```prisma
model TagRule {
  id            String   @id @default(cuid())
  userId        String                    // 一定屬於某 user（含 systemDefault clone）
  pattern       String
  tagId         String
  enabled       Boolean  @default(true)
  systemDefault Boolean  @default(false)  // true = 來自 seed，不能刪只能 disable
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@index([userId, enabled])
}
```

### 系統規則初始化採 lazy seed（首次 GET 時）

- 不在 migration 一次塞所有 user（migration 不應依賴 runtime 狀態）
- 不強制使用者觸發（避免登入 flow 變重）
- 折衷：`lib/auto-tag.ts` 提供 `ensureSystemTagRules(userId)`，在 `GET /api/tag-rules` 與 Worker `POST /api/worker/notify/batch` 首次呼叫該 user 時檢查 `TagRule.count({ where: { userId, systemDefault: true } })` 是否等於 seed 長度；若不足才補齊
- Seed 資料（`webapp/lib/system-tag-rules.ts`）為 TypeScript 常數陣列，每筆含 `tagName`、`pattern`；補齊時一併 `upsert` Tag 與 TagRule。schema 變動或新增系統規則時修改此常數即可；下次觸發時自動補差異。

**替代方案考慮**：Neon DB migration 跑 data script 對所有現有 user 插入——否決，因為資料變動應屬 runtime 行為，且部署環境可能 user 數大，migration 跑太久。

### Regex 比對採 PostgreSQL 不處理、Node 端處理

- Pattern 儲存為字串；Node 端於 `notify/batch` handler 內以 `new RegExp(pattern, 'i')` 實例化
- 錯誤 pattern（無法編譯）於 CRUD 寫入時驗證並 reject（422）；Worker 端若遇到壞 pattern 應 skip 並 log，不中斷整批入庫
- 查詢時以 `enabled=true` 過濾，結果集 in-memory 比對 title。預估規則數 per user 上限 200（系統 30 + 使用者 170），百筆商品 × 200 規則 = 20k match，純字串 regex 於 Node 端毫秒級，無效能疑慮

**替代方案考慮**：用 PostgreSQL `~*` operator 於 SQL 端比對——否決，因批次入庫 SeenItem 已 upsert 一次，再為每筆商品跑一次 SQL 會倍增 round-trip；in-memory 處理更簡單。

### 首次 seed 時對近 30 天 SeenItem 一次性回填

若不回填，`/history` 在使用者初次啟用時前 30 天無法透過 tag 篩選，實用性降低。做法：

- `ensureSystemTagRules(userId)` 完成 seed 後，若本次「實際新建」了 `TagRule`（意味 user 先前未 seed 過），隨即對該 user 的 SeenItem 做一次回填：
  1. `findMany({ where: { userId } })` 取出近 30 天的 SeenItem（`cleanup.ts` 已保證資料上限）
  2. 以記憶體中的規則集合 `applyRulesToTitle` 比對每筆 title
  3. `SeenItemTag.createMany({ data, skipDuplicates: true })` 一次寫入
- 判斷「實際新建」：`createMany` 回傳的 `count > 0`，或改為先 `count` 再 `create` 比對差值
- 由於 `ensureSystemTagRules` 本身 idempotent，此 backfill 只會在使用者生命週期中跑一次；之後新增或修改規則**不觸發**回填
- 規則刪除或 `enabled=false` 不反向清除既有 `SeenItemTag`（保留歷史 tag，避免誤刪；若使用者想清理，直接刪 Tag 走 cascade）

**替代方案考慮**：

- 每次規則新增 / 編輯都回填——否決，pattern typo 會造成全資料錯誤 tag，清理困難
- 提供設定頁按鈕讓使用者自行觸發回填——否決（首版先不做，避免多一條 UI 路徑；若未來使用者反應規則迭代頻繁再補）
- 於 migration data script 對所有現有 user 一口氣回填——否決，與「lazy seed」決策衝突，且部署時間難估

回填成本估算：活躍使用者近 30 天 SeenItem 約數千筆 × seed 規則 30 條 = 10⁵ 量級字串比對，純 Node regex 於單次 request handler 內毫秒級完成；若擔心首次 GET 阻塞 response，可於 handler 中以 `void backfill(userId, rules)` fire-and-forget（不等 Promise），回應不受影響。採同步回填為首版（簡單、可預期），若觀測到延遲再改 async。

### Worker 入庫流程：SeenItem upsert 後 batch-insert SeenItemTag

`POST /api/worker/notify/batch` 目前流程（摘要）：

1. 接 batch 資料 → 對每個 (userId, platform, itemId) 做 `SeenItem` upsert
2. 根據 upsert 結果判斷是否為新品 / 降價 → 推 Discord / Email

新流程加入第 1.5 步：

1.5. 對每個「本次新插入」的 SeenItem，拿 `title` 比對該 user 的啟用規則（已 cache 於 handler 開頭載入）；蒐集命中 `tagId` 集合，`SeenItemTag.createMany({ data: [...], skipDuplicates: true })`

- 只對**新插入**的 SeenItem 套用，不處理降價的既有項（既有項規則變更不回填符合 Non-Goal）
- 單次 batch 只查一次規則（`findMany({ userId, enabled: true })`）

### `/history` 頁面的 tag 篩選採 server-side filter

歷史頁目前一次載入最近 50 筆；若加 client-side filter，篩選後可能過少。改為：

- `GET /api/history?tagIds=a,b,c` 支援 `tagIds` query param
- Prisma 查詢：`where: { userId, SeenItemTag: { some: { tagId: { in: tagIds } } } }` 搭配 `groupBy` 或雙重 `every` 實現 AND 語意
- 若規則變更不回填，舊 SeenItem 可能沒有 tag；UI 顯示「未套用規則的舊商品」chip 讓使用者選擇是否顯示 untagged（預設顯示全部）

**替代方案考慮**：仍走 client-side——否決，50 筆太少，AND filter 後常常空白；且 `notification-history` spec 已允許 server-side filter 擴充。

### 規則管理 UI 用 Tag 下拉選單而非文字輸入

`TagRuleManager` 表單欄位：

- `pattern`：文字輸入（real-time 顯示 regex 編譯錯誤）
- `tag`：`<select>` 列出該 user 的 Tag（含系統預設補齊的 Tag）；不允許輸入新名稱（建立新 tag 走 `TagSelector` 或 `TagManager`）

這個限制就是 Non-Goal 中「不自動生成 Tag 名稱」的 UI 強制，避免使用者不小心用中文描述句誤建立 tag。

## Risks / Trade-offs

- **風險：正規表示式 ReDoS**。使用者 pattern 若含 catastrophic backtracking（例：`(a+)+b`）可能凍結 Node event loop。
  → **緩解**：寫入時於 Node 跑一次 `safe-regex` 或等價檢查；Worker 端套規則時以 `RE2` 套件（Google re2，線性時間）替代內建 `RegExp`。若 RE2 引入 native 依賴困難，退而求其次於 Worker 端加 `setTimeout` 斷路保護並 log 可疑規則。
- **風險：系統預設規則誤判**。例：pattern `figma` 命中「figma 二手代購徵求」。
  → **緩解**：seed 規則走保守字串（明確品牌關鍵字、日文作品原名），並於 UI 顯示「最近 7 天此規則命中 N 筆 SeenItem」讓使用者評估；`TagRuleManager` 提供快速停用切換。
- **風險：系統預設 Tag 與 user 自行建立的同名 Tag 衝突**。例：user 已有名為「模型」的 Tag，seed 想建立同名 tag。
  → **緩解**：`ensureSystemTagRules` 以 `(userId, name)` 查既有 Tag，有則重用（`upsert`），不新增重複 Tag。
- **風險：Tag 刪除導致 TagRule 失效**。Tag cascade delete 會連帶刪除 TagRule。
  → **緩解**：`TagManager` 刪除 Tag 的 AlertDialog 新增「此 Tag 目前被 N 條規則使用」警示；API 層維持 cascade 以避免孤兒規則。
- **取捨：Seed 以 TypeScript 常數 vs JSON 檔**。選 TypeScript 以獲得型別安全與 IDE 補全，代價是新增規則要重新部署。可接受。
- **取捨：規則沒有優先級 / 互斥**。一筆商品可能命中多規則 → 多 tag。可接受；符合「商品可同時屬多類型」實際語意。

## Migration Plan

1. Prisma migration `add_tag_rules`：新增 `TagRule` 表與 `SeenItemTag` 表，`SeenItem` 加反向關聯
2. 部署 Worker API：加載 `lib/system-tag-rules.ts` 常數與 `ensureSystemTagRules` helper
3. 部署前端：`/api/tag-rules` CRUD、`TagRuleManager` 元件、`/history` 篩選
4. Rollback：若規則系統出錯，可於 feature flag 處關閉 `applyAutoTags` 呼叫（或直接 revert commit）；資料表保留不影響。若需完全回退，drop `TagRule` 與 `SeenItemTag`（SeenItem 無其他異動）

## Open Questions

無。所有決策（系統規則儲存形式、regex 引擎選型、篩選採 server-side）已於 Decisions 定案。
