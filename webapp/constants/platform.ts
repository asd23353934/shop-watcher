export const TAIWAN_PLATFORMS = ['ruten', 'pchome', 'momo', 'animate', 'yahoo-auction', 'myacg', 'kingstone']
export const JAPAN_PLATFORMS  = ['mandarake', 'melonbooks', 'toranoana', 'booth', 'dlsite']

export const PLATFORM_LABELS: Record<string, string> = {
  ruten: '露天',
  pchome: 'PChome 24h',
  momo: 'MOMO購物',
  animate: 'Animate台灣',
  'yahoo-auction': 'Yahoo拍賣',
  mandarake: 'Mandarake',
  myacg: '買動漫',
  kingstone: '金石堂 ACG',
  booth: 'BOOTH',
  dlsite: 'DLsite',
  toranoana: 'Toranoana',
  melonbooks: 'Melonbooks',
}

export const PLATFORM_SEARCH_URL: Record<string, (keyword: string) => string> = {
  ruten:          (kw) => `https://www.ruten.com.tw/find/?q=${encodeURIComponent(kw)}`,
  pchome:         (kw) => `https://24h.pchome.com.tw/search/?q=${encodeURIComponent(kw)}`,
  momo:           (kw) => `https://www.momoshop.com.tw/search/${encodeURIComponent(kw)}`,
  animate:        (kw) => `https://www.animate-onlineshop.com.tw/Form/Product/ProductList.aspx?KeyWord=${encodeURIComponent(kw)}`,
  'yahoo-auction':(kw) => `https://tw.bid.yahoo.com/search/auction/product?p=${encodeURIComponent(kw)}`,
  mandarake:      (kw) => `https://order.mandarake.co.jp/order/listPage/list?keyword=${encodeURIComponent(kw)}&lang=en`,
  myacg:          (kw) => `https://www.myacg.com.tw/goods_list_show.php?keyword=${encodeURIComponent(kw)}`,
  kingstone:      (kw) => `https://www.kingstone.com.tw/search/key/${encodeURIComponent(kw)}/lid/search`,
  booth:          (kw) => `https://booth.pm/zh-tw/search/${encodeURIComponent(kw)}?sort=new_arrival`,
  dlsite:         (kw) => `https://www.dlsite.com/maniax/fsr/=/keyword/${encodeURIComponent(kw)}/order/release_d.html`,
  toranoana:      (kw) => `https://ecs.toranoana.jp/tora/ec/app/catalog/list?searchWord=${encodeURIComponent(kw)}&sort=newitem`,
  melonbooks:     (kw) => `https://www.melonbooks.co.jp/search/search.php?search_all=${encodeURIComponent(kw)}`,
  shopee:         (kw) => `https://shopee.tw/search?keyword=${encodeURIComponent(kw)}`,
}

export const PLATFORM_BADGE_CLASS: Record<string, string> = {
  ruten: 'text-blue-700 border-blue-300',
  pchome: 'text-red-700 border-red-300',
  momo: 'text-orange-700 border-orange-300',
  animate: 'text-sky-700 border-sky-300',
  'yahoo-auction': 'text-purple-700 border-purple-300',
  mandarake: 'text-amber-800 border-amber-300',
  myacg: 'text-pink-700 border-pink-300',
  kingstone: 'text-green-700 border-green-300',
  booth: 'text-rose-700 border-rose-300',
  dlsite: 'text-indigo-700 border-indigo-300',
  toranoana: 'text-yellow-700 border-yellow-300',
  melonbooks: 'text-teal-700 border-teal-300',
}
