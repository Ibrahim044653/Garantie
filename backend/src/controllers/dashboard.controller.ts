import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculerDecotes } from '../services/calcul.service';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prisma.hypotheque.findMany();
    const alertesActives = await prisma.alert.count({ where: { lu: false } });

    let vncTotale = 0;
    let ltvTotal = 0;
    let ltvCount = 0;
    let shortfalls = 0;

    const repartitionZoneMap: Record<string, { count: number; vncTotal: number; soldeTotal: number }> = {
      ZONE_A: { count: 0, vncTotal: 0, soldeTotal: 0 },
      ZONE_B: { count: 0, vncTotal: 0, soldeTotal: 0 },
      ZONE_C: { count: 0, vncTotal: 0, soldeTotal: 0 },
    };
    const repartitionNatureMap: Record<string, number> = {};
    const topShortfallList: Array<Record<string, unknown>> = [];

    for (const h of hypotheques) {
      const d = calculerDecotes(
        h.valeurExpertiseInitiale,
        h.dateExpertise,
        h.zoneGeographique,
        h.statutOccupation,
        h.soldePret,
        h.natureBien,
      );
      vncTotale += d.valeurNetteCouverture;
      if (d.loanToValue < 999) { ltvTotal += d.loanToValue; ltvCount++; }
      if (d.hasShortfall) {
        shortfalls++;
        topShortfallList.push({
          id: h.id, numeroTitreFoncier: h.numeroTitreFoncier, nomClient: h.nomClient,
          zoneGeographique: h.zoneGeographique, vnc: Math.round(d.valeurNetteCouverture),
          soldePret: h.soldePret, ltv: d.loanToValue,
          statut: d.loanToValue > 100 ? 'SHORTFALL' : 'OK',
        });
      }
      repartitionZoneMap[h.zoneGeographique] = repartitionZoneMap[h.zoneGeographique] || { count: 0, vncTotal: 0, soldeTotal: 0 };
      repartitionZoneMap[h.zoneGeographique].count++;
      repartitionZoneMap[h.zoneGeographique].vncTotal += d.valeurNetteCouverture;
      repartitionZoneMap[h.zoneGeographique].soldeTotal += h.soldePret;
      repartitionNatureMap[h.natureBien] = (repartitionNatureMap[h.natureBien] || 0) + 1;
    }

    const ltvMoyen = ltvCount > 0 ? ltvTotal / ltvCount : 0;
    const total = hypotheques.length;

    const repartitionZone = Object.entries(repartitionZoneMap).map(([zone, data]) => ({
      zone, count: data.count,
      percentage: total > 0 ? parseFloat(((data.count / total) * 100).toFixed(1)) : 0,
      vncTotal: Math.round(data.vncTotal), soldeTotal: Math.round(data.soldeTotal),
    }));

    const repartitionNature = Object.entries(repartitionNatureMap).map(([nature, count]) => ({
      nature, count, percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
    }));

    // Evolution VNC: last 12 months from historique + current
    const twelveMonthsAgo = new Date(); twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const historique = await prisma.historiqueValeur.findMany({
      where: { dateModification: { gte: twelveMonthsAgo } }, orderBy: { dateModification: 'asc' },
    });
    const byMonth: Record<string, { vnc: number; ltv: number; count: number }> = {};
    for (const h of historique) {
      const key = `${h.dateModification.getFullYear()}-${String(h.dateModification.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { vnc: 0, ltv: 0, count: 0 };
      byMonth[key].vnc += h.valeurNetteCouverture; byMonth[key].ltv += h.loanToValue; byMonth[key].count++;
    }
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[currentKey]) byMonth[currentKey] = { vnc: 0, ltv: 0, count: 0 };
    for (const h of hypotheques) {
      const d = calculerDecotes(h.valeurExpertiseInitiale, h.dateExpertise, h.zoneGeographique, h.statutOccupation, h.soldePret, h.natureBien);
      byMonth[currentKey].vnc += d.valeurNetteCouverture;
      byMonth[currentKey].ltv += d.loanToValue < 999 ? d.loanToValue : 100;
      byMonth[currentKey].count++;
    }
    const evolutionVNC = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, vncTotal: Math.round(data.vnc), ltvMoyen: parseFloat((data.ltv / data.count).toFixed(2)), count: data.count }));

    // Recent alerts
    const alertesRecentes = await prisma.alert.findMany({
      where: { lu: false }, orderBy: { createdAt: 'desc' }, take: 5,
      include: { hypotheque: { select: { nomClient: true, numeroPret: true, numeroTitreFoncier: true } } },
    });

    res.json({
      totalHypotheques: total,
      vncTotale: Math.round(vncTotale),
      alertesActives,
      ltvMoyen: parseFloat(ltvMoyen.toFixed(2)),
      shortfalls,
      encoursTotalPrets: hypotheques.reduce((s, h) => s + h.soldePret, 0),
      valeurExpertiseTotale: hypotheques.reduce((s, h) => s + h.valeurExpertiseInitiale, 0),
      repartitionZone,
      repartitionNature,
      evolutionVNC,
      topShortfall: topShortfallList.sort((a, b) => (b.ltv as number) - (a.ltv as number)).slice(0, 5),
      alertesRecentes: alertesRecentes.map(a => ({
        ...a, statut: a.lu ? 'LU' : 'NON_LU',
        severite: a.type === 'SHORTFALL' ? 'CRITICAL' : a.type === 'INSCRIPTION_PERIMEE' ? 'HIGH' : 'MEDIUM',
      })),
    });
  } catch (err) {
    logger.error('getStats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAlertes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, statut, limit } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (statut === 'NON_LU') where.lu = false;
    else if (statut === 'LU') where.lu = true;

    const alertes = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 100,
      include: {
        hypotheque: {
          select: { nomClient: true, numeroPret: true, codeClient: true, numeroTitreFoncier: true },
        },
      },
    });

    // Map lu boolean to statut string for frontend compatibility
    const mapped = alertes.map((a) => ({
      ...a,
      statut: a.lu ? 'LU' : 'NON_LU',
      severite: a.type === 'SHORTFALL' ? 'CRITICAL' : a.type === 'INSCRIPTION_PERIMEE' ? 'HIGH' : 'MEDIUM',
    }));

    res.json(mapped);
  } catch (err) {
    logger.error('getAlertes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAlerteLue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await prisma.alert.update({ where: { id }, data: { lu: true } });
    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    logger.error('markAlerteLue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllAlertesLues = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.alert.updateMany({ where: { lu: false }, data: { lu: true } });
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    logger.error('markAllAlertesLues error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRepartitionZone = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prisma.hypotheque.findMany();

    const repartition: Record<string, { count: number; vncTotal: number; soldeTotal: number }> = {
      ZONE_A: { count: 0, vncTotal: 0, soldeTotal: 0 },
      ZONE_B: { count: 0, vncTotal: 0, soldeTotal: 0 },
      ZONE_C: { count: 0, vncTotal: 0, soldeTotal: 0 },
    };

    for (const h of hypotheques) {
      const zone = h.zoneGeographique;
      if (!repartition[zone]) repartition[zone] = { count: 0, vncTotal: 0, soldeTotal: 0 };
      repartition[zone].count++;
      repartition[zone].soldeTotal += h.soldePret;

      const d = calculerDecotes(
        h.valeurExpertiseInitiale,
        h.dateExpertise,
        zone,
        h.statutOccupation,
        h.soldePret,
        h.natureBien,
      );
      repartition[zone].vncTotal += d.valeurNetteCouverture;
    }

    const total = hypotheques.length;
    const result = Object.entries(repartition).map(([zone, data]) => ({
      zone,
      count: data.count,
      percentage: total > 0 ? parseFloat(((data.count / total) * 100).toFixed(1)) : 0,
      vncTotal: Math.round(data.vncTotal),
      soldeTotal: Math.round(data.soldeTotal),
    }));

    res.json(result);
  } catch (err) {
    logger.error('getRepartitionZone error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEvolutionVNC = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get last 12 months of historique data grouped by month
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const historique = await prisma.historiqueValeur.findMany({
      where: { dateModification: { gte: twelveMonthsAgo } },
      orderBy: { dateModification: 'asc' },
    });

    // Group by year-month
    const byMonth: Record<string, { vnc: number; count: number; ltv: number }> = {};

    for (const h of historique) {
      const d = h.dateModification;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { vnc: 0, count: 0, ltv: 0 };
      byMonth[key].vnc += h.valeurNetteCouverture;
      byMonth[key].ltv += h.loanToValue;
      byMonth[key].count++;
    }

    // Also add current month from live data
    const currentHypotheques = await prisma.hypotheque.findMany();
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[currentKey]) byMonth[currentKey] = { vnc: 0, count: 0, ltv: 0 };

    for (const h of currentHypotheques) {
      const d = calculerDecotes(
        h.valeurExpertiseInitiale,
        h.dateExpertise,
        h.zoneGeographique,
        h.statutOccupation,
        h.soldePret,
        h.natureBien,
      );
      byMonth[currentKey].vnc += d.valeurNetteCouverture;
      byMonth[currentKey].ltv += d.loanToValue < 999 ? d.loanToValue : 100;
      byMonth[currentKey].count++;
    }

    const result = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        vncTotal: Math.round(data.vnc),
        ltvMoyen: parseFloat((data.ltv / data.count).toFixed(2)),
        count: data.count,
      }));

    res.json(result);
  } catch (err) {
    logger.error('getEvolutionVNC error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
