import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('staff', 'admin'), (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT r.*, u.name AS assignee_name
       FROM routing_rules r JOIN users u ON r.assigned_to = u.id
       ORDER BY r.category ASC`
    ).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { category, assigned_to } = req.body;
  if (!category || !assigned_to) {
    return res.status(400).json({ error: 'Category and assigned_to are required' });
  }
  try {
    const result = db.prepare(
      `INSERT OR REPLACE INTO routing_rules (category, assigned_to)
       VALUES (?, ?)`
    ).run(category, assigned_to);

    const row = db.prepare(
      `SELECT r.*, u.name AS assignee_name
       FROM routing_rules r JOIN users u ON r.assigned_to = u.id
       WHERE r.category = ?`
    ).get(category);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:category', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM routing_rules WHERE category = ?').run(req.params.category);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
