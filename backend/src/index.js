import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import userRoutes from './routes/users.js';
import commentRoutes from './routes/comments.js';
import attachmentRoutes from './routes/attachments.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import templateRoutes from './routes/templates.js';
import routingRoutes from './routes/routing.js';
import approvalRoutes from './routes/approvals.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Drop restrictive CSP from Express default error responses
app.use((_req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
});

app.get('/favicon.ico', (_req, res) => res.status(204).end());
app.get('/favicon.svg', (_req, res) => res.status(204).end());

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/approvals', approvalRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
