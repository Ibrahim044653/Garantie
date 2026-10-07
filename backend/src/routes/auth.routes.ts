import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { login, logout, me } from '../controllers/auth.controller';
import { setupMfa, confirmMfa, validateMfa, disableMfa } from '../controllers/mfa.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

// Seules les tentatives ECHOUEES sont comptees. Une agence est derriere un
// NAT : tous les postes partagent une IP publique, donc un compteur portant
// sur toutes les connexions bloquait le 11e employe du matin. Ne compter que
// les echecs preserve exactement l'intention — freiner la force brute — sans
// penaliser les connexions legitimes, aussi nombreuses soient-elles.
// La protection par compte reste assuree par le verrouillage apres 5 echecs.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

export const authRouter = Router();

authRouter.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login,
);

authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);

// MFA routes
authRouter.get('/mfa/setup', authenticate, setupMfa);
authRouter.post('/mfa/confirm', authenticate, [body('token').notEmpty()], validate, confirmMfa);
authRouter.post('/mfa/validate', authLimiter, [body('userId').notEmpty(), body('token').notEmpty()], validate, validateMfa);
authRouter.delete('/mfa/disable', authenticate, disableMfa);
