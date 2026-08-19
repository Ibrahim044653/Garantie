import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAll,
  getById,
  create,
  update,
  enregistrerPaiement,
  getEcheances,
  getStats,
} from '../controllers/pret.controller';
import { authenticate, requireGestionnaire } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const pretRouter = Router();

// Toutes les routes nécessitent une authentification
pretRouter.use(authenticate);

const TYPE_AMORTISSEMENT = ['LINEAIRE', 'CONSTANT', 'IN_FINE'];
const STATUTS_PRET = ['ACTIF', 'EN_DEFAUT', 'CLOTURE', 'RENEGOCIE', 'SOLDE'];

// GET /api/prets/stats — doit être avant /:id pour éviter les conflits
pretRouter.get('/stats', getStats);

// GET /api/prets
pretRouter.get('/', getAll);

// GET /api/prets/:id
pretRouter.get('/:id', getById);

// GET /api/prets/:id/echeances
pretRouter.get('/:id/echeances', getEcheances);

// POST /api/prets — créer un prêt + générer les échéances
pretRouter.post(
  '/',
  requireGestionnaire,
  [
    body('clientId').isInt({ min: 1 }).withMessage('clientId requis (entier positif)'),
    body('numeroPret').notEmpty().withMessage('numeroPret requis'),
    body('montantInitial').isFloat({ min: 0.01 }).withMessage('montantInitial doit être un nombre positif'),
    body('tauxInteret').isFloat({ min: 0 }).withMessage('tauxInteret doit être un nombre positif ou zéro'),
    body('dureeMois').isInt({ min: 1 }).withMessage('dureeMois doit être un entier ≥ 1'),
    body('typeAmortissement')
      .isIn(TYPE_AMORTISSEMENT)
      .withMessage(`typeAmortissement doit être l'un de : ${TYPE_AMORTISSEMENT.join(', ')}`),
    body('dateDebut').isISO8601().withMessage('dateDebut doit être une date valide (ISO 8601)'),
    body('objet').optional().isString(),
  ],
  validate,
  create,
);

// PUT /api/prets/:id — modifier statut ou objet uniquement
pretRouter.put(
  '/:id',
  requireGestionnaire,
  [
    body('statut').optional().isIn(STATUTS_PRET).withMessage(`statut doit être l'un de : ${STATUTS_PRET.join(', ')}`),
    body('objet').optional().isString(),
  ],
  validate,
  update,
);

// POST /api/prets/:id/paiements — enregistrer un paiement sur une échéance
pretRouter.post(
  '/:id/paiements',
  requireGestionnaire,
  [
    body('echeanceId').isInt({ min: 1 }).withMessage('echeanceId requis'),
    body('montantPaye').isFloat({ min: 0.01 }).withMessage('montantPaye doit être un nombre positif'),
    body('datePaiement').optional().isISO8601().withMessage('datePaiement doit être une date valide'),
    body('commentaire').optional().isString(),
  ],
  validate,
  enregistrerPaiement,
);
