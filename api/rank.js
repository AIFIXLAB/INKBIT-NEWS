// Live rankings from OpenSea for every Inkbit collection.
// Needs OPENSEA_API_KEY in Vercel environment variables (never put the key in a file).
// Cached on Vercel's edge for 10 minutes so the API is called at most ~6 times an hour.
const COLLS = [
  ['apes', 'Inkbit Apes', 'inkbit-apes'], ['cards', 'Inkbit Press Cards', 'inkbit-press-cards'], ['world', 'Inkbit World', 'inkbit-world'],
  ['pets', 'Inkbit Pets', 'inkbit-pets'], ['zombies', 'Inkbit Zombie Punks', 'inkbit-zombie-punks'], ['wild', 'Inkbit Wild Ones', 'inkbit-wild-ones'],
  ['brokers', 'Inkbit Brokers', 'inkbit-brokers'],
];
const API = 'https://api.opensea.io/api/v2';

async function get(path, key) {
  const r = await fetch(API + path, { headers: { 'x-api-key': key, accept: 'application/json' } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
const amount = p => p && p.quantity ? Number(p.quantity) / 10 ** (p.decimals ?? 18) : 0;

async function one([key, name, slug], apiKey) {
  const out = { key, name, slug };
  try {
    const s = await get(`/collections/${slug}/stats`, apiKey);
    const d = (s.intervals || []).find(i => i.interval === 'one_day') || {};
    Object.assign(out, { floor: s.total?.floor_price ?? null, symbol: s.total?.floor_price_symbol || 'ETH', owners: s.total?.num_owners ?? null,
      volume: s.total?.volume ?? 0, sales: s.total?.sales ?? 0, volume_1d: d.volume ?? 0, sales_1d: d.sales ?? 0, change_1d: d.volume_change ?? null });
  } catch (e) { out.error = 'stats ' + e.message; }
  try {
    const ev = await get(`/events/collection/${slug}?event_type=sale&limit=50`, apiKey);
    const sales = (ev.asset_events || []).map(e => ({ id: e.nft?.identifier, image: e.nft?.display_image_url || e.nft?.image_url || '', price: amount(e.payment),
      symbol: e.payment?.symbol || 'ETH', buyer: e.buyer, when: e.event_timestamp, coll: key }));
    out.sales_recent = sales;
    out.top_sale = sales.slice().sort((a, b) => b.price - a.price)[0] || null;
    const by = {};
    for (const x of sales) if (x.buyer) { by[x.buyer] = by[x.buyer] || { address: x.buyer, buys: 0, spent: 0 }; by[x.buyer].buys++; by[x.buyer].spent += x.price; }
    out.buyers = Object.values(by).sort((a, b) => b.buys - a.buys || b.spent - a.spent).slice(0, 5);
  } catch (e) { out.sales_recent = []; out.buyers = []; out.top_sale = null; out.error = (out.error ? out.error + ', ' : '') + 'events ' + e.message; }
  return out;
}

module.exports = async (req, res) => {
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) { res.setHeader('Cache-Control', 'no-store'); return res.status(503).json({ error: 'OPENSEA_API_KEY is not set' }); }
  const cols = await Promise.all(COLLS.map(c => one(c, apiKey)));
  const allSales = cols.flatMap(c => (c.sales_recent || []).map(s => ({ ...s, name: c.name })));
  const hot = allSales.sort((a, b) => b.price - a.price).slice(0, 10);
  const by = {};
  for (const s of cols.flatMap(c => c.sales_recent || [])) if (s.buyer) {
    const b = (by[s.buyer] = by[s.buyer] || { address: s.buyer, buys: 0, spent: 0, colls: new Set() }); b.buys++; b.spent += s.price; b.colls.add(s.coll);
  }
  const buyers = Object.values(by).map(b => ({ ...b, colls: [...b.colls] })).sort((a, b) => b.buys - a.buys || b.spent - a.spent).slice(0, 10);
  for (const c of cols) delete c.sales_recent;
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  return res.status(200).json({ updated: new Date().toISOString(), collections: cols, hot, buyers });
};
