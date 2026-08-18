import { Router } from 'express';
import { body } from 'express-validator';
import { getAll, create, update, remove } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const userRouter = Router();

userRouter.use(authenticate, requireAdmin);

userRouter.get('/', getAll);

userRouter.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('nom').notEmpty().withMessage('Nom required'),
    body('prenom').notEmpty().withMessage('Prénom required'),
    body('role').optional().isIn(['ADMIN', 'GESTIONNAIRE_GARANTIES', 'RESPONSABLE_RISQUES']),
  ],
  validate,
  create,
);

userRouter.put(
  '/:id',
  [
    body('email').optional().isEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('role').optional().isIn(['ADMIN', 'GESTIONNAIRE_GARANTIES', 'RESPONSABLE_RISQUES']),
  ],
  validate,
  update,
);

userRouter.delete('/:id', remove);
