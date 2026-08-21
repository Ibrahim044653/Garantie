import type { Hypotheque, Alerte } from '@/types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const BLEU = '#1e3a5f';
const GRIS = '#64748b';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
}

function fmtPct(n: number): string {
  return n.toFixed(1) + ' %';
}

function fmtDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function getLastY(doc: unknown): number {
  return (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
}

function addPageFooter(doc: unknown, pageH: number, pageW: number): void {
  const d = doc as {
    setFontSize: (n: number) => void;
    setFont: (f: string, s: string) => void;
    setTextColor: (...args: number[]) => void;
    text: (t: string, x: number, y: number, opts?: { align?: string }) => void;
  };
  const today = new Date().toLocaleDateString('fr-FR');
  d.setFontSize(8);
  d.setFont('helvetica', 'normal');
  const [gr, gg, gb] = hexToRgb(GRIS);
  d.setTextColor(gr, gg, gb);
  d.text(
    `Généré le ${today} — Confidentiel — Circulaire BCEAO 04-2017`,
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );
}

const NATURE_LABELS: Record<string, string> = {
  TERRAIN_NU: 'Terrain nu',
  VILLA: 'Villa',
  IMMEUBLE_RAPPORT: 'Immeuble de rapport',
  USINE: 'Usine',
  BUREAU: 'Bureau',
};

const ZONE_LABELS: Record<string, string> = {
  ZONE_A: 'Zone A',
  ZONE_B: 'Zone B',
  ZONE_C: 'Zone C',
  ZONE_INDUSTRIELLE: 'Zone Industrielle',
};

const OCCUPATION_LABELS: Record<string, string> = {
  LIBRE: 'Libre',
  OCCUPE_PROPRIETAIRE: 'Occupé (propriétaire)',
  LOUE_AVEC_BAIL: 'Loué avec bail',
};

const ALERTE_TYPE_LABELS: Record<string, string> = {
  SHORTFALL: 'Shortfall',
  EXPERTISE_OBSOLETE: 'Expertise obsolète',
  PEREMPTION_INSCRIPTION: 'Péremption inscription',
  LTV_ELEVEE: 'LTV élevée',
  EXPERTISE_RENOUVELLEMENT: 'Renouvellement expertise',
};

const RANG_LABELS: Record<number, string> = {
  1: '1er rang',
  2: '2ème rang',
};

// ─── Types données externes ────────────────────────────────────────────────────

export interface BCEAOReportData {
  portefeuilleGlobal?: {
    encoursTotale?: number;
    vncTotale?: number;
    tauxCouvertureMoyen?: number;
    nombreHypotheques?: number;
    shortfalls?: number;
  };
  grandsRisques?: Array<{
    nomClient?: string;
    encours?: number;
    pourcentagePortefeuille?: number;
    depasseSeuil?: boolean;
  }>;
  syscohada?: Array<{
    rubrique?: string;
    nombre?: number;
    encours?: number;
    provisions?: number;
    taux?: number;
  }>;
  ratiosPrudentiels?: Array<{
    ratio?: string;
    valeur?: number | string;
    seuil?: number | string;
    statut?: string;
  }>;
}

export interface BIReportData {
  vncTotale?: number;
  encoursTotale?: number;
  tauxCouverture?: number;
  expectedLoss?: number;
  performanceZone?: Array<{
    zone?: string;
    nombre?: number;
    encours?: number;
    vnc?: number;
    ltvMoyen?: number;
  }>;
  classification?: {
    sain?: { nombre?: number; encours?: number; pourcentage?: number };
    surveillance?: { nombre?: number; encours?: number; pourcentage?: number };
    douteux?: { nombre?: number; encours?: number; pourcentage?: number };
    contentieux?: { nombre?: number; encours?: number; pourcentage?: number };
  };
}

export interface Reevaluation {
  dateExpertise: string;
  valeurExpertise: number;
  expert?: string;
  decoteTotale?: number;
  vnc?: number;
  motif?: string;
}

// ─── A. Fiche hypothèque individuelle ─────────────────────────────────────────

export async function exportHypothequeSheet(
  hypotheque: Hypotheque,
  alertes?: Alerte[]
): Promise<void> {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const margin = 15;
    const pageW = 210;
    const pageH = 297;

    // Header rectangle bleu
    const [br, bg, bb] = hexToRgb(BLEU);
    doc.setFillColor(br, bg, bb);
    doc.rect(0, 0, pageW, 30, 'F');

    // Logo SIGGHY (gauche)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGGHY', margin, 20);

    // Textes droite
    doc.setFontSize(14);
    doc.text('SIGGHY — Garanties Hypothécaires', pageW - margin, 13, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Fiche Hypothèque', pageW - margin, 21, { align: 'right' });

    // Titre principal
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`FICHE D'HYPOTHÈQUE — ${hypotheque.numeroTitreFoncier}`, margin, 45);

    let y = 53;

    // ── Section Identification ────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('IDENTIFICATION', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [],
      body: [
        ['Client', hypotheque.nomClient],
        ['Code client', hypotheque.codeClient],
        ['N° Prêt', hypotheque.numeroPret],
        ['Nature du bien', NATURE_LABELS[hypotheque.natureBien] ?? hypotheque.natureBien],
        ['Zone géographique', ZONE_LABELS[hypotheque.zoneGeographique] ?? hypotheque.zoneGeographique],
        ['Statut occupation', OCCUPATION_LABELS[hypotheque.statutOccupation] ?? hypotheque.statutOccupation],
        ['Ville', hypotheque.ville],
      ],
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 65, fillColor: [248, 250, 252] },
        1: { cellWidth: 'auto' },
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    y = getLastY(doc) + 6;

    // ── Section Évaluation ────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('ÉVALUATION (Circulaire BCEAO 04-2017)', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [],
      body: [
        ['Valeur expertise initiale', fmtFCFA(hypotheque.valeurExpertiseInitiale)],
        ['Date expertise', fmtDate(hypotheque.dateExpertise)],
        ['Décote zone', fmtPct(hypotheque.decoteZone)],
        ['Décote ancienneté', fmtPct(hypotheque.decoteAnciennete)],
        ['Décote occupation', fmtPct(hypotheque.decoteOccupation)],
        ['Décote totale', fmtPct(hypotheque.decoteTotale)],
        ['VNC', fmtFCFA(hypotheque.vnc)],
        ['LTV', fmtPct(hypotheque.ltv)],
      ],
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 65, fillColor: [248, 250, 252] },
        1: { cellWidth: 'auto' },
      },
      styles: { fontSize: 9, cellPadding: 3, fillColor: [250, 252, 255] },
      didParseCell: (data) => {
        // VNC en gras
        if (data.row.index === 6) {
          data.cell.styles.fontStyle = 'bold';
        }
        // LTV en rouge si > 100
        if (data.row.index === 7 && data.column.index === 1 && hypotheque.ltv > 100) {
          data.cell.styles.textColor = [220, 38, 38] as [number, number, number];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    y = getLastY(doc) + 6;

    // ── Section Inscription ───────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('INSCRIPTION HYPOTHÉCAIRE', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [],
      body: [
        ['Montant inscription', fmtFCFA(hypotheque.montantInscription)],
        ['Rang hypothèque', RANG_LABELS[hypotheque.rangHypotheque] ?? String(hypotheque.rangHypotheque)],
        ['Date péremption inscription', fmtDate(hypotheque.datePeremptionInscription)],
      ],
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 65, fillColor: [248, 250, 252] },
        1: { cellWidth: 'auto' },
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    y = getLastY(doc) + 6;

    // ── Alertes actives ───────────────────────────────────────────────────────
    if (alertes && alertes.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('ALERTES ACTIVES', margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Type', 'Message']],
        body: alertes.map((a) => [
          ALERTE_TYPE_LABELS[a.type] ?? a.type,
          a.message,
        ]),
        headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3, fillColor: [255, 243, 243] },
      });
    }

    // Footer
    addPageFooter(doc, pageH, pageW);

    doc.save(`fiche-hypotheque-${hypotheque.numeroTitreFoncier}.pdf`);
  } catch (err: unknown) {
    alert('Erreur: ' + (err as Error).message);
  }
}

