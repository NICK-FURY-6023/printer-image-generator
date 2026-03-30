/**
 * Vercel serverless function — fetch Jaquar product price from IndustryBuying
 * GET /api/jaquar-price?code=FUS-CHR-29023B
 * Returns { price, mrp, productName, source }
 *
 * Jaquar.com doesn't show prices, so we fetch from IndustryBuying.com
 * which has reliable JSON-LD Product schema with prices.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Step 1: Search IndustryBuying for the product code, get product page URL
async function findProductUrl(code) {
  const url = `https://www.industrybuying.com/search/?q=${encodeURIComponent(code)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
  const html = await resp.text();

  // Extract ItemList JSON-LD to get product URLs
  const listMatch = html.match(/\{"@context":"https:\/\/schema\.org","@type":"ItemList".*?\}\]\}/);
  if (!listMatch) return null;

  try {
    const data = JSON.parse(listMatch[0]);
    const items = data.itemListElement || [];
    if (items.length === 0) return null;

    // Find the item whose name contains the exact code
    const upperCode = code.toUpperCase();
    const exact = items.find(it => (it.name || '').toUpperCase().includes(upperCode));
    const item = exact || items[0];
    return { url: item.url, name: item.name };
  } catch {
    return null;
  }
}

// Step 2: Fetch product detail page and extract price from JSON-LD
async function fetchPrice(productUrl) {
  const resp = await fetch(productUrl, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
  const html = await resp.text();

  // Extract price from offers JSON
  const priceMatch = html.match(/"offers":\{[^}]*"price":\s*(\d+)/);
  const price = priceMatch ? parseInt(priceMatch[1], 10) : null;

  // Try to get MRP (strikethrough price)
  const mrpMatch = html.match(/₹[\s]*([\d,]+)[\s\S]{0,50}?₹[\s]*([\d,]+)/);
  let mrp = null;
  if (mrpMatch) {
    const p1 = parseInt(mrpMatch[1].replace(/,/g, ''), 10);
    const p2 = parseInt(mrpMatch[2].replace(/,/g, ''), 10);
    mrp = Math.max(p1, p2);
    if (mrp === price) mrp = null;
  }

  return { price, mrp };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const code = (req.query.code || '').trim();
  if (!code || code.length < 3) return res.json({ price: null, error: 'code param required (min 3 chars)' });

  try {
    // Find product on IndustryBuying
    const product = await findProductUrl(code);
    if (!product || !product.url) {
      return res.json({ price: null, productName: null, source: 'industrybuying', error: 'Product not found' });
    }

    // Fetch price from product detail page
    const { price, mrp } = await fetchPrice(product.url);

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.json({
      price: price ? price.toLocaleString('en-IN') : null,
      priceRaw: price,
      mrp: mrp ? mrp.toLocaleString('en-IN') : null,
      productName: product.name,
      source: 'industrybuying',
      sourceUrl: product.url,
    });
  } catch (err) {
    console.error('Price fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch price' });
  }
};
