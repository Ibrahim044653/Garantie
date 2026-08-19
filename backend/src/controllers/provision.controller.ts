import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';
import {
  calculerDecotes,
  getAgeExpertiseYears,
  isInscriptionExpired,
} from '../services/calcul.service';
import {
  classifierCreance,
  calculerProvision,
  TAUX_PROVISION,
  ClassificationCreance,
} from '../services/provision.service';

const prisma = new PrismaClient();

// ─── Explicit shape (avoids relying on stale Prisma generated includes) ───────

interface HypothequeWithIncludes {
  id: number;
  nomClient: string;
  codeClient: string;
  numeroPret: string;
  valeurExpertiseInitiale: number | { toNumber: () => number };
  dateExpertise: Date;
  datePeremptionInscription: Date;
  soldePret: number | { toNumber: () => number };
  zoneGeographique: string;
  statutOccupation: string;
  natureBien: string;
  pret?: {
    statut: string;
    echeances: Array<{ statut: string }>;
  } | null;
  client?: {
    codeClient: string;
    nom: string;
    prenom?: string | null;
    raisonSociale?: string | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProvisionData(hypotheques: HypothequeWithIncludes[]) {
  return hypotheques.map((h) => {
    const valeurExpertise = Number(h.valeurExpertiseInitiale);
    const soldePret = Number(h.soldePret);

    const d = calculerDecotes(
      valeurExpertise,
      h.dateExpertise,
      h.zoneGeographique,
      h.statutOccupation,
      soldePret,
      h.natureBien,
    );

    const ageExpertise = getAgeExpertiseYears(h.dateExpertise);
    const inscriptionPerimee = isInscriptionExpired(h.datePeremptionInscription);
    const impayes = h.pret?.echeances?.length ?? 0;
    const statutPret = h.pret?.statut ?? null;

    const classification = classifierCreance(
      d.loanToValue,
      ageExpertise,
      inscriptionPerimee,
      statutPret,
      impayes,
    );

    const ead = soldePret;
    const vnc = d.valeurNetteCouverture;
    const { lgd, pd, ecl, provision } = calculerProvision(ead, vnc, classification);

    const nomClient =
      h.client
        ? h.client.raisonSociale ?? `${h.client.nom}${h.client.prenom ? ' ' + h.client.prenom : ''}`
        : h.nomClient;
    const codeClient = h.client?.codeClient ?? h.codeClient;

    return {
      hypothequeId: h.id,
      nomClient,
      codeClient,
      numeroPret: h.numeroPret,
      classification,
      ead,
      vnc: Math.round(vnc),
      lgd,
      pd,
      ecl: Math.round(ecl),
      provision,
      ltv: parseFloat(d.loanToValue.toFixed(2)),
      ageExpertise: parseFloat(ageExpertise.toFixed(1)),
      impayes,
      statutPret,
      inscriptionPerimee,
    };
  });
}

async function fetchHypotheques(): Promise<HypothequeWithIncludes[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaAny = prisma as any;
  return prismaAny.hypotheque.findMany({
    include: {
      pret: {
        include: {
          echeances: {
            where: { statut: 'IMPAYE' },
          },
        },
      },
      client: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

type ProvisionRow = ReturnType<typeof buildProvisionData>[number];

function buildSummary(data: ProvisionRow[]) {
  const classifications: ClassificationCreance[] = ['SAIN', 'SOUS_SURVEILLANCE', 'DOUTEUX', 'CONTENTIEUX'];

  const byClassification = {} as Record<
    ClassificationCreance,
    { count: number; encours: number; provision: number }
  >;

  for (const cls of classifications) {
    byClassification[cls] = { count: 0, encours: 0, provision: 0 };
  }

  for (const row of data) {
    const bucket = byClassification[row.classification];
    bucket.count += 1;
    bucket.encours += row.ead;
    bucket.provision += row.provision;
  }

  const totalCreances = data.length;
  const encoursTotalFCFA = Math.round(data.reduce((s, r) => s + r.ead, 0));
  const vncTotaleFCFA = Math.round(data.reduce((s, r) => s + r.vnc, 0));
  const provisionsTotalesFCFA = Math.round(data.reduce((s, r) => s + r.provision, 0));
  const tauxProvisionGlobal =
    encoursTotalFCFA > 0
      ? parseFloat(((provisionsTotalesFCFA / encoursTotalFCFA) * 100).toFixed(2))
      : 0;

  // Round bucket values
  for (const cls of classifications) {
    byClassification[cls].encours = Math.round(byClassification[cls].encours);
    byClassification[cls].provision = Math.round(byClassification[cls].provision);
  }

  return {
    totalCreances,
    encoursTotalFCFA,
    vncTotaleFCFA,
    provisionsTotalesFCFA,
    tauxProvisionGlobal,
    byClassification,
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getProvisions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await fetchHypotheques();
    const data = buildProvisionData(hypotheques);
    const summary = buildSummary(data);

    res.json({ summary, data });
  } catch (error) {
    logger.error('Erreur getProvisions', { error });
    res.status(500).json({ error: 'Erreur lors du calcul des provisions' });
  }
};

export const exportProvisions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await fetchHypotheques();
    const data = buildProvisionData(hypotheques);
    const summary = buildSummary(data);

    // Sheet 1 — Détail
    const sheet1Rows = data.map((r) => ({
      'ID Hypothèque': r.hypothequeId,
      Client: r.nomClient,
      'Code Client': r.codeClient,
      'N° Prêt': r.numeroPret,
      Classification: r.classification,
      'Encours (EAD) FCFA': r.ead,
      'VNC FCFA': r.vnc,
      'LGD (%)': parseFloat((r.lgd * 100).toFixed(2)),
      'PD (%)': parseFloat((r.pd * 100).toFixed(3)),
      'ECL FCFA': r.ecl,
      'Provision FCFA': r.provision,
      'LTV (%)': r.ltv,
      'Age Expertise (ans)': r.ageExpertise,
      'Impayés': r.impayes,
      'Statut Prêt': r.statutPret ?? 'N/A',
      'Inscription Périmée': r.inscriptionPerimee ? 'Oui' : 'Non',
    }));

    // Sheet 2 — Synthèse
    const classifications: ClassificationCreance[] = ['SAIN', 'SOUS_SURVEILLANCE', 'DOUTEUX', 'CONTENTIEUX'];
    const sheet2Rows = classifications.map((cls) => {
      const b = summary.byClassification[cls];
      return {
        Classification: cls,
        'Taux Provision (%)': (TAUX_PROVISION[cls] * 100).toFixed(0) + '%',
        'Nombre Créances': b.count,
        'Encours FCFA': b.encours,
        'Provision FCFA': b.provision,
      };
    });
    (sheet2Rows as Array<{ Classification: string; 'Taux Provision (%)': string; 'Nombre Créances': number; 'Encours FCFA': number; 'Provision FCFA': number }>).push({
      Classification: 'TOTAL',
      'Taux Provision (%)': '',
      'Nombre Créances': summary.totalCreances,
      'Encours FCFA': summary.encoursTotalFCFA,
      'Provision FCFA': summary.provisionsTotalesFCFA,
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet1Rows), 'Provisions IFRS9-BCEAO');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet2Rows), 'Synthèse');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `provisions-ifrs9-${new Date().getFullYear()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (error) {
    logger.error('Erreur exportProvisions', { error });
    res.status(500).json({ error: "Erreur lors de l'export des provisions" });
  }
};
