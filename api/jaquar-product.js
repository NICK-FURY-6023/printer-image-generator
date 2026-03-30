/**
 * Vercel serverless function — fetch single product detail from jaquar.com
 * GET /api/jaquar-product?url=/en/ald-chr-193?Id=290
 * Returns { name, code, description, image, range, price, priceRaw }
 *
 * Uses X-Forwarded-For with Indian IP so Jaquar returns MRP in the HTML
 * (prices are geo-restricted to India).
 */
module.exports = async (req, res) => {
  const ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const productUrl = (req.query.url || '').trim();
  if (!productUrl) return res.status(400).json({ error: 'url param required' });
  // SSRF protection: only allow jaquar.com paths
  if (!productUrl.startsWith('/en/') && !productUrl.startsWith('/in/')) {
    return res.status(400).json({ error: 'Invalid product URL — must be a jaquar.com path' });
  }

  try {
    const fullUrl = `https://www.jaquar.com${productUrl}`;
    const resp = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-IN,hi;q=0.9,en;q=0.8',
        'X-Forwarded-For': '103.21.125.1',
      },
    });
    const html = await resp.text();

    // Extract product name
    const nameMatch = html.match(/<h1[^>]*itemprop="name">(.*?)<\/h1>/);
    const name = nameMatch ? nameMatch[1].trim() : '';

    // Extract SKU/code
    const skuMatch = html.match(/id="sku-\d+">(.*?)<\/div>/);
    const code = skuMatch ? skuMatch[1].trim() : '';

    // Extract description
    const descMatch = html.match(/itemprop="description">([\s\S]*?)<\/div>/);
    let description = descMatch ? descMatch[1].trim() : '';
    description = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    // Extract range
    const rangeMatch = html.match(/id="product-range-\d+">(.*?)<\/div>/);
    const range = rangeMatch ? rangeMatch[1].trim() : '';

    // Extract high-res image
    const imgMatch = html.match(/id="main-product-img-\d+"[^>]*src="([^"]*)"/);
    const image = imgMatch ? imgMatch[1] : '';

    // Extract MRP price (geo-restricted to India — we spoof Indian IP)
    let price = null;
    let priceRaw = null;
    const priceMatch = html.match(/class="price-value-\d+"[^>]*content="([\d.]+)"[^>]*>\s*([\s\S]*?)<\/span>/);
    if (priceMatch) {
      priceRaw = parseFloat(priceMatch[1]);
      const priceText = priceMatch[2].replace(/[^\d.,₹\s]/g, '').trim();
      price = priceText || `₹ ${priceRaw.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.json({ name, code, description, range, image, price, priceRaw });
  } catch (err) {
    console.error('Jaquar product error:', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
};
