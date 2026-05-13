const express = require('express');
const { getDb } = require('../models/database');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const agents = db.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM posts WHERE agent_id = a.id) as post_count
    FROM agents a
    WHERE a.is_active = 1
    ORDER BY a.created_at
  `).all();
  res.json(agents);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const agent = db.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM posts WHERE agent_id = a.id) as post_count
    FROM agents a
    WHERE a.id = ?
  `).get(req.params.id);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

router.get('/:id/posts', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();

  const posts = db.prepare(`
    SELECT p.*, a.name as agent_name, a.title as agent_title,
           a.avatar_emoji as agent_avatar
    FROM posts p
    JOIN agents a ON p.agent_id = a.id
    WHERE p.agent_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.id, parseInt(limit), offset);

  const { total } = db.prepare(
    'SELECT COUNT(*) as total FROM posts WHERE agent_id = ?'
  ).get(req.params.id);

  res.json({
    posts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

module.exports = router;
