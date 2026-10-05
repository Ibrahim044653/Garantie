import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { logger } from './services/logger';
import { authRouter } from './routes/auth.routes';
import { hypothequeRouter } from './routes/hypotheque.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { dashboardConfigRouter } from './routes/dashboard-config.routes';
import { reportingRouter } from './routes/reporting.routes';
import { userRouter } from './routes/user.routes';
import { alerteRouter } from './routes/alerte.routes';
import { clientRouter } from './routes/client.routes';
import { pretRouter } from './routes/pret.routes';
import { workflowRouter } from './routes/workflow.routes';
import { provisionRouter } from './routes/provision.routes';
import { scoringRouter } from './routes/scoring.routes';
import { reportingBceaoRouter } from './routes/reporting-bceao.routes';
import { gedRouter } from './routes/ged.routes';
import { assuranceRouter } from './routes/assurance.routes';
import { biRouter } from './routes/bi.routes';
import { notificationRouter } from './routes/notification.routes';
import { reevaluationRouter } from './routes/reevaluation.routes';
import { expertRouter } from './routes/expert.routes';
import { exportPlanifieRouter } from './routes/export-planifie.routes';
import { uploadRouter } from './routes/upload.routes';
import { mainleveeRouter } from './routes/mainlevee.routes';
import { recouvrementRouter } from './routes/recouvrement.routes';
import { auditRouter } from './routes/audit.routes';
import { searchRouter } from './routes/search.routes';
import { importRouter } from './routes/import.routes';
import { simulationRouter } from './routes/simulation.routes';
import { iaRouter } from './routes/ia.routes';
import { validateCsrf } from './middleware/csrf.middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Derriere un proxy, req.ip vaut l'IP du proxy sans ceci : tous les
// clients partageraient le meme compteur de rate limiting. Le nombre de
// sauts reste limite, pour ne pas laisser un client falsifier son IP via
// X-Forwarded-For. VERCEL est reconnu car la plateforme le definit seule.
const sautsProxy = process.env.TRUST_PROXY ?? (process.env.VERCEL ? '1' : '');
if (sautsProxy) app.set('trust proxy', Number(sautsProxy) || 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Egalite stricte, et non startsWith : un prefixe laisserait passer
    // https://origine-autorisee.exemple.attaquant.com, qui obtiendrait alors
    // un acces credentials aux donnees de l'utilisateur connecte.
    const ok = !origin ||
      allowedOrigins.some((o) => o.trim() === origin);
    // Refus sans exception : lever ici remonte au gestionnaire d'erreurs
    // global et renvoie un 500 bruyant. Omettre l'en-tete suffit, le
    // navigateur bloque la reponse de lui-meme.
    callback(null, ok);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF protection — validates X-CSRF-Token on all state-changing requests
app.use(validateCsrf);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/hypotheques', hypothequeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dashboard', dashboardConfigRouter);
app.use('/api/reporting', reportingRouter);
app.use('/api/users', userRouter);
app.use('/api/admin/users', userRouter);
app.use('/api/alertes', alerteRouter);
app.use('/api/clients', clientRouter);
app.use('/api/prets', pretRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/provisions', provisionRouter);
app.use('/api/scoring', scoringRouter);
app.use('/api/reporting-bceao', reportingBceaoRouter);
app.use('/api/ged', gedRouter);
app.use('/api/assurances', assuranceRouter);
app.use('/api/bi', biRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api', reevaluationRouter);
app.use('/api/experts', expertRouter);
app.use('/api/exports-planifies', exportPlanifieRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/mainlevees', mainleveeRouter);
app.use('/api/recouvrement', recouvrementRouter);
app.use('/api/audit', auditRouter);
app.use('/api/search', searchRouter);
app.use('/api/import', importRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/ia', iaRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// La generation d'alertes est declenchee par le cron quotidien, via
// GET /api/alertes/generer. La faire aussi au demarrage rejouerait tout
// le traitement a chaque reveil d'instance : generateAlerts supprime les
// alertes non lues avant de les recreer, et renverrait les courriels.
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
