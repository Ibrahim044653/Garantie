import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nom: true, prenom: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    logger.error('user.getAll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, nom, prenom, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const validRoles = ['ADMIN', 'GESTIONNAIRE_GARANTIES', 'RESPONSABLE_RISQUES'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: role || 'GESTIONNAIRE_GARANTIES',
      },
      select: { id: true, email: true, nom: true, prenom: true, role: true, createdAt: true },
    });

    logger.info(`User created: ${user.email} by ${req.user!.email}`);
    res.status(201).json(user);
  } catch (err) {
    logger.error('user.create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { email, password, nom, prenom, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (email) updateData.email = email;
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, nom: true, prenom: true, role: true, createdAt: true },
    });

    logger.info(`User updated: ${user.email} by ${req.user!.email}`);
    res.json(user);
  } catch (err) {
    logger.error('user.update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (req.user!.id === id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    logger.info(`User deleted: ${existing.email} by ${req.user!.email}`);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error('user.remove error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
