import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all requests (with filters, search, pagination)
router.get('/', authenticate, (req, res) => {
  const { status, priority, category, search, page, limit } = req.query;
  try {
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
    if (search) {
      conditions.push('(sr.title LIKE ? OR sr.description LIKE ? OR sr.id = ?)');
      const q = `%${search}%`;
      params.push(q, q, parseInt(search) || 0);
    }

    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

    const countRow = db.prepare(`SELECT COUNT(*) AS c FROM service_requests sr${where}`).get(...params);
    const total = countRow.c;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const totalPages = Math.ceil(total / pageSize);

    const rows = db.prepare(`
      SELECT sr.*, u.name AS requester_name,
        a.name AS assigned_name
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN users a ON sr.assigned_to = a.id
      ${where}
      ORDER BY sr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, (pageNum - 1) * pageSize);

    res.json({ requests: rows, pagination: { page: pageNum, limit: pageSize, total, totalPages } });
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
    let status = 'submitted';
    if (priority === 'critical' && req.user.role === 'student') {
      status = 'pending_approval';
    }

    const result = db.prepare(
      `INSERT INTO service_requests (user_id, category, title, description, priority, location, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, category, title, description, priority || 'medium', location, status);

    const rowId = result.lastInsertRowid;

    // Auto-assign based on routing rules
    const rule = db.prepare('SELECT assigned_to FROM routing_rules WHERE category = ?').get(category);
    if (rule) {
      db.prepare('UPDATE service_requests SET assigned_to = ? WHERE id = ?').run(rule.assigned_to, rowId);
    }

    // Create approval record if pending
    if (status === 'pending_approval') {
      db.prepare(
        `INSERT INTO approvals (request_id, status) VALUES (?, 'pending')`
      ).run(rowId);
    }

    const row = db.prepare(
      `SELECT sr.*, u.name AS requester_name
       FROM service_requests sr JOIN users u ON sr.user_id = u.id
       WHERE sr.id = ?`
    ).get(rowId);
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
  const valid = ['submitted', 'in_progress', 'resolved', 'closed', 'pending_approval'];
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
    db.prepare(
      `INSERT INTO notifications (user_id, request_id, type, message)
       VALUES (?, ?, 'status', ?)`
    ).run(row.user_id, row.id, `Request status changed to ${status.replace('_', ' ')}`);
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
    if (assigned_to) {
      db.prepare(
        `INSERT INTO notifications (user_id, request_id, type, message)
         VALUES (?, ?, 'assign', ?)`
      ).run(assigned_to, row.id, `Request assigned to you`);
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
