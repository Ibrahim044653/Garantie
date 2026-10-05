import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

/**
 * POST /api/uploads/reevaluation-photos
 * Upload de photos pour une réévaluation (max 5, jpeg/png, max 5MB chacune).
 * Le contenu est stocké en base : le disque des hébergements utilisés est
 * éphémère, un fichier écrit sur disque devient irrécupérable au redémarrage.
 * Retourne les URL de relecture, à conserver dans photoPaths.
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

    const paths: string[] = [];
    for (const file of files) {
      const photo = await prisma.reevaluationPhoto.create({
        data: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          taille: file.size,
          fileContent: file.buffer,
          uploadedById: req.user!.id,
        },
        select: { id: true },
      });
      paths.push(`/api/uploads/reevaluation-photos/${photo.id}`);
    }

    logger.info(`${files.length} photo(s) de reevaluation enregistree(s) par user ${req.user!.id}`);
    res.status(201).json({ paths });
  } catch (err) {
    logger.error('uploadReevaluationPhotos error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/uploads/reevaluation-photos/:id
 * Sert une photo depuis la base.
 */
export const getReevaluationPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Identifiant invalide' });
      return;
    }

    const photo = await prisma.reevaluationPhoto.findUnique({ where: { id } });
    if (!photo) {
      res.status(404).json({ error: 'Photo introuvable' });
      return;
    }

    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${photo.fileName}"`);
    res.send(Buffer.from(photo.fileContent));
  } catch (err) {
    logger.error('getReevaluationPhoto error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
