const jwt = require('jsonwebtoken');
const { db } = require('../_lib/db');

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No token');
  return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
}

const ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const data = await db.getTemplate(id);
      return res.json(data);
    }

    if (req.method === 'PUT') {
      const name = (req.body.name || '').trim();
      const label_data = req.body.label_data;
      if (!name || name.length > 100) return res.status(400).json({ error: 'Template name required (max 100 chars)' });
      if (label_data !== undefined && (!Array.isArray(label_data) || label_data.length < 1 || label_data.length > 12)) {
        return res.status(400).json({ error: 'label_data must be array of 1-12 labels' });
      }
      const data = await db.updateTemplate(id, name, label_data);
      return res.json(data);
    }

    if (req.method === 'DELETE') {
      await db.deleteTemplate(id);
      return res.status(204).end();
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.message === 'Not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
};
