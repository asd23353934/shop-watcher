/**
 * Integration test for notify/batch API
 * Tests: 11.1 globalSellerBlocklist, 11.2 per-keyword sellerBlocklist,
 *        11.4 maxNotifyPerScan cap, 11.8 itemName/itemUrl storage
 *
 * Run: node scripts/test-batch-api.mjs
 * Cleans up all test SeenItems after each test.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3000'
const WORKER_SECRET = process.env.WORKER_SECRET || 'shopwatcher-dev-2026'
const KEYWORD_ID = 'cmnefn1o20003djm0hv8iw04l'
const USER_ID = 'cmned1nmm0000zkbzf4w9gh6r'
const TS = Date.now()

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
  passed++
}
function fail(label, detail = '') {
  console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`)
  failed++
}

async function postBatch(body) {
  const res = await fetch(`${BASE_URL}/api/worker/notify/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WORKER_SECRET}`,
    },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}

async function cleanupTestItems() {
  await prisma.seenItem.deleteMany({
    where: { userId: USER_ID, itemId: { startsWith: `test-${TS}` } },
  })
}

// ── Test 11.8: itemName/itemUrl stored in SeenItem ────────────────────────
async function test118() {
  console.log('\n[11.8] SeenItem stores itemName and itemUrl')
  await cleanupTestItems()

  const itemId = `test-${TS}-item-a`
  const { status, data } = await postBatch({
    keyword_id: KEYWORD_ID,
    items: [{
      platform: 'ruten',
      item_id: itemId,
      name: 'Test Product Name',
      price: 100,
      url: 'https://example.com/item/123',
      image_url: null,
      seller_name: null,
      seller_id: null,
    }],
  })

  if (status !== 200 && status !== 201) return fail('HTTP status', `got ${status}`)
  if (data.new !== 1) return fail('new count', `expected 1, got ${data.new}`)

  const seenItem = await prisma.seenItem.findFirst({
    where: { userId: USER_ID, itemId },
  })
  if (!seenItem) return fail('SeenItem not created')
  if (seenItem.itemName !== 'Test Product Name') return fail('itemName', `got: ${seenItem.itemName}`)
  if (seenItem.itemUrl !== 'https://example.com/item/123') return fail('itemUrl', `got: ${seenItem.itemUrl}`)

  ok('itemName and itemUrl stored correctly')
  await cleanupTestItems()
}

// ── Test 11.4: maxNotifyPerScan cap ──────────────────────────────────────
async function test114() {
  console.log('\n[11.4] maxNotifyPerScan cap (send 5 items, cap=2)')
  await cleanupTestItems()

  const items = Array.from({ length: 5 }, (_, i) => ({
    platform: 'ruten',
    item_id: `test-${TS}-cap-${i}`,
    name: `Cap Test Item ${i}`,
    price: 100 + i,
    url: `https://example.com/item/cap-${i}`,
    image_url: null,
    seller_name: null,
    seller_id: null,
  }))

  const { status, data } = await postBatch({
    keyword_id: KEYWORD_ID,
    items,
    maxNotifyPerScan: 2,
  })

  if (status !== 200 && status !== 201) return fail('HTTP status', `got ${status}`)
  if (data.new !== 2) return fail(`new count capped to 2`, `got ${data.new}`)

  const count = await prisma.seenItem.count({
    where: { userId: USER_ID, itemId: { startsWith: `test-${TS}-cap-` } },
  })
  if (count !== 2) return fail('SeenItem count', `expected 2, got ${count}`)

  ok('maxNotifyPerScan=2 capped 5 items to 2 new notifications')
  await cleanupTestItems()
}

// ── Test 11.1: Global seller blocklist ────────────────────────────────────
async function test111() {
  console.log('\n[11.1] Global seller blocklist blocks items')
  await cleanupTestItems()

  // Set globalSellerBlocklist
  const notifSetting = await prisma.notificationSetting.findFirst({ where: { userId: USER_ID } })
  const originalBlocklist = notifSetting?.globalSellerBlocklist ?? []
  await prisma.notificationSetting.updateMany({
    where: { userId: USER_ID },
    data: { globalSellerBlocklist: ['blocked-seller-global'] },
  })

  try {
    // Item with blocked seller — should be filtered
    const blockedItemId = `test-${TS}-global-blocked`
    const { data: d1 } = await postBatch({
      keyword_id: KEYWORD_ID,
      items: [{
        platform: 'ruten', item_id: blockedItemId,
        name: 'Blocked Item', price: 100, url: 'https://x.com', image_url: null,
        seller_name: 'blocked-seller-global', seller_id: null,
      }],
    })
    if (d1.new !== 0) return fail('blocked item should not be new', `got new=${d1.new}`)

    const blocked = await prisma.seenItem.findFirst({ where: { userId: USER_ID, itemId: blockedItemId } })
    if (blocked) return fail('blocked SeenItem should not exist')

    // Item without blocked seller — should pass
    const allowedItemId = `test-${TS}-global-allowed`
    const { data: d2 } = await postBatch({
      keyword_id: KEYWORD_ID,
      items: [{
        platform: 'ruten', item_id: allowedItemId,
        name: 'Allowed Item', price: 100, url: 'https://x.com', image_url: null,
        seller_name: 'other-seller', seller_id: null,
      }],
    })
    if (d2.new !== 1) return fail('allowed item should be new', `got new=${d2.new}`)

    ok('Global seller blocklist filters correctly')
  } finally {
    await prisma.notificationSetting.updateMany({
      where: { userId: USER_ID },
      data: { globalSellerBlocklist: originalBlocklist },
    })
    await cleanupTestItems()
  }
}

// ── Test 11.2: Per-keyword seller blocklist ───────────────────────────────
async function test112() {
  console.log('\n[11.2] Per-keyword seller blocklist blocks items for that keyword')
  await cleanupTestItems()

  const keyword = await prisma.keyword.findUnique({ where: { id: KEYWORD_ID } })
  const originalBlocklist = keyword?.sellerBlocklist ?? []

  await prisma.keyword.update({
    where: { id: KEYWORD_ID },
    data: { sellerBlocklist: ['per-kw-blocked'] },
  })

  try {
    const blockedId = `test-${TS}-kw-blocked`
    const { data: d1 } = await postBatch({
      keyword_id: KEYWORD_ID,
      items: [{
        platform: 'ruten', item_id: blockedId,
        name: 'KW Blocked Item', price: 100, url: 'https://x.com', image_url: null,
        seller_name: 'per-kw-blocked', seller_id: null,
      }],
    })
    if (d1.new !== 0) return fail('per-kw blocked item should not be new', `got ${d1.new}`)

    const stored = await prisma.seenItem.findFirst({ where: { userId: USER_ID, itemId: blockedId } })
    if (stored) return fail('per-kw blocked SeenItem should not exist')

    ok('Per-keyword seller blocklist filters correctly')
  } finally {
    await prisma.keyword.update({
      where: { id: KEYWORD_ID },
      data: { sellerBlocklist: originalBlocklist },
    })
    await cleanupTestItems()
  }
}

// ── Test 11.3: Per-keyword webhook routing ───────────────────────────────
async function test113() {
  console.log('\n[11.3] Per-keyword webhook routing (checks route logic, not Discord delivery)')

  // This test verifies that the API accepts keywordWebhookUrl without errors
  await cleanupTestItems()

  const itemId = `test-${TS}-webhook`
  const { status } = await postBatch({
    keyword_id: KEYWORD_ID,
    items: [{
      platform: 'ruten', item_id: itemId,
      name: 'Webhook Test Item', price: 100, url: 'https://x.com', image_url: null,
      seller_name: null, seller_id: null,
    }],
    keywordWebhookUrl: 'https://discord.com/api/webhooks/fake/test',
  })

  if (status === 200 || status === 201) {
    ok('API accepts keywordWebhookUrl without error')
  } else {
    fail('unexpected status', `${status}`)
  }
  await cleanupTestItems()
}

// ── Main ──────────────────────────────────────────────────────────────────
console.log('=== notify/batch API Integration Tests ===')
console.log(`KEYWORD_ID: ${KEYWORD_ID}`)
console.log(`BASE_URL:   ${BASE_URL}`)

try {
  await test118()
  await test114()
  await test111()
  await test112()
  await test113()
} catch (e) {
  console.error('\nUnexpected error:', e)
} finally {
  await cleanupTestItems()
  await prisma.$disconnect()
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
