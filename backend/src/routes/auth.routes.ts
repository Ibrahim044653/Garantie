import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const authRouter = Router();

authRouter.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login,
);

authRouter.post('/logout', logout);

authRouter.get('/me', authenticate, me);
