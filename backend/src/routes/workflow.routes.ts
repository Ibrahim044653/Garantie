import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAll,
  getById,
  create,
  valider,
  getMesDemandes,
} from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const workflowRouter = Router();

// Toutes les routes nécessitent une authentification
workflowRouter.use(authenticate);

const TYPES_DEMANDE = [
  'CREATION_HYPOTHEQUE',
  'REEVALUATION',
  'RADIATION',
  'CREATION_PRET',
  'MODIFICATION_PRET',
];

// GET /api/workflow/mes-demandes — doit être avant /:id pour éviter les conflits
workflowRouter.get('/mes-demandes', getMesDemandes);

// GET /api/workflow
workflowRouter.get('/', getAll);

// GET /api/workflow/:id
workflowRouter.get('/:id', getById);

// POST /api/workflow — créer une demande de validation
workflowRouter.post(
  '/',
  [
    body('type')
      .isIn(TYPES_DEMANDE)
      .withMessage(`type doit être l'un de : ${TYPES_DEMANDE.join(', ')}`),
    body('entiteId').isInt({ min: 1 }).withMessage('entiteId requis (entier positif)'),
    body('entiteType').notEmpty().withMessage('entiteType requis'),
    body('titre').notEmpty().withMessage('titre requis'),
    body('description').optional().isString(),
  ],
  validate,
  create,
);

// POST /api/workflow/:id/valider — valider ou rejeter l'étape courante
workflowRouter.post(
  '/:id/valider',
  [
    body('statut')
      .isIn(['APPROUVE', 'REJETE'])
      .withMessage('statut doit être APPROUVE ou REJETE'),
    body('commentaire').optional().isString(),
  ],
  validate,
  valider,
);
