import { Router } from 'express';
import { getAnnualReport, exportAnnualCSV, exportAnnualExcel } from '../controllers/reporting.controller';
import { authenticate } from '../middleware/auth.middleware';

export const reportingRouter = Router();

reportingRouter.use(authenticate);

reportingRouter.get('/annuel', getAnnualReport);
reportingRouter.get('/annuel/export', exportAnnualCSV);
reportingRouter.get('/annuel/export-excel', exportAnnualExcel);
