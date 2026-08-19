import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

type WidgetId =
  | 'kpi-vnc' | 'kpi-encours' | 'kpi-alertes' | 'kpi-ltv' | 'kpi-shortfalls'
  | 'kpi-provisions' | 'kpi-expected-loss' | 'kpi-taux-couverture' | 'kpi-nb-hypotheques'
  | 'chart-evolution-vnc' | 'chart-zones' | 'chart-natures'
  | 'list-alertes' | 'list-shortfalls' | 'table-zones'
  | 'widget-workflow' | 'widget-echeances';

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  position: number;
  size: 'sm' | 'md' | 'lg' | 'full';
}

function getDefaultConfig(role: string): WidgetConfig[] {
  switch (role) {
    case 'GESTIONNAIRE_GARANTIES':
      return [
        { id: 'kpi-vnc', visible: true, position: 0, size: 'sm' },
        { id: 'kpi-alertes', visible: true, position: 1, size: 'sm' },
        { id: 'kpi-shortfalls', visible: true, position: 2, size: 'sm' },
        { id: 'kpi-nb-hypotheques', visible: true, position: 3, size: 'sm' },
        { id: 'chart-evolution-vnc', visible: true, position: 4, size: 'lg' },
        { id: 'chart-natures', visible: true, position: 5, size: 'sm' },
        { id: 'list-alertes', visible: true, position: 6, size: 'md' },
        { id: 'list-shortfalls', visible: true, position: 7, size: 'md' },
        { id: 'kpi-encours', visible: false, position: 8, size: 'sm' },
        { id: 'kpi-ltv', visible: false, position: 9, size: 'sm' },
        { id: 'kpi-provisions', visible: false, position: 10, size: 'sm' },
        { id: 'kpi-expected-loss', visible: false, position: 11, size: 'sm' },
        { id: 'kpi-taux-couverture', visible: false, position: 12, size: 'sm' },
        { id: 'chart-zones', visible: false, position: 13, size: 'md' },
        { id: 'table-zones', visible: false, position: 14, size: 'full' },
        { id: 'widget-workflow', visible: false, position: 15, size: 'md' },
        { id: 'widget-echeances', visible: false, position: 16, size: 'md' },
      ];

    case 'RESPONSABLE_RISQUES':
      return [
        { id: 'kpi-ltv', visible: true, position: 0, size: 'sm' },
        { id: 'kpi-provisions', visible: true, position: 1, size: 'sm' },
        { id: 'kpi-expected-loss', visible: true, position: 2, size: 'sm' },
        { id: 'kpi-taux-couverture', visible: true, position: 3, size: 'sm' },
        { id: 'chart-evolution-vnc', visible: true, position: 4, size: 'lg' },
        { id: 'chart-zones', visible: true, position: 5, size: 'md' },
        { id: 'table-zones', visible: true, position: 6, size: 'full' },
        { id: 'list-shortfalls', visible: true, position: 7, size: 'full' },
        { id: 'kpi-vnc', visible: false, position: 8, size: 'sm' },
        { id: 'kpi-encours', visible: false, position: 9, size: 'sm' },
        { id: 'kpi-alertes', visible: false, position: 10, size: 'sm' },
        { id: 'kpi-shortfalls', visible: false, position: 11, size: 'sm' },
        { id: 'kpi-nb-hypotheques', visible: false, position: 12, size: 'sm' },
        { id: 'chart-natures', visible: false, position: 13, size: 'sm' },
        { id: 'list-alertes', visible: false, position: 14, size: 'md' },
        { id: 'widget-workflow', visible: false, position: 15, size: 'md' },
        { id: 'widget-echeances', visible: false, position: 16, size: 'md' },
      ];

    case 'ADMIN':
      return [
        { id: 'kpi-vnc', visible: true, position: 0, size: 'sm' },
        { id: 'kpi-encours', visible: true, position: 1, size: 'sm' },
        { id: 'kpi-alertes', visible: true, position: 2, size: 'sm' },
        { id: 'kpi-shortfalls', visible: true, position: 3, size: 'sm' },
        { id: 'kpi-ltv', visible: true, position: 4, size: 'sm' },
        { id: 'kpi-provisions', visible: true, position: 5, size: 'sm' },
        { id: 'kpi-expected-loss', visible: true, position: 6, size: 'sm' },
        { id: 'kpi-taux-couverture', visible: true, position: 7, size: 'sm' },
        { id: 'kpi-nb-hypotheques', visible: true, position: 8, size: 'sm' },
        { id: 'chart-evolution-vnc', visible: true, position: 9, size: 'full' },
        { id: 'chart-zones', visible: true, position: 10, size: 'md' },
        { id: 'chart-natures', visible: true, position: 11, size: 'md' },
        { id: 'list-alertes', visible: true, position: 12, size: 'md' },
        { id: 'list-shortfalls', visible: true, position: 13, size: 'md' },
        { id: 'table-zones', visible: true, position: 14, size: 'full' },
        { id: 'widget-workflow', visible: true, position: 15, size: 'md' },
        { id: 'widget-echeances', visible: true, position: 16, size: 'md' },
      ];

    case 'ENGAGEMENTS':
      return [
        { id: 'kpi-encours', visible: true, position: 0, size: 'sm' },
        { id: 'kpi-nb-hypotheques', visible: true, position: 1, size: 'sm' },
        { id: 'kpi-shortfalls', visible: true, position: 2, size: 'sm' },
        { id: 'kpi-alertes', visible: true, position: 3, size: 'sm' },
        { id: 'widget-echeances', visible: true, position: 4, size: 'full' },
        { id: 'chart-evolution-vnc', visible: true, position: 5, size: 'lg' },
        { id: 'table-zones', visible: true, position: 6, size: 'md' },
        { id: 'kpi-vnc', visible: false, position: 7, size: 'sm' },
        { id: 'kpi-ltv', visible: false, position: 8, size: 'sm' },
        { id: 'kpi-provisions', visible: false, position: 9, size: 'sm' },
        { id: 'kpi-expected-loss', visible: false, position: 10, size: 'sm' },
        { id: 'kpi-taux-couverture', visible: false, position: 11, size: 'sm' },
        { id: 'chart-zones', visible: false, position: 12, size: 'md' },
        { id: 'chart-natures', visible: false, position: 13, size: 'sm' },
        { id: 'list-alertes', visible: false, position: 14, size: 'md' },
        { id: 'list-shortfalls', visible: false, position: 15, size: 'md' },
        { id: 'widget-workflow', visible: false, position: 16, size: 'md' },
      ];

    case 'AUDIT_INTERNE':
      return [
        { id: 'kpi-provisions', visible: true, position: 0, size: 'sm' },
        { id: 'kpi-expected-loss', visible: true, position: 1, size: 'sm' },
        { id: 'kpi-taux-couverture', visible: true, position: 2, size: 'sm' },
        { id: 'kpi-ltv', visible: true, position: 3, size: 'sm' },
        { id: 'chart-zones', visible: true, position: 4, size: 'lg' },
        { id: 'table-zones', visible: true, position: 5, size: 'full' },
        { id: 'list-alertes', visible: true, position: 6, size: 'full' },
        { id: 'widget-workflow', visible: true, position: 7, size: 'md' },
        { id: 'kpi-vnc', visible: false, position: 8, size: 'sm' },
        { id: 'kpi-encours', visible: false, position: 9, size: 'sm' },
        { id: 'kpi-alertes', visible: false, position: 10, size: 'sm' },
        { id: 'kpi-shortfalls', visible: false, position: 11, size: 'sm' },
        { id: 'kpi-nb-hypotheques', visible: false, position: 12, size: 'sm' },
        { id: 'chart-evolution-vnc', visible: false, position: 13, size: 'lg' },
        { id: 'chart-natures', visible: false, position: 14, size: 'sm' },
        { id: 'list-shortfalls', visible: false, position: 15, size: 'md' },
        { id: 'widget-echeances', visible: false, position: 16, size: 'md' },
      ];

    default:
      // Fallback : config GESTIONNAIRE_GARANTIES
      return getDefaultConfig('GESTIONNAIRE_GARANTIES');
  }
}

export const getConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const existing = await prismaAny.dashboardConfig.findUnique({ where: { userId } });

    if (!existing) {
      res.json({ config: getDefaultConfig(role) });
      return;
    }

    const config: WidgetConfig[] = JSON.parse(existing.config);
    res.json({ config });
  } catch (err) {
    logger.error('getConfig error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
};

export const saveConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { config } = req.body as { config: WidgetConfig[] };

    if (!Array.isArray(config)) {
      res.status(400).json({ error: 'config doit être un tableau de WidgetConfig' });
      return;
    }

    await prismaAny.dashboardConfig.upsert({
      where: { userId },
      create: { userId, config: JSON.stringify(config) },
      update: { config: JSON.stringify(config) },
    });

    res.json({ config });
  } catch (err) {
    logger.error('saveConfig error:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la configuration' });
  }
};

export const resetConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const existing = await prismaAny.dashboardConfig.findUnique({ where: { userId } });
    if (existing) {
      await prismaAny.dashboardConfig.delete({ where: { userId } });
    }

    res.json({ config: getDefaultConfig(role) });
  } catch (err) {
    logger.error('resetConfig error:', err);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la configuration' });
  }
};
