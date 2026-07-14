import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import userRoutes from './routes/users.js';

dotenv.config();

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
