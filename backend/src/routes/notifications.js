import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get unread count
router.get('/unread-count', authenticate, (req, res) => {
  try {
    const row = db.prepare(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.user.id);
    res.json({ count: row.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notifications for current user
router.get('/', authenticate, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT n.*, sr.title AS request_title
       FROM notifications n
       LEFT JOIN service_requests sr ON n.request_id = sr.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`
    ).all(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark as read
router.patch('/:id/read', authenticate, (req, res) => {
  try {
    const result = db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all as read
router.patch('/read-all', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
