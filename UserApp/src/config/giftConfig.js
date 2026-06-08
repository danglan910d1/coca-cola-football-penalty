// UserApp/src/config/giftConfig.js — SAME LOGIC as before, shared between projects
export const GIFT_CATALOG = {
  SHARED: [
    { id: 'tote_bag_large',  name: 'Tote Bag',          shortName: 'Tote Bag',    totalStock: 1500, color: '#E8003D' },
    { id: 'aluminum_bottle', name: 'Bình Nhôm\nCoca-Cola', shortName: 'Bình Nhôm', totalStock: 1000, color: '#C0392B' },
    { id: 'tumbler',         name: 'Ly Tumbler',         shortName: 'Tumbler',     totalStock: 400,  color: '#CB4335' },
    { id: 'tote_bag_noodle', name: 'Tote Bag\nTô Mì',   shortName: 'Tote Mì',    totalStock: 200,  color: '#E74C3C' },
    { id: 'sport_bag',       name: 'Túi Thể Thao',      shortName: 'Sport Bag',   totalStock: 100,  color: '#922B21' },
  ],
  HCM: [
    { id: 'tote_bag_agency', name: 'Túi Tote\nAgency',  shortName: 'Tote Agency', totalStock: 500,  color: '#D35400' },
    { id: 'tshirt_red',      name: 'T-Shirt Đỏ',        shortName: 'Áo Đỏ',      totalStock: 200,  color: '#E8003D' },
    { id: 'tshirt_grey',     name: 'T-Shirt Xám',       shortName: 'Áo Xám',     totalStock: 100,  color: '#717D7E' },
  ],
  HN: [],
};

export function getAvailableGifts(location, stockData = null) {
  const pool = [...GIFT_CATALOG.SHARED, ...(GIFT_CATALOG[location] ?? [])];
  const withStock = pool.map(g => ({
    ...g,
    currentStock: stockData ? (stockData[g.id] ?? 0) : g.totalStock,
  }));
  const available = withStock.filter(g => g.currentStock > 0);
  if (!available.length) return [];
  const total = available.reduce((s, g) => s + g.currentStock, 0);
  return available.map(g => ({
    ...g,
    probability: g.currentStock / total,
    probabilityPercent: Number(((g.currentStock / total) * 100).toFixed(1)),
  }));
}

export function spinWheel(gifts) {
  if (!gifts?.length) return null;
  const rand = Math.random();
  let cum = 0;
  for (const g of gifts) { cum += g.probability; if (rand <= cum) return g; }
  return gifts[gifts.length - 1];
}
