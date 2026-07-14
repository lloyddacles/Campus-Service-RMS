import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Get pending approvals
router.get('/pending', authenticate, authorize('staff', 'admin'), (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT sr.*, u.name AS requester_name, a.id AS approval_id
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN approvals a ON a.request_id = sr.id AND a.status = 'pending'
      WHERE sr.status = 'pending_approval'
      ORDER BY sr.created_at ASC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve or reject a request
router.patch('/:id/review', authenticate, authorize('staff', 'admin'), (req, res) => {
  const { action, notes } = req.body;
  if (!action || !['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "approved" or "rejected"' });
  }

  try {
    const reqRow = db.prepare("SELECT * FROM service_requests WHERE id = ? AND status = 'pending_approval'").get(req.params.id);
    if (!reqRow) return res.status(404).json({ error: 'Request not found or not pending approval' });

    const newStatus = action === 'approved' ? 'submitted' : 'closed';
    db.prepare(
      `UPDATE service_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(newStatus, req.params.id);

    // Upsert approval record
    const existing = db.prepare('SELECT id FROM approvals WHERE request_id = ?').get(req.params.id);
    if (existing) {
      db.prepare(
        `UPDATE approvals SET status = ?, reviewed_by = ?, notes = ?, reviewed_at = datetime('now') WHERE id = ?`
      ).run(action, req.user.id, notes || null, existing.id);
    } else {
      db.prepare(
        `INSERT INTO approvals (request_id, reviewed_by, status, notes, reviewed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).run(req.params.id, req.user.id, action, notes || null);
    }

    db.prepare(
      `INSERT INTO notifications (user_id, request_id, type, message)
       VALUES (?, ?, 'approval', ?)`
    ).run(reqRow.user_id, req.params.id,
      action === 'approved' ? 'Your request has been approved' : 'Your request was not approved');

    const updated = db.prepare(
      `SELECT sr.*, u.name AS requester_name
       FROM service_requests sr JOIN users u ON sr.user_id = u.id
       WHERE sr.id = ?`
    ).get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
