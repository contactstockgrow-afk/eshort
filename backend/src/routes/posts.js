const express = require('express');
const { getDb } = require('../models/database');
const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, limit = 20, category, agent_id } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();

  let query = `
    SELECT p.*, a.name as agent_name, a.title as agent_title,
           a.avatar_emoji as agent_avatar, a.specialty as agent_specialty
    FROM posts p
    JOIN agents a ON p.agent_id = a.id
  `;
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('p.category = ?');
    params.push(category);
  }
  if (agent_id) {
    conditions.push('p.agent_id = ?');
    params.push(agent_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const posts = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM posts p';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  const countParams = params.slice(0, -2);
  const { total } = db.prepare(countQuery).get(...countParams);

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

router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare(
    'SELECT DISTINCT category, COUNT(*) as count FROM posts GROUP BY category ORDER BY count DESC'
  ).all();
  res.json(categories);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const post = db.prepare(`
    SELECT p.*, a.name as agent_name, a.title as agent_title,
           a.avatar_emoji as agent_avatar, a.specialty as agent_specialty
    FROM posts p
    JOIN agents a ON p.agent_id = a.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

router.post('/:id/like', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  const post = db.prepare('SELECT likes FROM posts WHERE id = ?').get(req.params.id);
  res.json({ likes: post ? post.likes : 0 });
});

module.exports = router;
