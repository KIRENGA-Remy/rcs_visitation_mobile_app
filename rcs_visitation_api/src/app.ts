import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

// ── Route modules (Phase 1 — MVP) ───────────────────────────
import authRoutes           from './modules/auth/auth.routes';
import userRoutes           from './modules/users/user.routes';
import visitorRoutes        from './modules/visitors/visitor.routes';
import prisonRoutes         from './modules/prisons/prison.routes';
import prisonerRoutes       from './modules/prisoners/prisoner.routes';
import scheduleRoutes       from './modules/schedules/schedule.routes';
import visitRequestRoutes   from './modules/visit-requests/visit-request.routes';
import visitLogRoutes       from './modules/visit-logs/visit-log.routes';

// ── Route modules (Phase 2) ──────────────────────────────────
import notificationRoutes   from './modules/notifications/notification.routes';
import verificationRoutes   from './modules/verification/verification.routes';
import settingsRoutes       from './modules/settings/settings.routes';
import reportsRoutes        from './modules/reports/reports.routes';

const app = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(globalRateLimiter);

// ── Parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP logging ─────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok', service: 'RCS Visitation API',
  version: '1.0.0', timestamp: new Date().toISOString(),
}));

// ── Routes ────────────────────────────────────────────────────
const API = env.API_PREFIX; // /api/v1

// Phase 1 — Core
app.use(`${API}/auth`,            authRoutes);
app.use(`${API}/users`,           userRoutes);
app.use(`${API}/visitors`,        visitorRoutes);
app.use(`${API}/prisons`,         prisonRoutes);
app.use(`${API}/prisoners`,       prisonerRoutes);
app.use(`${API}/schedules`,       scheduleRoutes);
app.use(`${API}/visit-requests`,  visitRequestRoutes);
app.use(`${API}/visit-logs`,      visitLogRoutes);

// Phase 2 — Extended
app.use(`${API}/notifications`,   notificationRoutes);
app.use(`${API}/verification`,    verificationRoutes);
app.use(`${API}/settings`,        settingsRoutes);
app.use(`${API}/reports`,         reportsRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