// ─── B. Rapport BCEAO ─────────────────────────────────────────────────────────

export async function exportBCEAOReport(data: BCEAOReportData): Promise<void> {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const [br, bg, bb] = hexToRgb(BLEU);
    const today = new Date().toLocaleDateString('fr-FR');
    const moisAnnee = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // ── Page 1 — Couverture ───────────────────────────────────────────────────
    doc.setFillColor(br, bg, bb);
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGGHY', pageW / 2, 80, { align: 'center' });

    doc.setFontSize(18);
    doc.text('RAPPORT BCEAO', pageW / 2, 120, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Circulaire 04-2017', pageW / 2, 135, { align: 'center' });

    doc.setFontSize(12);
    doc.text(moisAnnee.charAt(0).toUpperCase() + moisAnnee.slice(1), pageW / 2, 155, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Généré le ${today}`, pageW / 2, pageH - 15, { align: 'center' });
    doc.text('CONFIDENTIEL', pageW / 2, pageH - 9, { align: 'center' });

    // ── Page 2 — Portefeuille Global ──────────────────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PORTEFEUILLE GLOBAL', margin, 25);

    const pg = data.portefeuilleGlobal ?? {};
    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Encours total', fmtFCFA(pg.encoursTotale ?? 0)],
        ['VNC totale', fmtFCFA(pg.vncTotale ?? 0)],
        ['Taux couverture moyen', fmtPct(pg.tauxCouvertureMoyen ?? 0)],
        ['Nombre hypothèques', String(pg.nombreHypotheques ?? 0)],
        ['Shortfalls', String(pg.shortfalls ?? 0)],
      ],
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { cellWidth: 'auto' },
      },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    addPageFooter(doc, pageH, pageW);

    // ── Page 3 — Grands Risques ───────────────────────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GRANDS RISQUES', margin, 25);

    const grandsRisques = data.grandsRisques ?? [];
    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [['Nom Client', 'Encours', '% Portefeuille', 'Dépasse seuil']],
      body: grandsRisques.length > 0
        ? grandsRisques.map((gr) => [
            gr.nomClient ?? '—',
            fmtFCFA(gr.encours ?? 0),
            fmtPct(gr.pourcentagePortefeuille ?? 0),
            gr.depasseSeuil ? 'Oui' : 'Non',
          ])
        : [['Aucune donnée disponible', '', '', '']],
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.cell.raw === 'Oui') {
          data.cell.styles.textColor = [220, 38, 38] as [number, number, number];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    addPageFooter(doc, pageH, pageW);

    // ── Page 4 — État SYSCOHADA ───────────────────────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ÉTAT SYSCOHADA', margin, 25);

    const syscohada = data.syscohada ?? [];
    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [['Rubrique', 'Nombre', 'Encours', 'Provisions', 'Taux']],
      body: syscohada.length > 0
        ? syscohada.map((s) => [
            s.rubrique ?? '—',
            String(s.nombre ?? 0),
            fmtFCFA(s.encours ?? 0),
            fmtFCFA(s.provisions ?? 0),
            fmtPct(s.taux ?? 0),
          ])
        : [['Aucune donnée disponible', '', '', '', '']],
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    addPageFooter(doc, pageH, pageW);

    // ── Page 5 — Ratios Prudentiels ───────────────────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RATIOS PRUDENTIELS', margin, 25);

    const ratios = data.ratiosPrudentiels ?? [];
    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [['Ratio', 'Valeur', 'Seuil', 'Statut']],
      body: ratios.length > 0
        ? ratios.map((r) => [
            r.ratio ?? '—',
            String(r.valeur ?? '—'),
            String(r.seuil ?? '—'),
            r.statut ?? '—',
          ])
        : [['Aucune donnée disponible', '', '', '']],
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        const val = data.cell.raw;
        if (data.column.index === 3) {
          if (typeof val === 'string' && val.toLowerCase().includes('conforme')) {
            data.cell.styles.textColor = [22, 163, 74] as [number, number, number];
          } else if (typeof val === 'string' && (val.toLowerCase().includes('non') || val.toLowerCase().includes('dépass'))) {
            data.cell.styles.textColor = [220, 38, 38] as [number, number, number];
          }
        }
      },
    });

    addPageFooter(doc, pageH, pageW);

    const mois = new Date().toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' }).replace('/', '-');
    doc.save(`rapport-bceao-${mois}.pdf`);
  } catch (err: unknown) {
    alert('Erreur: ' + (err as Error).message);
  }
}

// ─── C. Rapport Comité de Crédit ──────────────────────────────────────────────

export async function exportComiteReport(
  biData: BIReportData,
  hypotheques: Hypotheque[]
): Promise<void> {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const [br, bg, bb] = hexToRgb(BLEU);
    const today = new Date().toLocaleDateString('fr-FR');

    // ── Page 1 — Couverture ───────────────────────────────────────────────────
    doc.setFillColor(br, bg, bb);
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGGHY', pageW / 2, 80, { align: 'center' });

    doc.setFontSize(20);
    doc.text('RAPPORT COMITÉ DE CRÉDIT', pageW / 2, 115, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Analyse du Portefeuille Hypothécaire', pageW / 2, 132, { align: 'center' });

    doc.setFontSize(12);
    doc.text(today, pageW / 2, 150, { align: 'center' });

    doc.setFontSize(9);
    doc.text('CONFIDENTIEL', pageW / 2, pageH - 9, { align: 'center' });

    // ── Page 2 — KPIs Principaux ──────────────────────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KPIs PRINCIPAUX', margin, 25);

    const kpis = [
      { label: 'VNC Totale', value: fmtFCFA(biData.vncTotale ?? 0), color: [30, 58, 95] as [number, number, number] },
      { label: 'Encours Total', value: fmtFCFA(biData.encoursTotale ?? 0), color: [109, 40, 217] as [number, number, number] },
      { label: 'Taux de Couverture', value: fmtPct(biData.tauxCouverture ?? 0), color: [22, 163, 74] as [number, number, number] },
      { label: 'Expected Loss', value: fmtFCFA(biData.expectedLoss ?? 0), color: [220, 38, 38] as [number, number, number] },
    ];

    const cardW = 82;
    const cardH = 35;
    const startX = margin;
    const startY = 33;

    kpis.forEach((kpi, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (cardW + 6);
      const y = startY + row * (cardH + 6);

      doc.setFillColor(...kpi.color);
      doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, x + 6, y + 13);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value, x + 6, y + 26);
    });

    addPageFooter(doc, pageH, pageW);

    // ── Page 3 — Performance par Zone ─────────────────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANCE PAR ZONE', margin, 25);

    const zones = biData.performanceZone ?? [];
    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [['Zone', 'Hypothèques', 'Encours', 'VNC', 'LTV Moyen']],
      body: zones.length > 0
        ? zones.map((z) => [
            z.zone ?? '—',
            String(z.nombre ?? 0),
            fmtFCFA(z.encours ?? 0),
            fmtFCFA(z.vnc ?? 0),
            fmtPct(z.ltvMoyen ?? 0),
          ])
        : [['Aucune donnée disponible', '', '', '', '']],
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    addPageFooter(doc, pageH, pageW);

    // ── Page 4 — Top 5 Risques ────────────────────────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP 5 RISQUES', margin, 25);

    const STATUT_LABELS: Record<string, string> = {
      A_JOUR: 'À jour',
      EXPERTISE_OBSOLETE: 'Expertise obsolète',
      SHORTFALL: 'Shortfall',
    };

    const top5 = [...hypotheques]
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 5);

    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [['Client', 'LTV', 'Classification', 'Provision estimée']],
      body: top5.length > 0
        ? top5.map((h) => [
            h.nomClient,
            fmtPct(h.ltv),
            STATUT_LABELS[h.statut] ?? h.statut,
            h.ltv > 100 ? fmtFCFA(h.soldePret - h.vnc) : '—',
          ])
        : [['Aucune données', '', '', '']],
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.row.section === 'body') {
          const val = parseFloat(String(data.cell.raw).replace(' %', ''));
          if (!isNaN(val) && val > 100) {
            data.cell.styles.textColor = [220, 38, 38] as [number, number, number];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    addPageFooter(doc, pageH, pageW);

    // ── Page 5 — Classification du Portefeuille ───────────────────────────────
    doc.addPage();
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLASSIFICATION DU PORTEFEUILLE', margin, 25);

    const classif = biData.classification ?? {};
    const classifRows = [
      ['Sain', classif.sain?.nombre ?? 0, classif.sain?.encours ?? 0, classif.sain?.pourcentage ?? 0],
      ['Surveillance', classif.surveillance?.nombre ?? 0, classif.surveillance?.encours ?? 0, classif.surveillance?.pourcentage ?? 0],
      ['Douteux', classif.douteux?.nombre ?? 0, classif.douteux?.encours ?? 0, classif.douteux?.pourcentage ?? 0],
      ['Contentieux', classif.contentieux?.nombre ?? 0, classif.contentieux?.encours ?? 0, classif.contentieux?.pourcentage ?? 0],
    ];

    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [['Catégorie', 'Nombre', 'Encours', '% Portefeuille']],
      body: classifRows.map((r) => [
        String(r[0]),
        String(r[1]),
        fmtFCFA(r[2] as number),
        fmtPct(r[3] as number),
      ]),
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    addPageFooter(doc, pageH, pageW);

    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    doc.save(`rapport-comite-${dateStr}.pdf`);
  } catch (err: unknown) {
    alert('Erreur: ' + (err as Error).message);
  }
}

// ─── D. Historique des réévaluations ──────────────────────────────────────────

export async function exportReevaluationHistory(
  hypotheque: Hypotheque,
  reevaluations: Reevaluation[]
): Promise<void> {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const [br, bg, bb] = hexToRgb(BLEU);

    // Header
    doc.setFillColor(br, bg, bb);
    doc.rect(0, 0, pageW, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGGHY', margin, 20);

    doc.setFontSize(13);
    doc.text('Historique des Réévaluations', pageW - margin, 14, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`TF ${hypotheque.numeroTitreFoncier} — ${hypotheque.nomClient}`, pageW - margin, 22, { align: 'right' });

    // Titre
    doc.setTextColor(br, bg, bb);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`HISTORIQUE RÉÉVALUATIONS — ${hypotheque.numeroTitreFoncier}`, margin, 43);

    // Tableau chronologique
    const sorted = [...reevaluations].sort(
      (a, b) => new Date(a.dateExpertise).getTime() - new Date(b.dateExpertise).getTime()
    );

    autoTable(doc, {
      startY: 50,
      margin: { left: margin, right: margin },
      head: [['Date expertise', 'Valeur expertise', 'Expert', 'Décote totale', 'VNC', 'Motif']],
      body: sorted.length > 0
        ? sorted.map((r) => [
            fmtDate(r.dateExpertise),
            fmtFCFA(r.valeurExpertise),
            r.expert ?? '—',
            r.decoteTotale !== undefined ? fmtPct(r.decoteTotale) : '—',
            r.vnc !== undefined ? fmtFCFA(r.vnc) : '—',
            r.motif ?? '—',
          ])
        : [['Aucun historique', '', '', '', '', '']],
      headStyles: { fillColor: [br, bg, bb], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    let y = getLastY(doc) + 10;

    // Graphique ASCII — évolution textuelle des valeurs
    if (sorted.length > 1) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('ÉVOLUTION DES VALEURS', margin, y);
      y += 6;

      const maxVal = Math.max(...sorted.map((r) => r.valeurExpertise));
      const barMaxW = pageW - margin * 2 - 50;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      sorted.forEach((r) => {
        if (y > pageH - 30) return;
        const ratio = maxVal > 0 ? r.valeurExpertise / maxVal : 0;
        const barW = Math.max(1, ratio * barMaxW);

        doc.setTextColor(100, 116, 139);
        doc.text(fmtDate(r.dateExpertise), margin, y);

        doc.setFillColor(br, bg, bb);
        doc.rect(margin + 35, y - 4, barW, 5, 'F');

        doc.setTextColor(50, 50, 50);
        doc.text(fmtFCFA(r.valeurExpertise), margin + 38 + barW, y);

        y += 9;
      });
    }

    addPageFooter(doc, pageH, pageW);

    doc.save(`historique-reevaluation-${hypotheque.numeroTitreFoncier}.pdf`);
  } catch (err: unknown) {
    alert('Erreur: ' + (err as Error).message);
  }
}
