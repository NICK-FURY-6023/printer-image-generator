/**
 * Vercel serverless function — proxy search to jaquar.com
 * GET /api/jaquar-search?q=FUS-CHR
 * Returns JSON array of { name, code, image, url }
 *
 * Smart code search: if the query looks like a product code (e.g. ALD-CHR-055N),
 * it also tries the prefix without the trailing suffix letter for better results.
 */

function parseProducts(html) {
  const products = [];
  const itemRegex = /<div class="product-item"[^>]*data-productid="(\d+)">([\s\S]*?)(?=<div class="product-item"|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/g;
  let match;

  while ((match = itemRegex.exec(html)) !== null) {
    const block = match[2];
    const id = match[1];

    const nameMatch = block.match(/<h3 class="product-title">\s*<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    const name = nameMatch ? nameMatch[1].replace(/<[^>]*>/g, '').trim() : '';

    const skuMatch = block.match(/<div class="sku">[\s\S]*?<\/span>\s*([\s\S]*?)\s*<\/div>/);
    const code = skuMatch ? skuMatch[1].trim() : '';

    const imgMatch = block.match(/<img[^>]*src="([^"]*_300\.jpeg)"/);
    const image = imgMatch ? imgMatch[1] : '';

    const urlMatch = block.match(/<a href="(\/en\/[^"]*\?Id=\d+)"/);
    const productUrl = urlMatch ? urlMatch[1] : '';

    if (name || code) {
      products.push({ id, name, code, image, url: productUrl });
    }
  }
  return products;
}

async function fetchSearch(query) {
  const url = `https://www.jaquar.com/en/search?q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
      'Accept-Language': 'en-IN,hi;q=0.9,en;q=0.8',
      'X-Forwarded-For': '103.21.125.1',
    },
  });
  return await resp.text();
}

// Detect if query looks like a Jaquar product code (e.g. FUS-CHR-29023B, ALD-CHR-055N)
function looksLikeCode(q) {
  return /^[A-Z]{2,5}-[A-Z]{2,5}/i.test(q);
}

module.exports = async (req, res) => {
  const ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);
  if (q.length > 100) return res.json([]); // prevent abuse

  try {
    const html = await fetchSearch(q);
    let products = parseProducts(html);

    // If no results and query looks like a code with trailing letter suffix,
    // retry without the suffix (e.g. ALD-CHR-055N → ALD-CHR-055)
    if (products.length === 0 && looksLikeCode(q)) {
      const stripped = q.replace(/[A-Z]$/i, '');
      if (stripped !== q && stripped.length >= 3) {
        const html2 = await fetchSearch(stripped);
        products = parseProducts(html2);
      }
    }

    // If query is a specific code, move exact/closest match to top
    if (looksLikeCode(q) && products.length > 1) {
      const upper = q.toUpperCase();
      products.sort((a, b) => {
        const aMatch = a.code.toUpperCase().startsWith(upper) ? 0 : 1;
        const bMatch = b.code.toUpperCase().startsWith(upper) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.json(products);
  } catch (err) {
    console.error('Jaquar search error:', err);
    return res.status(500).json({ error: 'Failed to search Jaquar' });
  }
};
