import { Router } from 'express';
import { body } from 'express-validator';
import { getAll, getById, create, update, remove, getStats } from '../controllers/client.controller';
import { authenticate, requireGestionnaire } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const clientRouter = Router();

// Toutes les routes nécessitent une authentification
clientRouter.use(authenticate);

const TYPES_CLIENT = ['PARTICULIER', 'ENTREPRISE'];
const STATUTS_CLIENT = ['ACTIF', 'INACTIF', 'BLACKLISTE'];

const createValidation = [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('typeClient')
    .optional()
    .isIn(TYPES_CLIENT)
    .withMessage(`typeClient doit être l'un de : ${TYPES_CLIENT.join(', ')}`),
  body('statut')
    .optional()
    .isIn(STATUTS_CLIENT)
    .withMessage(`statut doit être l'un de : ${STATUTS_CLIENT.join(', ')}`),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email invalide'),
  body('dateNaissance')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date de naissance invalide (format ISO 8601 attendu)'),
];

const updateValidation = [
  body('nom')
    .optional()
    .notEmpty()
    .withMessage('Nom ne peut pas être vide'),
  body('typeClient')
    .optional()
    .isIn(TYPES_CLIENT)
    .withMessage(`typeClient doit être l'un de : ${TYPES_CLIENT.join(', ')}`),
  body('statut')
    .optional()
    .isIn(STATUTS_CLIENT)
    .withMessage(`statut doit être l'un de : ${STATUTS_CLIENT.join(', ')}`),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email invalide'),
  body('dateNaissance')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date de naissance invalide (format ISO 8601 attendu)'),
];

// GET /api/clients — Liste paginée
clientRouter.get('/', getAll);

// GET /api/clients/stats — Statistiques globales CRM (avant /:id pour éviter les conflits)
clientRouter.get('/stats', getStats);

// GET /api/clients/:id — Détail client
clientRouter.get('/:id', getById);

// POST /api/clients — Création (GESTIONNAIRE_GARANTIES + ADMIN)
clientRouter.post('/', requireGestionnaire, createValidation, validate, create);

// PUT /api/clients/:id — Modification (GESTIONNAIRE_GARANTIES + ADMIN)
clientRouter.put('/:id', requireGestionnaire, updateValidation, validate, update);

// DELETE /api/clients/:id — Suppression (GESTIONNAIRE_GARANTIES + ADMIN)
clientRouter.delete('/:id', requireGestionnaire, remove);
