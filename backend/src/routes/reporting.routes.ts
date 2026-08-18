import { Router } from 'express';
import { getAnnualReport, exportAnnualCSV } from '../controllers/reporting.controller';
import { authenticate } from '../middleware/auth.middleware';

export const reportingRouter = Router();

reportingRouter.use(authenticate);

reportingRouter.get('/annuel', getAnnualReport);
reportingRouter.get('/annuel/export', exportAnnualCSV);
