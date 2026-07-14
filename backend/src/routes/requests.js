import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all requests (with filters)
router.get('/', authenticate, (req, res) => {
  const { status, priority, category } = req.query;
  try {
    let sql = `
      SELECT sr.*, u.name AS requester_name,
        a.name AS assigned_name
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN users a ON sr.assigned_to = a.id
    `;
    const params = [];
    const conditions = [];

    if (req.user.role === 'student') {
      conditions.push('sr.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      conditions.push('sr.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('sr.priority = ?');
      params.push(priority);
    }
    if (category) {
      conditions.push('sr.category = ?');
      params.push(category);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY sr.created_at DESC';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single request
router.get('/:id', authenticate, (req, res) => {
  try {
    const row = db.prepare(`
      SELECT sr.*, u.name AS requester_name,
        a.name AS assigned_name
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN users a ON sr.assigned_to = a.id
      WHERE sr.id = ?
    `).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Not found' });

    if (req.user.role === 'student' && row.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create request
router.post('/', authenticate, (req, res) => {
  const { category, title, description, priority, location } = req.body;
  if (!category || !title || !description) {
    return res.status(400).json({ error: 'Category, title, and description are required' });
  }
  try {
    const result = db.prepare(
      `INSERT INTO service_requests (user_id, category, title, description, priority, location)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, category, title, description, priority || 'medium', location);

    const row = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update status (admin/staff only)
router.patch('/:id/status', authenticate, (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { status } = req.body;
  const valid = ['submitted', 'in_progress', 'resolved', 'closed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
  }
  try {
    const result = db.prepare(
      `UPDATE service_requests SET status = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(status, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });

    const row = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign request (admin/staff only)
router.patch('/:id/assign', authenticate, (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { assigned_to } = req.body;
  try {
    const result = db.prepare(
      `UPDATE service_requests SET assigned_to = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(assigned_to, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });

    const row = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
