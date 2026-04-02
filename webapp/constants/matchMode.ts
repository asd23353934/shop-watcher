export const MATCH_MODE_LABELS: Record<string, string> = {
  any: '寬鬆 — 含任一關鍵詞即通知',
  all: '嚴格 — 每個詞都必須出現',
  exact: '完整比對 — 名稱須包含完整字串',
}

export const MATCH_MODE_EXAMPLES: Record<string, string> = {
  any: '關鍵字「機械 鍵盤」→ 商品名含「機械」或「鍵盤」任一詞即通知，範圍較廣',
  all: '關鍵字「機械 鍵盤」→ 商品名必須同時含「機械」和「鍵盤」，過濾不相關商品',
  exact: '關鍵字「機械鍵盤」→ 商品名必須包含「機械鍵盤」這段完整字串，最精確',
}

export const MATCH_MODE_BADGE_LABELS: Record<string, string> = {
  any: '寬鬆',
  all: '嚴格',
  exact: '完整比對',
}
