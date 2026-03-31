const jwt = require('jsonwebtoken');
const { db } = require('../_lib/db');

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No token');
  return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
}

const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'https://printer-image-generator.vercel.app';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const data = await db.listTemplates();
      return res.json(data);
    }

    if (req.method === 'POST') {
      const name = (req.body.name || '').trim();
      const label_data = req.body.label_data;
      if (!name || name.length > 100) return res.status(400).json({ error: 'Template name required (max 100 chars)' });
      if (!label_data || typeof label_data !== 'object') {
        return res.status(400).json({ error: 'label_data is required' });
      }
      // Accept both: flat array of labels (legacy) or { pages: [[...]] } (multi-page)
      if (Array.isArray(label_data)) {
        if (label_data.length < 1) return res.status(400).json({ error: 'label_data must not be empty' });
      } else if (!label_data.pages || !Array.isArray(label_data.pages) || label_data.pages.length < 1) {
        return res.status(400).json({ error: 'label_data must be an array or contain a pages array' });
      }
      const data = await db.createTemplate(name, label_data);
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
