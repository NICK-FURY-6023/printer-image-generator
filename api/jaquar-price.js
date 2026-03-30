/**
 * Vercel serverless function — fetch Jaquar product MRP from jaquar.com
 * GET /api/jaquar-price?code=ALD-CHR-079N
 * Returns { price, priceRaw, productName, source }
 *
 * Prices on jaquar.com are geo-restricted to Indian IPs.
 * We spoof an Indian IP via X-Forwarded-For to get the MRP.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const INDIA_IP = '103.21.125.1';

async function fetchPriceFromJaquar(code) {
  // Use Jaquar search to find the product page
  const searchUrl = `https://www.jaquar.com/en/search?q=${encodeURIComponent(code)}`;
  const searchResp = await fetch(searchUrl, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html',
      'Accept-Language': 'en-IN,hi;q=0.9,en;q=0.8',
      'X-Forwarded-For': INDIA_IP,
    },
  });
  const searchHtml = await searchResp.text();

  // Find product URL from search results
  const linkPattern = /class="product-title"[^>]*>\s*<a[^>]*href="([^"]*\?Id=\d+)"/g;
  const codePattern = /class="product-sku"[^>]*>([^<]*)/g;
  const namePattern = /class="product-title"[^>]*>\s*<a[^>]*>([^<]*)/g;

  let productUrl = null;
  let productName = null;
  const upperCode = code.toUpperCase().replace(/[-\s]/g, '');

  let linkMatch, codeMatch, nameMatch;
  while ((linkMatch = linkPattern.exec(searchHtml)) !== null) {
    codeMatch = codePattern.exec(searchHtml);
    nameMatch = namePattern.exec(searchHtml);
    const foundCode = codeMatch ? codeMatch[1].trim().toUpperCase().replace(/[-\s]/g, '') : '';
    if (foundCode === upperCode || foundCode.includes(upperCode)) {
      productUrl = linkMatch[1];
      productName = nameMatch ? nameMatch[1].trim() : '';
      break;
    }
  }

  // Fallback: just use the first result
  if (!productUrl) {
    const firstLink = searchHtml.match(/class="product-title"[^>]*>\s*<a[^>]*href="([^"]*\?Id=\d+)"/);
    const firstName = searchHtml.match(/class="product-title"[^>]*>\s*<a[^>]*>([^<]*)/);
    if (firstLink) {
      productUrl = firstLink[1];
      productName = firstName ? firstName[1].trim() : '';
    }
  }

  if (!productUrl) return null;

  // Fetch the product page with Indian IP to get MRP
  const fullUrl = `https://www.jaquar.com${productUrl}`;
  const prodResp = await fetch(fullUrl, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html',
      'Accept-Language': 'en-IN,hi;q=0.9,en;q=0.8',
      'X-Forwarded-For': INDIA_IP,
    },
  });
  const prodHtml = await prodResp.text();

  // Extract MRP from price-value span: content="4400.00"
  const priceMatch = prodHtml.match(/class="price-value-\d+"[^>]*content="([\d.]+)"/);
  if (!priceMatch) return { productName, productUrl: fullUrl, price: null, priceRaw: null };

  const priceRaw = parseFloat(priceMatch[1]);
  const price = priceRaw.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Get name from product page if not found in search
  if (!productName) {
    const nm = prodHtml.match(/<h1[^>]*itemprop="name">(.*?)<\/h1>/);
    productName = nm ? nm[1].trim() : '';
  }

  return { productName, productUrl: fullUrl, price, priceRaw };
}

module.exports = async (req, res) => {
  const ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const code = (req.query.code || '').trim();
  if (!code || code.length < 3) return res.json({ price: null, error: 'code param required (min 3 chars)' });

  try {
    const result = await fetchPriceFromJaquar(code);
    if (!result || !result.price) {
      return res.json({ price: null, productName: null, source: 'jaquar.com', error: 'Price not found' });
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.json({
      price: result.price,
      priceRaw: result.priceRaw,
      productName: result.productName,
      source: 'jaquar.com',
      sourceUrl: result.productUrl,
    });
  } catch (err) {
    console.error('Price fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch price' });
  }
};
