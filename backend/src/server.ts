import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import 'express-async-errors';

dotenv.config();

import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import { globalLimiter } from './middleware/rateLimiter.middleware';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import songsRoutes from './routes/songs.routes';
import artistsRoutes from './routes/artists.routes';
import albumsRoutes from './routes/albums.routes';
import playlistsRoutes from './routes/playlists.routes';
import favoritesRoutes from './routes/favorites.routes';
import historyRoutes from './routes/history.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import subscriptionRoutes from './routes/subscription.routes';
import adminRoutes from './routes/admin.routes';
import streamRoutes from './routes/stream.routes';

const app = express();

// ── Trust proxy (for rate limiting behind reverse proxy) ──────────────────────
app.set('trust proxy', 1);

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || '', process.env.ADMIN_URL || '']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
// Raw body for Stripe webhooks
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Compression & Logging ─────────────────────────────────────────────────────
app.use(compression());
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: process.env.npm_package_version });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stream', streamRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'File too large' });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

// ── Server Bootstrap ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000');

const bootstrap = async () => {
  await testConnection();
  await connectRedis();

  app.listen(PORT, () => {
    logger.info(`🎵 Music App API running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

bootstrap().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
