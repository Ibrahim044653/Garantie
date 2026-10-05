import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.middleware';
import { uploadReevaluationPhotos, getReevaluationPhoto } from '../controllers/upload.controller';

export const uploadRouter = Router();

// Stockage en memoire : le contenu part ensuite en base. Ecrire sur disque
// ne sert a rien ici, le systeme de fichiers des hebergements utilises est
// ephemere et aucune route ne servait le dossier uploads.
const reevaluationStorage = multer.memoryStorage();

const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPEG et PNG sont autorisés'));
  }
};

const uploadReevaluationPhotosMiddleware = multer({
  storage: reevaluationStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB par fichier
    files: 5, // max 5 fichiers
  },
});

// Toutes les routes nécessitent une authentification
uploadRouter.use(authenticate);

// POST /api/uploads/reevaluation-photos
uploadRouter.post(
  '/reevaluation-photos',
  uploadReevaluationPhotosMiddleware.array('photos', 5),
  uploadReevaluationPhotos,
);

// GET /api/uploads/reevaluation-photos/:id
uploadRouter.get('/reevaluation-photos/:id', getReevaluationPhoto);
