import { Router } from 'express';
import db from '../db/pool.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('staff', 'admin'), (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) AS c FROM service_requests').get();
    const byStatus = db.prepare(
      `SELECT status, COUNT(*) AS count FROM service_requests GROUP BY status`
    ).all();
    const byPriority = db.prepare(
      `SELECT priority, COUNT(*) AS count FROM service_requests GROUP BY priority`
    ).all();
    const byCategory = db.prepare(
      `SELECT category, COUNT(*) AS count FROM service_requests GROUP BY category ORDER BY count DESC`
    ).all();

    const resolved = db.prepare(
      `SELECT AVG(
        (julianday(updated_at) - julianday(created_at)) * 24
      ) AS avg_hours FROM service_requests WHERE status IN ('resolved', 'closed')`
    ).get();

    const weekly = db.prepare(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM service_requests
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY day ORDER BY day ASC
    `).all();

    res.json({
      total: total.c,
      byStatus,
      byPriority,
      byCategory,
      avgResolutionHours: Math.round(resolved.avg_hours || 0),
      weekly,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
