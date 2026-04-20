export interface SystemTagRuleSeed {
  tagName: string
  pattern: string
  color?: string
}

export const SYSTEM_TAG_RULES: SystemTagRuleSeed[] = [
  { tagName: '模型', pattern: 'figma|figuarts|s\\.h\\.figuarts|mafex|revoltech', color: '#818cf8' },
  { tagName: '模型', pattern: '1/(?:4|6|7|8)\\b', color: '#818cf8' },
  { tagName: '模型', pattern: 'pvc|scale figure|スケール', color: '#818cf8' },
  { tagName: '盒玩', pattern: 'nendoroid|ねんどろいど|黏土人', color: '#f472b6' },
  { tagName: '盒玩', pattern: 'cu-poche|キューポッシュ', color: '#f472b6' },
  { tagName: '周邊', pattern: '壓克力|アクリル|acrylic', color: '#fbbf24' },
  { tagName: '周邊', pattern: '徽章|缶バッジ|can badge', color: '#fbbf24' },
  { tagName: '周邊', pattern: '鑰匙圈|キーホルダー|keychain|keyring', color: '#fbbf24' },
  { tagName: '周邊', pattern: '吊飾|ストラップ|strap|charm', color: '#fbbf24' },
  { tagName: '同人誌', pattern: '同人誌|同人本|doujin', color: '#fb7185' },
  { tagName: '同人誌', pattern: 'c\\d{3}\\b|コミケ|comiket', color: '#fb7185' },
  { tagName: 'CD', pattern: '\\bcd\\b|album|single|サウンドトラック|soundtrack|ost', color: '#60a5fa' },
  { tagName: '藍光', pattern: 'blu-?ray|bd-?box|blueray', color: '#38bdf8' },
  { tagName: '藍光', pattern: 'dvd(?:-?box)?\\b', color: '#38bdf8' },
  { tagName: '畫集', pattern: '畫集|画集|art ?book|art works', color: '#a78bfa' },
  { tagName: '初音', pattern: '初音ミク|初音 ミク|hatsune miku|miku', color: '#22d3ee' },
  { tagName: '鏡音', pattern: '鏡音|kagamine' , color: '#facc15' },
  { tagName: '巡音', pattern: '巡音|megurine|ルカ', color: '#ec4899' },
  { tagName: 'IA', pattern: '\\bia\\b(?:\\s*-?\\s*aria)?', color: '#f97316' },
  { tagName: '重音テト', pattern: '重音テト|kasane teto', color: '#ef4444' },
  { tagName: 'Fate', pattern: 'fate/|fgo|fate\\s*grand\\s*order|fate/stay', color: '#1e40af' },
  { tagName: '原神', pattern: '原神|genshin', color: '#10b981' },
  { tagName: '崩壞', pattern: '崩壊|崩坏|honkai', color: '#9333ea' },
  { tagName: 'ホロライブ', pattern: 'hololive|ホロライブ', color: '#06b6d4' },
  { tagName: 'にじさんじ', pattern: 'にじさんじ|nijisanji', color: '#84cc16' },
  { tagName: '寶可夢', pattern: 'pokemon|ポケモン|寶可夢|宝可梦', color: '#eab308' },
  { tagName: '鋼彈', pattern: 'gundam|ガンダム|鋼彈|高達', color: '#dc2626' },
  { tagName: '海賊王', pattern: 'one piece|ワンピース|海賊王|航海王', color: '#f59e0b' },
  { tagName: '進擊的巨人', pattern: '進撃の巨人|進擊的巨人|attack on titan|aot', color: '#78716c' },
  { tagName: '鬼滅', pattern: '鬼滅|鬼灭|demon slayer|kimetsu', color: '#16a34a' },
]
