/**
 * Vercel serverless function — proxy external images to bypass CORS
 * GET /api/image-proxy?url=https://www.jaquar.com/images/thumbs/...
 * Returns the image binary with proper content-type
 *
 * Only allows jaquar.com image URLs to prevent abuse.
 */
module.exports = async (req, res) => {
  const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'https://printer-image-generator.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const url = (req.query.url || '').trim();
  if (!url) return res.status(400).json({ error: 'url param required' });

  // Only allow jaquar.com images
  if (!url.startsWith('https://www.jaquar.com/')) {
    return res.status(403).json({ error: 'Only jaquar.com image URLs allowed' });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
    });
    if (!resp.ok) return res.status(502).json({ error: `Upstream returned HTTP ${resp.status}` });

    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await resp.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=2592000');
    return res.send(buffer);
  } catch (err) {
    console.error('Image proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
};
