## Context

Tag 系統前後兩個 change（`add-cross-resource-tags` 於 2026-04-19 committed、`add-auto-tag-rules` 於 2026-04-20 committed `4397dcd`）已 merge 至 master 但尚未 archive 為 openspec/specs/。使用者實際操作後判定：

- 規則維護難以規模化（category → IP → character 三層中 character 層無法手動維護）
- 個人化抽象無使用情境（實質上只有 owner 一位使用者）
- 手動於 Keyword / Circle 掛 tag 不傳遞至 SeenItem，UI 分組價值低於維護成本

既有 SeenItem 資料會保留（只 drop tag 相關表），退出成本僅為程式碼刪除 + 單次 migration。

## Goals / Non-Goals

**Goals**

- 以最小破壞性移除整個 tag 系統，`SeenItem` / `Keyword` / `CircleFollow` 主資料不動
- 於 `/history` 提供等效或更好的篩選體驗（文字搜尋）
- 不留孤兒資料（DROP 五張 tag 相關表）
- 新功能 `q` 參數回應時間與原 tagIds filter 相近（<200ms for 30-day dataset <10k rows）

**Non-Goals**

- 不引入全文索引 extension（`pg_trgm` / `tsvector`）
- 不保留 tag 資料做未來回滾（靠 git history 即可）
- 不實作搜尋歷史、搜尋建議、搜尋高亮
- 不對 Keyword / CircleFollow 列表加入文字搜尋（本 change 只處理 `/history`）

## Decisions

### 搜尋採 Postgres `ILIKE` + 多詞 AND，不引入 full-text 索引

在 `GET /api/history` 對 `q` 做以下處理：
1. URL decode → `.trim()` → 以 `/\s+/` 切詞（空白、全形空白皆視為分隔符，需正規化為半形後 split）
2. 每個詞轉為 `{ itemName: { contains: <token>, mode: 'insensitive' } }`
3. 以 Prisma `AND` 陣列組合（多詞 AND 語意）

**理由**：
- 資料量：`cleanup.ts` 保留 30 天 SeenItem，owner 單人使用預估 < 10k 列，`ILIKE` 順序掃描 < 100ms
- 引入 `pg_trgm` 需新 migration + extension 權限，複雜度超過收益
- AND 語意符合使用者直覺（`檔案 公仔` = 同時含兩詞）

**Alternatives considered**：
- `pg_trgm` GIN 索引：效能佳但需 extension，現階段過早優化
- `tsvector` + `to_tsquery`：需處理中日文斷詞，複雜度高
- 前端 client-side filter：需先取得全部資料，頁面 50 筆分頁下不可行

### DROP TABLE 走新 migration，不逆向 prisma migrate resolve

新 migration `<ts>_remove_tag_system` 內容：
```sql
DROP TABLE IF EXISTS "SeenItemTag" CASCADE;
DROP TABLE IF EXISTS "TagRule" CASCADE;
DROP TABLE IF EXISTS "KeywordTag" CASCADE;
DROP TABLE IF EXISTS "CircleFollowTag" CASCADE;
DROP TABLE IF EXISTS "Tag" CASCADE;
```

**理由**：
- Prisma migration 採 append-only，不允許刪除歷史 migration 檔
- `CASCADE` 同時清 FK 與 index，不留殘留物件
- `IF EXISTS` 使 migration 可在 dev DB（可能已手動處理過）與 prod DB（完整狀態）皆 idempotent

**Alternatives considered**：
- `prisma migrate reset`：會清空整個 DB，production 不可接受
- 手動 SQL 執行後 `prisma migrate resolve`：操作流程複雜且 error-prone

### Spectra in-progress changes 保留不歸檔、從此 change 併入 archive 時一併清理

`add-cross-resource-tags` 與 `add-auto-tag-rules` 目錄保留在 `openspec/changes/`，直到本 change 歸檔（`spectra archive remove-tag-system-use-search`）時一併以 `spectra archive` 命令處理或手動刪除。

**理由**：
- 歸檔代表「能力進入 specs/」。若先歸檔 tag 兩個 change 產生 `resource-tagging` / `auto-item-tagging` 兩個 spec，本 change 還要寫 REMOVED requirements 再歸檔，多一層繞路
- 直接丟棄 in-progress 目錄符合「這些能力從未穩定」的實情

**Alternatives considered**：
- 先歸檔 tag 兩個 change 再 archive 此 change：語意較完整但額外工作量 > 收益
- 保留 tag 兩個 change 永久不歸檔：造成 `spectra list` 永久噪音

### 前端搜尋輸入 debounce 300ms

`/history` 頁面搜尋框 `onChange` 後以 300ms setTimeout 延遲觸發 refetch；每次新輸入重置 timer。

**理由**：
- 避免每個按鍵打一次 API
- 300ms 是使用者可感知但不妨礙連續輸入的閾值
- 搭配 URLSearchParams 更新（非必要）確保 back button 可回到上一次搜尋狀態

**Alternatives considered**：
- 送出按鈕觸發：UX 差，需多一次點擊
- 無 debounce 即時送出：浪費 API 呼叫

## Risks / Trade-offs

- **失去視覺化分類瀏覽** → 使用者改以關鍵字搜尋替代，`/history` 既有 keyword / platform filter 仍保留
- **`ILIKE` 效能隨資料量線性劣化** → 30 天 retention 上限約束資料量；若未來跨越 50k 列再導入 `pg_trgm`
- **既有 SeenItemTag / Tag / TagRule 資料遺失** → 接受，這些資料僅反映被移除的功能；需移除前 `git push` 以保留 commit 歷史作為唯一回溯路徑
- **同義詞需使用者自己輸入**（例：`蔚藍檔案` 與 `ブルアカ` 搜尋結果不同） → 接受為設計取捨；Tag 系統試圖解決這個但成本過高

## Migration Plan

1. **開發環境**：執行 `pnpm prisma migrate dev --name remove_tag_system`，Prisma 自動偵測 schema model 刪除並產生 DROP statements；檢查產出的 SQL，替換為本 design 指定的顯式 `DROP TABLE IF EXISTS ... CASCADE` 語法以確保 prod idempotent
2. **部署前**：Vercel `prisma migrate deploy` 自動套用；DROP 操作不阻塞既有讀取（其他表不受影響）
3. **Rollback 策略**：`git revert <本 change 的 merge commit>` + 手動在 DB 重新執行 `add-cross-resource-tags` 與 `add-auto-tag-rules` 的 migration SQL（保留於 git 歷史）。已接受 tag 資料不可回填

## Open Questions

無。既有設計決策已涵蓋所有實作路徑。
