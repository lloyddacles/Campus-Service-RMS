import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('staff', 'admin'), (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT t.*, u.name AS assignee_name
       FROM templates t LEFT JOIN users u ON t.auto_assign_to = u.id
       ORDER BY t.name ASC`
    ).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/public', authenticate, (_req, res) => {
  try {
    const rows = db.prepare(
      `SELECT id, name, category, title, description, priority
       FROM templates ORDER BY name ASC`
    ).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, category, title, description, priority, auto_assign_to } = req.body;
  if (!name || !category || !title || !description) {
    return res.status(400).json({ error: 'Name, category, title, and description are required' });
  }
  try {
    const result = db.prepare(
      `INSERT INTO templates (name, category, title, description, priority, auto_assign_to)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(name, category, title, description, priority || 'medium', auto_assign_to || null);

    const row = db.prepare(
      `SELECT t.*, u.name AS assignee_name
       FROM templates t LEFT JOIN users u ON t.auto_assign_to = u.id
       WHERE t.id = ?`
    ).get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
