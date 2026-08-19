import { Router } from 'express';
import { authenticate, requireLecteur, requireGestionnaire } from '../middleware/auth.middleware';
import { uploadPDF } from '../middleware/upload.middleware';
import { getAll, getById, upload, addVersion, archive, download, getStats } from '../controllers/ged.controller';

export const gedRouter = Router();
gedRouter.use(authenticate);
gedRouter.get('/stats', requireLecteur, getStats);
gedRouter.get('/', requireLecteur, getAll);
gedRouter.get('/:id/download', requireLecteur, download);
gedRouter.get('/:id', requireLecteur, getById);
gedRouter.post('/', requireGestionnaire, uploadPDF.single('file'), upload);
gedRouter.post('/:id/versions', requireGestionnaire, uploadPDF.single('file'), addVersion);
gedRouter.put('/:id/archive', requireGestionnaire, archive);
