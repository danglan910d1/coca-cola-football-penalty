// UserApp/src/config/giftConfig.js — SAME LOGIC as before, shared between projects
export const GIFT_CATALOG = {
  SHARED: [
    { id: 'tui_vai_thoi_trang',          name: 'Túi Vải Coca\nthời trang',      shortName: 'Túi Vải',        totalStock: 2000, color: '#E8003D' },
    { id: 'binh_giu_nhiet',              name: 'Bình giữ nhiệt',                shortName: 'Bình giữ nhiệt', totalStock: 1000, color: '#C0392B' },
    { id: 'tui_the_thao',                name: 'Túi thể thao',                  shortName: 'Túi thể thao',   totalStock: 100,  color: '#CB4335' },
    { id: 'ly_giu_nhiet',                name: 'Ly giữ nhiệt',                  shortName: 'Ly giữ nhiệt',   totalStock: 400,  color: '#E74C3C' },
    { id: 'tshirt_red',                  name: 'T-shirt đỏ',                    shortName: 'T-shirt đỏ',     totalStock: 200,  color: '#D35400' },
    { id: 'tshirt_grey',                 name: 'T-shirt xám',                   shortName: 'T-shirt xám',    totalStock: 100,  color: '#717D7E' },
  ],
  HCM: [],
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
