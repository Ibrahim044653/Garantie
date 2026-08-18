import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { logger } from './services/logger';
import { authRouter } from './routes/auth.routes';
import { hypothequeRouter } from './routes/hypotheque.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { reportingRouter } from './routes/reporting.routes';
import { userRouter } from './routes/user.routes';
import { generateAlerts } from './services/alert.service';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o.trim()))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/hypotheques', hypothequeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reporting', reportingRouter);
app.use('/api/users', userRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);

  // Run alert generation at startup
  try {
    await generateAlerts();
    logger.info('Alert generation completed at startup');
  } catch (err) {
    logger.error('Alert generation failed at startup:', err);
  }

  // Schedule daily alert generation (every 24h)
  setInterval(async () => {
    try {
      await generateAlerts();
      logger.info('Daily alert generation completed');
    } catch (err) {
      logger.error('Daily alert generation failed:', err);
    }
  }, 24 * 60 * 60 * 1000);
});

export default app;
