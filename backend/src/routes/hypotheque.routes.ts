import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAll, getById, create, update, remove,
  getHistorique, reevaluer, importCSV, downloadDocument,
} from '../controllers/hypotheque.controller';
import { authenticate, requireGestionnaire, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadPDF, uploadCSV } from '../middleware/upload.middleware';

export const hypothequeRouter = Router();

// All routes require authentication
hypothequeRouter.use(authenticate);

const NATURES = ['TERRAIN_NU', 'VILLA', 'IMMEUBLE_RAPPORT', 'USINE', 'BUREAU'];
const ZONES = ['ZONE_A', 'ZONE_B', 'ZONE_C'];
const STATUTS_OCC = ['LIBRE', 'OCCUPE_PROPRIETAIRE', 'LOUE_AVEC_BAIL'];

const hypothequeValidation = [
  body('codeClient').notEmpty().withMessage('Code client required'),
  body('nomClient').notEmpty().withMessage('Nom client required'),
  body('numeroPret').notEmpty().withMessage('Numéro prêt required'),
  body('numeroTitreFoncier').notEmpty().withMessage('Numéro titre foncier required'),
  body('natureBien').isIn(NATURES).withMessage(`Nature bien must be one of: ${NATURES.join(', ')}`),
  body('ville').notEmpty().withMessage('Ville required'),
  body('zoneGeographique').isIn(ZONES).withMessage(`Zone must be one of: ${ZONES.join(', ')}`),
  body('statutOccupation').isIn(STATUTS_OCC).withMessage(`Statut must be one of: ${STATUTS_OCC.join(', ')}`),
  body('valeurExpertiseInitiale').isFloat({ min: 0 }).withMessage('Valeur expertise must be a positive number'),
  body('dateExpertise').isISO8601().withMessage('Date expertise must be a valid date'),
  body('montantInscription').isFloat({ min: 0 }).withMessage('Montant inscription must be a positive number'),
  body('datePeremptionInscription').isISO8601().withMessage('Date péremption must be a valid date'),
  body('soldePret').isFloat({ min: 0 }).withMessage('Solde prêt must be a positive number'),
];

// GET all
hypothequeRouter.get('/', getAll);

// GET by id
hypothequeRouter.get('/:id', getById);

// GET historique
hypothequeRouter.get('/:id/historique', getHistorique);

// GET document
hypothequeRouter.get('/:id/document', downloadDocument);

// POST create
hypothequeRouter.post(
  '/',
  requireGestionnaire,
  uploadPDF.single('pjExpertise'),
  hypothequeValidation,
  validate,
  create,
);

// PUT update
hypothequeRouter.put(
  '/:id',
  requireGestionnaire,
  uploadPDF.single('pjExpertise'),
  validate,
  update,
);

// POST reevaluer
hypothequeRouter.post(
  '/:id/reevaluer',
  requireGestionnaire,
  [
    body('motif').optional().isString(),
    body('nouvelleValeur').optional().isFloat({ min: 0 }),
    body('nouvelleDate').optional().isISO8601(),
    body('nouvelleZone').optional().isIn(ZONES),
    body('nouveauStatut').optional().isIn(STATUTS_OCC),
  ],
  validate,
  reevaluer,
);

// POST import CSV
hypothequeRouter.post(
  '/import',
  requireGestionnaire,
  uploadCSV.single('file'),
  importCSV,
);

// DELETE
hypothequeRouter.delete('/:id', requireAdmin, remove);
