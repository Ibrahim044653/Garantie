import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware';
import { uploadReevaluationPhotos } from '../controllers/upload.controller';

export const uploadRouter = Router();

// Dossier de destination des photos de réévaluation.
// Sur Vercel seul /tmp est accessible en ecriture, et son contenu est
// ephemere : les photos n'y survivent pas au-dela de l'instance.
const reevaluationPhotosDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads', 'reevaluations')
  : path.join(__dirname, '..', '..', 'uploads', 'reevaluations');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(reevaluationPhotosDir)) {
  fs.mkdirSync(reevaluationPhotosDir, { recursive: true });
}

const reevaluationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, reevaluationPhotosDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `reevaluation-photo-${uniqueSuffix}${ext}`);
  },
});

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
