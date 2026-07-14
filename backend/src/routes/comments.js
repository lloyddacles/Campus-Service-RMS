import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get comments for a request
router.get('/request/:requestId', authenticate, (req, res) => {
  try {
    const reqRow = db.prepare('SELECT user_id FROM service_requests WHERE id = ?').get(req.params.requestId);
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    if (req.user.role === 'student' && reqRow.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let sql = `SELECT c.*, u.name AS user_name, u.role AS user_role
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.request_id = ?`;
    const params = [req.params.requestId];

    // Students can't see internal comments
    if (req.user.role === 'student') {
      sql += ' AND c.is_internal = 0';
    }

    sql += ' ORDER BY c.created_at ASC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment
router.post('/request/:requestId', authenticate, (req, res) => {
  const { content, is_internal } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const reqRow = db.prepare('SELECT user_id FROM service_requests WHERE id = ?').get(req.params.requestId);
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    if (req.user.role === 'student' && reqRow.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'student' && is_internal) {
      return res.status(403).json({ error: 'Students cannot add internal notes' });
    }

    const result = db.prepare(
      `INSERT INTO comments (request_id, user_id, content, is_internal)
       VALUES (?, ?, ?, ?)`
    ).run(req.params.requestId, req.user.id, content, is_internal ? 1 : 0);

    const comment = db.prepare(
      `SELECT c.*, u.name AS user_name, u.role AS user_role
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    ).get(result.lastInsertRowid);

    // Notify request owner about new comment
    const owner = db.prepare('SELECT user_id FROM service_requests WHERE id = ?').get(req.params.requestId);
    if (owner.user_id !== req.user.id) {
      db.prepare(
        `INSERT INTO notifications (user_id, request_id, type, message)
         VALUES (?, ?, 'comment', ?)`
      ).run(owner.user_id, req.params.requestId, `New comment on your request`);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
