/**
 * Vercel serverless function — proxy search to jaquar.com
 * GET /api/jaquar-search?q=concealed+body
 * Returns JSON array of { name, code, image, url }
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  try {
    const url = `https://www.jaquar.com/en/search?q=${encodeURIComponent(q)}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    const html = await resp.text();

    // Parse product items from search results HTML
    const products = [];
    const itemRegex = /<div class="product-item"[^>]*data-productid="(\d+)">([\s\S]*?)(?=<div class="product-item"|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/g;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
      const block = match[2];
      const id = match[1];

      // Extract product name
      const nameMatch = block.match(/<h3 class="product-title">\s*<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
      const name = nameMatch ? nameMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      // Extract code/SKU
      const skuMatch = block.match(/<div class="sku">[\s\S]*?<\/span>\s*([\s\S]*?)\s*<\/div>/);
      const code = skuMatch ? skuMatch[1].trim() : '';

      // Extract image
      const imgMatch = block.match(/<img[^>]*src="([^"]*_300\.jpeg)"/);
      const image = imgMatch ? imgMatch[1] : '';

      // Extract product URL
      const urlMatch = block.match(/<a href="(\/en\/[^"]*\?Id=\d+)"/);
      const productUrl = urlMatch ? urlMatch[1] : '';

      if (name || code) {
        products.push({ id, name, code, image, url: productUrl });
      }
    }

    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.json(products);
  } catch (err) {
    console.error('Jaquar search error:', err);
    return res.status(500).json({ error: 'Failed to search Jaquar' });
  }
};
