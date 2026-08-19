import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

/**
 * POST /api/uploads/reevaluation-photos
 * Upload de photos pour une réévaluation (max 5, jpeg/png, max 5MB chacune)
 * Retourne un tableau de chemins relatifs
 */
export const uploadReevaluationPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'Aucun fichier fourni' });
      return;
    }

    const files = req.files as Express.Multer.File[];

    if (files.length > 5) {
      res.status(400).json({ error: 'Maximum 5 photos autorisées' });
      return;
    }

    // Construire les chemins relatifs (relatifs au dossier uploads/)
    const paths = files.map((file) => `reevaluations/${file.filename}`);

    logger.info(`${files.length} photo(s) uploadée(s) pour réévaluation par user ${req.user!.id}`);
    res.status(201).json({ paths });
  } catch (err) {
    logger.error('uploadReevaluationPhotos error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
