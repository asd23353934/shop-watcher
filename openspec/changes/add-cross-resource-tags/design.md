## Context

現有 `Keyword` 與 `CircleFollow` 皆屬於 User 的個人監控資源，但兩者之間沒有任何分類機制。當使用者追蹤的 IP、作者、系列增加時，Dashboard 與 Circles 頁面的卡片列表會線性增長，使用者無法快速定位「某個 IP 相關的所有監控」（可能同時橫跨多個關鍵字 + 多個社團）。

專案技術棧：Prisma v5 + Neon.tech PostgreSQL、Next.js 15 App Router、NextAuth.js v5。現有 API 路由已有 user ownership 驗證模式（`session.user.id` 比對 `resource.userId`），新 API 會遵循相同模式。

Worker（Python）目前只讀取 `Keyword`、`CircleFollow`、`SeenItem` 等表，不會涉及 tag 相關資料，因此 tag 系統完全在 webapp 端閉環，不需修改 Worker。

## Goals / Non-Goals

**Goals:**

- 使用者可建立、編輯、刪除個人 tag
- 一個 Keyword 或 CircleFollow 可掛多個 tag；一個 tag 可套用到多個資源
- Dashboard 與 Circles 頁面可依 tag 多選 AND 篩選
- Tag 有可選顏色欄位供視覺區分
- 建立 Keyword / Circle 時可同時建立新 tag（inline create）
- 刪除 tag 時自動解除所有關聯（不連帶刪除資源）

**Non-Goals:**

- Tag 階層（parent/child）與 tag 群組
- 跨使用者共用 / 公開 tag
- OR / NOT 等進階 filter 邏輯（首版只做 AND）
- 為 SeenItem / NotificationLog 加 tag
- Discord / Email 通知訊息內嵌 tag 資訊
- Worker 端的 tag 處理

## Decisions

### 使用 join table 而非 PostgreSQL array 欄位

Tag 與 Keyword / CircleFollow 關係使用兩張 join table（`KeywordTag`、`CircleFollowTag`），每張含 `(keywordId, tagId)` 或 `(circleFollowId, tagId)` 複合主鍵。

**理由**：

- 讓「重新命名 tag」只需改一筆 `Tag.name`，而非遍歷所有資源
- 統計「某 tag 用在幾個資源」只需 `count` join，不需 unnest array
- 支援未來新增第三種 taggable 資源（如 SeenItem）時，只加新 join table 不動既有結構
- Prisma 對 join table 有 first-class 支援（`@@id([a, b])` 複合主鍵）

**替代方案**：`Keyword.tagIds String[]` + GIN index。雖 schema 簡單，但改名困難、跨資源統計不方便，且 Prisma 對 array 欄位的關聯查詢 DX 較差。

### Tag 唯一性以 `(userId, name)` 為鍵

**理由**：標籤屬個人資源，不同使用者可同名（例如兩人都有「鬼滅」tag）。名稱採原字串比對（case-sensitive、保留空白），前端在送出前 `.trim()`，避免 `"鬼滅 "` 與 `"鬼滅"` 視為不同 tag。

### 刪除 tag 採 cascade，刪除 Keyword / Circle 亦 cascade 解除關聯

Prisma schema 用 `onDelete: Cascade` 在 join table 的兩個 FK。

**理由**：刪除 tag 不應連帶刪資源（顯然），反之亦然；但 join table 記錄在任一端消失時即應清空，cascade 最簡潔。

### Tag filter 採 client-side 過濾（首版）

後端 `GET /api/keywords` 回傳資料時一併 include tags，filter 在前端執行。

**理由**：

- 單一使用者的 keyword 數量通常 < 100，tag 數量 < 50，client-side filter 效能足夠
- 避免新增 query string 解析與 Prisma `where: { tags: { some: ... } }` 的 AND 組合複雜度
- 未來若資料量成長，可再改為 server-side 並新增 `?tagIds=a,b` query param

### Tag 色碼儲存 hex 字串，nullable

`Tag.color String?`，格式如 `"#FF5733"`。未設定則前端以預設灰色顯示。

**理由**：hex 最通用，前端可直接當 CSS 值；nullable 讓使用者不想選色時不強迫。

### 建立資源時支援 inline 建立新 tag

`POST /api/keywords` 的 `tagIds` 只接受既有 tag id。若前端想新建 tag，需先呼叫 `POST /api/tags`，拿到 id 後再帶入。

**理由**：API 語意單純、錯誤處理清晰（tag 建立失敗不會讓 keyword 建立半成品）。前端可把兩次呼叫封裝成一個 UX 流程。

**替代方案**：API 接受 `{tagIds: string[], newTags: {name, color}[]}`，後端原子建立。雖 UX 呼叫少一次，但錯誤處理與 transaction 邊界複雜，且 tag 為輕量資源、多一次 round-trip 可接受。

## Risks / Trade-offs

- **[Client-side filter 在大量資料下可能慢]** → 監控 keyword 數量 > 200 或 tag 數量 > 100 時改為 server-side filter；目前使用情境遠低於此。
- **[Tag 名稱原字串比對可能造成視覺重複]**（例：「鬼滅」「 鬼滅」）→ 前端送出前 `trim()` + 全形半形不正規化；若仍有需求，後續再加 name normalization。
- **[Migration 需新增三張表、一次改動較大]** → 單一 Prisma migration 完成，無 data backfill 需求（既有 Keyword / CircleFollow 無 tag 為合理初始狀態）；rollback 只需 `prisma migrate resolve --rolled-back` + 反向 SQL。
- **[刪除 tag 會靜默從所有資源上移除]** → UI 刪除前需顯示「此 tag 目前套用於 N 個資源，確定刪除？」確認框。
- **[使用者可能建立大量 tag 造成 UI 擠爆]** → Tag 管理頁面（首版放在設定內或 tag filter bar 展開區）需支援搜尋；首版暫不強制上限，後續視情況加。
