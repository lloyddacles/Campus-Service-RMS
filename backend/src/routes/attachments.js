import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// Upload attachment
router.post('/request/:requestId', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const reqRow = db.prepare('SELECT user_id FROM service_requests WHERE id = ?').get(req.params.requestId);
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    if (req.user.role === 'student' && reqRow.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = db.prepare(
      `INSERT INTO attachments (request_id, user_id, filename, original_name, mime_type, size)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      req.params.requestId, req.user.id,
      req.file.filename, req.file.originalname,
      req.file.mimetype, req.file.size
    );

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(attachment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attachments for a request
router.get('/request/:requestId', authenticate, (req, res) => {
  try {
    const reqRow = db.prepare('SELECT user_id FROM service_requests WHERE id = ?').get(req.params.requestId);
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    if (req.user.role === 'student' && reqRow.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rows = db.prepare(
      'SELECT id, request_id, user_id, original_name, mime_type, size, created_at FROM attachments WHERE request_id = ? ORDER BY created_at ASC'
    ).all(req.params.requestId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download attachment
router.get('/:id/download', authenticate, (req, res) => {
  try {
    const att = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
    if (!att) return res.status(404).json({ error: 'Not found' });

    const reqRow = db.prepare('SELECT user_id FROM service_requests WHERE id = ?').get(att.request_id);
    if (req.user.role === 'student' && reqRow.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const filePath = path.join(uploadDir, att.filename);
    res.download(filePath, att.original_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
