import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

const addMonths = (d: Date, m: number) => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };
const addYears  = (d: Date, y: number) => { const r = new Date(d); r.setFullYear(r.getFullYear() + y); return r; };
const today = new Date();

async function main() {
  console.log('🌱 Seeding SGH database...');

  // ─── 1. USERS ──────────────────────────────────────────────────────────────
  const [pw_admin, pw_gest, pw_risq, pw_eng, pw_audit] = await Promise.all([
    bcrypt.hash('Admin@1234', 10), bcrypt.hash('Gest@1234', 10),
    bcrypt.hash('Risques@1234', 10), bcrypt.hash('Engag@1234', 10),
    bcrypt.hash('Audit@1234', 10),
  ]);

  const admin = await prisma.user.upsert({ where: { email: 'admin@banque.sn' }, update: {}, create: { email: 'admin@banque.sn', password: pw_admin, nom: 'Diallo', prenom: 'Mamadou', role: 'ADMIN' } });
  const gest  = await prisma.user.upsert({ where: { email: 'gestionnaire@banque.sn' }, update: {}, create: { email: 'gestionnaire@banque.sn', password: pw_gest, nom: 'Ndiaye', prenom: 'Fatou', role: 'GESTIONNAIRE_GARANTIES' } });
  const risq  = await prisma.user.upsert({ where: { email: 'risques@banque.sn' }, update: {}, create: { email: 'risques@banque.sn', password: pw_risq, nom: 'Sy', prenom: 'Ousmane', role: 'RESPONSABLE_RISQUES' } });
  const eng   = await prisma.user.upsert({ where: { email: 'engagements@banque.sn' }, update: {}, create: { email: 'engagements@banque.sn', password: pw_eng, nom: 'Konaté', prenom: 'Seydou', role: 'ENGAGEMENTS' } });
  await prisma.user.upsert({ where: { email: 'audit@banque.sn' }, update: {}, create: { email: 'audit@banque.sn', password: pw_audit, nom: 'Traoré', prenom: 'Aminata', role: 'AUDIT_INTERNE' } });
  console.log('✅ 5 utilisateurs');

  // ─── 2. EXPERTS AGRÉES ─────────────────────────────────────────────────────
  const exp1 = await prismaAny.expertAgree.upsert({ where: { numeroAgrement: 'EXP-2019-001' }, update: {}, create: { nom: 'Sall', prenom: 'Boubacar', cabinet: 'Sall & Associés Expertise', telephone: '+221 77 432 10 00', email: 'b.sall@sall-expertise.sn', numeroAgrement: 'EXP-2019-001', dateAgrement: new Date('2019-01-15'), dateExpiration: new Date('2027-01-15'), statut: 'ACTIF', specialites: 'Résidentiel, Commercial, Bureaux' } });
  const exp2 = await prismaAny.expertAgree.upsert({ where: { numeroAgrement: 'EXP-2020-002' }, update: {}, create: { nom: 'Diallo', prenom: 'Adja', cabinet: 'Cabinet Expertise Pro Dakar', telephone: '+221 76 891 22 34', email: 'a.diallo@expro.sn', numeroAgrement: 'EXP-2020-002', dateAgrement: new Date('2020-03-10'), dateExpiration: new Date('2028-03-10'), statut: 'ACTIF', specialites: 'Industriel, Terrain nu, Entrepôts' } });
  await prismaAny.expertAgree.upsert({ where: { numeroAgrement: 'EXP-2018-003' }, update: {}, create: { nom: 'Gaye', prenom: 'Moustapha', cabinet: 'Cabinet MG Expertise', telephone: '+221 70 654 33 21', email: 'm.gaye@mg-expertise.sn', numeroAgrement: 'EXP-2018-003', dateAgrement: new Date('2018-06-01'), dateExpiration: new Date('2024-06-01'), statut: 'SUSPENDU', specialites: 'Résidentiel' } });
  const exp4 = await prismaAny.expertAgree.upsert({ where: { numeroAgrement: 'EXP-2021-004' }, update: {}, create: { nom: 'Mbaye', prenom: 'Rokhaya', cabinet: 'RMB Évaluation Immobilière', telephone: '+221 77 231 45 67', email: 'r.mbaye@rmb-eval.sn', numeroAgrement: 'EXP-2021-004', dateAgrement: new Date('2021-09-15'), dateExpiration: new Date('2029-09-15'), statut: 'ACTIF', specialites: 'Résidentiel haut standing, Hôtellerie' } });
  await prismaAny.expertAgree.upsert({ where: { numeroAgrement: 'EXP-2022-005' }, update: {}, create: { nom: 'Cissé', prenom: 'Alioune Badara', cabinet: 'ABC Expertise & Conseil', telephone: '+221 78 123 98 76', email: 'ab.cisse@abc-expertise.sn', numeroAgrement: 'EXP-2022-005', dateAgrement: new Date('2022-01-20'), dateExpiration: new Date('2030-01-20'), statut: 'ACTIF', specialites: 'Zones industrielles, Infrastructures' } });
  console.log('✅ 5 experts agréés');

  // ─── 3. CLIENTS ────────────────────────────────────────────────────────────
  const clients: Record<string, { id: number }> = {};
  const clientData = [
    { codeClient: 'CLI-001', typeClient: 'PARTICULIER', nom: 'Diop', prenom: 'Amadou', telephone: '+221 77 234 56 78', email: 'a.diop@gmail.com', adresse: '15 Rue de Thiong', ville: 'Dakar', statut: 'ACTIF' },
    { codeClient: 'CLI-002', typeClient: 'PARTICULIER', nom: 'Sow', prenom: 'Fatou', telephone: '+221 76 345 67 89', email: 'f.sow@outlook.com', adresse: '8 Avenue Blaise Diagne', ville: 'Thiès', statut: 'ACTIF' },
    { codeClient: 'CLI-003', typeClient: 'PARTICULIER', nom: 'Ndiaye', prenom: 'Moussa', telephone: '+221 70 456 78 90', email: 'm.ndiaye@yahoo.fr', adresse: '22 Rue du Gouvernement', ville: 'Saint-Louis', statut: 'ACTIF' },
    { codeClient: 'CLI-004', typeClient: 'PARTICULIER', nom: 'Baldé', prenom: 'Mariama', telephone: '+221 77 567 89 01', email: 'mariama.balde@gmail.com', adresse: '5 Quartier Boudody', ville: 'Ziguinchor', statut: 'ACTIF' },
    { codeClient: 'CLI-005', typeClient: 'PARTICULIER', nom: 'Thiam', prenom: 'Ousmane', telephone: '+221 78 678 90 12', email: 'o.thiam@hotmail.com', adresse: '12 Médina Centre', ville: 'Kaolack', statut: 'ACTIF' },
    { codeClient: 'CLI-006', typeClient: 'PARTICULIER', nom: 'Fall', prenom: 'Aïssatou', telephone: '+221 77 789 01 23', email: 'aissatou.fall@gmail.com', adresse: '3 Résidence des Almadies', ville: 'Dakar', statut: 'ACTIF' },
    { codeClient: 'CLI-007', typeClient: 'PARTICULIER', nom: 'Gassama', prenom: 'Ibrahima', telephone: '+221 76 890 12 34', email: 'ibr.gassama@gmail.com', adresse: '45 Liberté 6', ville: 'Dakar', statut: 'ACTIF' },
    { codeClient: 'CLI-008', typeClient: 'PARTICULIER', nom: 'Diallo', prenom: 'Rokhaya', telephone: '+221 70 901 23 45', email: 'r.diallo@gmail.com', adresse: '7 Route de la Petite Côte', ville: "M'Bour", statut: 'ACTIF' },
    { codeClient: 'CLI-009', typeClient: 'PARTICULIER', nom: 'Mbaye', prenom: 'Cheikh Tidiane', telephone: '+221 77 012 34 56', email: 'ct.mbaye@gmail.com', adresse: '18 Quartier Darou', ville: 'Touba', statut: 'ACTIF' },
    { codeClient: 'CLI-010', typeClient: 'PARTICULIER', nom: 'Sarr', prenom: 'Ndéye Coumba', telephone: '+221 76 123 45 67', email: 'nc.sarr@gmail.com', adresse: '9 Cité SICAP Fann', ville: 'Dakar', statut: 'ACTIF' },
    { codeClient: 'CLI-011', typeClient: 'PARTICULIER', nom: 'Faye', prenom: 'Lamine', telephone: '+221 78 234 56 78', email: 'l.faye@outlook.com', adresse: '33 Rufisque Centre', ville: 'Rufisque', statut: 'ACTIF' },
    { codeClient: 'CLI-012', typeClient: 'PARTICULIER', nom: 'Traoré', prenom: 'Khady', telephone: '+221 77 345 67 89', email: 'khady.traore@gmail.com', adresse: '6 Route de Dakar', ville: 'Louga', statut: 'INACTIF' },
    { codeClient: 'ENT-001', typeClient: 'ENTREPRISE', nom: 'Immobilière du Sénégal', raisonSociale: 'Immobilière du Sénégal SA', telephone: '+221 33 821 45 67', email: 'contact@immo-senegal.sn', adresse: '45 Rue Carnot, Plateau', ville: 'Dakar', statut: 'ACTIF' },
    { codeClient: 'ENT-002', typeClient: 'ENTREPRISE', nom: 'BatiConstruct Sénégal', raisonSociale: 'BatiConstruct Sénégal SA', telephone: '+221 33 951 23 45', email: 'dg@baticonstruct.sn', adresse: 'Zone Industrielle BP 1234', ville: 'Thiès', statut: 'ACTIF' },
    { codeClient: 'ENT-003', typeClient: 'ENTREPRISE', nom: 'Agrotech Casamance', raisonSociale: 'Agrotech Casamance SARL', telephone: '+221 33 991 67 89', email: 'direction@agrotech-cas.sn', adresse: 'Route de Bignona', ville: 'Ziguinchor', statut: 'ACTIF' },
    { codeClient: 'ENT-004', typeClient: 'ENTREPRISE', nom: 'Groupe Hôtelier Teranga', raisonSociale: 'Groupe Hôtelier Teranga SA', telephone: '+221 33 957 11 22', email: 'daf@teranga-hotels.sn', adresse: 'Route de la Corniche', ville: "M'Bour", statut: 'ACTIF' },
    { codeClient: 'ENT-005', typeClient: 'ENTREPRISE', nom: 'Transport Dakar Logistique', raisonSociale: 'Transport & Logistique Dakar SARL', telephone: '+221 33 832 44 55', email: 'direction@tdl-dakar.sn', adresse: 'Zone Industrielle Hann', ville: 'Dakar', statut: 'ACTIF' },
    { codeClient: 'ENT-006', typeClient: 'ENTREPRISE', nom: 'Industries Plastiques Sahel', raisonSociale: 'Industries Plastiques du Sahel SA', telephone: '+221 33 952 88 99', email: 'daf@ips-sahel.sn', adresse: 'Zone Franche Industrielle', ville: 'Thiès', statut: 'ACTIF' },
    { codeClient: 'ENT-007', typeClient: 'ENTREPRISE', nom: 'Pêche Atlantique', raisonSociale: 'Pêche Atlantique SA', telephone: '+221 33 820 33 44', email: 'finance@peche-atlantique.sn', adresse: 'Port de Dakar, Quai 12', ville: 'Dakar', statut: 'ACTIF' },
    { codeClient: 'ENT-008', typeClient: 'ENTREPRISE', nom: 'Commerce Sine-Saloum', raisonSociale: 'Commerce & Distribution Sine-Saloum SARL', telephone: '+221 33 941 77 88', email: 'daf@css-distribution.sn', adresse: 'Avenue Senghor', ville: 'Kaolack', statut: 'ACTIF' },
  ];

  for (const c of clientData) {
    const created = await prisma.client.upsert({ where: { codeClient: c.codeClient }, update: {}, create: c as any });
    clients[c.codeClient] = created;
  }
  console.log('✅ 20 clients');

  // ─── 4. PRÊTS ──────────────────────────────────────────────────────────────
  const prets: Record<string, { id: number }> = {};
  const pretData = [
    { numeroPret: 'PRE-2021-001', clientId: clients['CLI-001'].id, montantInitial: 85000000, montantRestant: 72000000, tauxInteret: 0.0750, dureeMois: 180, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2021-03-01'), dateFin: new Date('2036-03-01'), statut: 'ACTIF', objet: 'Acquisition résidence principale - Villa Fann' },
    { numeroPret: 'PRE-2020-002', clientId: clients['CLI-002'].id, montantInitial: 42000000, montantRestant: 38000000, tauxInteret: 0.0800, dureeMois: 120, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2020-06-01'), dateFin: new Date('2030-06-01'), statut: 'ACTIF', objet: 'Achat terrain constructible Pikine' },
    { numeroPret: 'PRE-2019-003', clientId: clients['CLI-003'].id, montantInitial: 55000000, montantRestant: 41000000, tauxInteret: 0.0780, dureeMois: 180, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2019-01-15'), dateFin: new Date('2034-01-15'), statut: 'RENEGOCIE', objet: 'Construction villa Saint-Louis — renégocié 2022' },
    { numeroPret: 'PRE-2022-004', clientId: clients['CLI-004'].id, montantInitial: 18000000, montantRestant: 16500000, tauxInteret: 0.0900, dureeMois: 120, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2022-04-01'), dateFin: new Date('2032-04-01'), statut: 'ACTIF', objet: 'Acquisition terrain Ziguinchor' },
    { numeroPret: 'PRE-2021-005', clientId: clients['CLI-005'].id, montantInitial: 38000000, montantRestant: 34500000, tauxInteret: 0.0850, dureeMois: 120, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2021-07-01'), dateFin: new Date('2031-07-01'), statut: 'EN_DEFAUT', objet: 'Achat villa Kaolack — impayés depuis 6 mois' },
    { numeroPret: 'PRE-2023-006', clientId: clients['CLI-006'].id, montantInitial: 185000000, montantRestant: 178000000, tauxInteret: 0.0700, dureeMois: 240, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2023-02-01'), dateFin: new Date('2043-02-01'), statut: 'ACTIF', objet: 'Acquisition villa haut standing Almadies' },
    { numeroPret: 'PRE-2020-007', clientId: clients['CLI-007'].id, montantInitial: 98000000, montantRestant: 88000000, tauxInteret: 0.0750, dureeMois: 180, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2020-09-01'), dateFin: new Date('2035-09-01'), statut: 'ACTIF', objet: 'Villa Mermoz - résidence principale' },
    { numeroPret: 'PRE-2022-008', clientId: clients['CLI-008'].id, montantInitial: 62000000, montantRestant: 58000000, tauxInteret: 0.0800, dureeMois: 180, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2022-01-01'), dateFin: new Date('2037-01-01'), statut: 'ACTIF', objet: 'Résidence secondaire M\'Bour' },
    { numeroPret: 'PRE-2019-009', clientId: clients['CLI-009'].id, montantInitial: 25000000, montantRestant: 21000000, tauxInteret: 0.0900, dureeMois: 120, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2019-05-01'), dateFin: new Date('2029-05-01'), statut: 'EN_DEFAUT', objet: 'Terrain Touba — contentieux en cours' },
    { numeroPret: 'PRE-2023-010', clientId: clients['CLI-010'].id, montantInitial: 220000000, montantRestant: 212000000, tauxInteret: 0.0700, dureeMois: 240, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2023-06-01'), dateFin: new Date('2043-06-01'), statut: 'ACTIF', objet: 'Immeuble de rapport Yoff' },
    { numeroPret: 'PRE-2018-011', clientId: clients['CLI-011'].id, montantInitial: 32000000, montantRestant: 0, tauxInteret: 0.0820, dureeMois: 120, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2018-01-01'), dateFin: new Date('2028-01-01'), statut: 'SOLDE', objet: 'Villa Rufisque — soldé en 2024' },
    { numeroPret: 'PRE-2020-011E', clientId: clients['ENT-001'].id, montantInitial: 480000000, montantRestant: 398000000, tauxInteret: 0.0650, dureeMois: 240, typeAmortissement: 'CONSTANT', dateDebut: new Date('2020-03-01'), dateFin: new Date('2040-03-01'), statut: 'ACTIF', objet: 'Immeuble de rapport 8 étages - Plateau' },
    { numeroPret: 'PRE-2021-012', clientId: clients['ENT-002'].id, montantInitial: 295000000, montantRestant: 258000000, tauxInteret: 0.0700, dureeMois: 180, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2021-05-01'), dateFin: new Date('2036-05-01'), statut: 'ACTIF', objet: 'Extension usine + bureaux Thiès' },
    { numeroPret: 'PRE-2019-013', clientId: clients['ENT-003'].id, montantInitial: 195000000, montantRestant: 168000000, tauxInteret: 0.0750, dureeMois: 180, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2019-08-01'), dateFin: new Date('2034-08-01'), statut: 'EN_DEFAUT', objet: 'Unité de transformation agroalimentaire Ziguinchor' },
    { numeroPret: 'PRE-2022-014', clientId: clients['ENT-004'].id, montantInitial: 650000000, montantRestant: 595000000, tauxInteret: 0.0600, dureeMois: 240, typeAmortissement: 'IN_FINE', dateDebut: new Date('2022-07-01'), dateFin: new Date('2042-07-01'), statut: 'ACTIF', objet: 'Extension complexe hôtelier M\'Bour 120 chambres' },
    { numeroPret: 'PRE-2023-015', clientId: clients['ENT-005'].id, montantInitial: 185000000, montantRestant: 178000000, tauxInteret: 0.0700, dureeMois: 120, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2023-01-01'), dateFin: new Date('2033-01-01'), statut: 'ACTIF', objet: 'Entrepôt logistique Zone Industrielle Hann' },
    { numeroPret: 'PRE-2018-016', clientId: clients['ENT-006'].id, montantInitial: 350000000, montantRestant: 285000000, tauxInteret: 0.0680, dureeMois: 240, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2018-04-01'), dateFin: new Date('2038-04-01'), statut: 'RENEGOCIE', objet: 'Usine plastiques renégociée 2021' },
    { numeroPret: 'PRE-2021-017', clientId: clients['ENT-007'].id, montantInitial: 145000000, montantRestant: 128000000, tauxInteret: 0.0720, dureeMois: 180, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2021-11-01'), dateFin: new Date('2036-11-01'), statut: 'ACTIF', objet: 'Entrepôt frigorifique Port de Dakar' },
    { numeroPret: 'PRE-2021-018', clientId: clients['ENT-008'].id, montantInitial: 92000000, montantRestant: 82000000, tauxInteret: 0.0780, dureeMois: 120, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2021-02-01'), dateFin: new Date('2031-02-01'), statut: 'ACTIF', objet: 'Entrepôt commercial + bureaux Kaolack' },
    { numeroPret: 'PRE-2020-019', clientId: clients['ENT-001'].id, montantInitial: 280000000, montantRestant: 240000000, tauxInteret: 0.0680, dureeMois: 240, typeAmortissement: 'CONSTANT', dateDebut: new Date('2020-10-01'), dateFin: new Date('2040-10-01'), statut: 'ACTIF', objet: 'Résidence Ouakam — 12 appartements' },
    { numeroPret: 'PRE-2022-020', clientId: clients['ENT-005'].id, montantInitial: 225000000, montantRestant: 198000000, tauxInteret: 0.0650, dureeMois: 240, typeAmortissement: 'LINEAIRE', dateDebut: new Date('2022-09-01'), dateFin: new Date('2042-09-01'), statut: 'ACTIF', objet: 'Bureau administratif Zone Industrielle Dakar' },
  ];

  for (const p of pretData) {
    const created = await prisma.pret.upsert({ where: { numeroPret: p.numeroPret }, update: {}, create: p as any });
    prets[p.numeroPret] = created;
  }
  console.log('✅ 20 prêts');

  // ─── 5. HYPOTHÈQUES (25) ───────────────────────────────────────────────────
  // Coefficients BCEAO: ZONE_A=1.00, ZONE_B=0.85, ZONE_C=0.70, ZONE_INDUSTRIELLE=0.60
  // Situations de shortfall marquées *SF*
  const hypData = [
    // ── ZONE A (8) ──
    { numeroPret: 'HYP-ZA-001', codeClient: 'ENT-001', nomClient: 'Immobilière du Sénégal SA', numeroTitreFoncier: 'TF/DK/2020-45821', natureBien: 'IMMEUBLE_RAPPORT', ville: 'Dakar', quartier: 'Plateau', lot: 'LOT-12', ilot: 'ILOT-A', zoneGeographique: 'ZONE_A', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 420000000, dateExpertise: addYears(today, -1), montantInscription: 380000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 4), soldePret: 398000000, latitude: 14.6928, longitude: -17.4467, pretId: prets['PRE-2020-011E'].id, clientId: clients['ENT-001'].id },
    { numeroPret: 'HYP-ZA-002', codeClient: 'CLI-006', nomClient: 'Fall Aïssatou', numeroTitreFoncier: 'TF/DK/2023-11234', natureBien: 'VILLA', ville: 'Dakar', quartier: 'Almadies', lot: 'LOT-23', ilot: 'ILOT-C', zoneGeographique: 'ZONE_A', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 225000000, dateExpertise: addMonths(today, -8), montantInscription: 190000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 5), soldePret: 178000000, latitude: 14.7459, longitude: -17.5127, pretId: prets['PRE-2023-006'].id, clientId: clients['CLI-006'].id },
    { numeroPret: 'HYP-ZA-003', codeClient: 'CLI-007', nomClient: 'Gassama Ibrahima', numeroTitreFoncier: 'TF/DK/2020-78901', natureBien: 'VILLA', ville: 'Dakar', quartier: 'Mermoz', lot: 'LOT-45', ilot: 'ILOT-B', zoneGeographique: 'ZONE_A', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 165000000, dateExpertise: addYears(today, -5), montantInscription: 110000000, rangHypotheque: 1, datePeremptionInscription: addMonths(today, -6), soldePret: 88000000, latitude: 14.7235, longitude: -17.4987, pretId: prets['PRE-2020-007'].id, clientId: clients['CLI-007'].id }, // expertise expirée + inscription périmée
    { numeroPret: 'HYP-ZA-004', codeClient: 'CLI-010', nomClient: 'Sarr Ndéye Coumba', numeroTitreFoncier: 'TF/DK/2023-22345', natureBien: 'IMMEUBLE_RAPPORT', ville: 'Dakar', quartier: 'Yoff', lot: 'LOT-8', ilot: 'ILOT-D', zoneGeographique: 'ZONE_A', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 295000000, dateExpertise: addMonths(today, -10), montantInscription: 240000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 5), soldePret: 212000000, latitude: 14.7535, longitude: -17.4874, pretId: prets['PRE-2023-010'].id, clientId: clients['CLI-010'].id },
    { numeroPret: 'HYP-ZA-005', codeClient: 'ENT-005', nomClient: 'Transport & Logistique Dakar SARL', numeroTitreFoncier: 'TF/DK/2023-33456', natureBien: 'BUREAU', ville: 'Dakar', quartier: 'Liberté 6', lot: 'LOT-67', ilot: 'ILOT-F', zoneGeographique: 'ZONE_A', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 310000000, dateExpertise: addMonths(today, -14), montantInscription: 260000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 5), soldePret: 198000000, latitude: 14.7034, longitude: -17.4543, pretId: prets['PRE-2022-020'].id, clientId: clients['ENT-005'].id },
    { numeroPret: 'HYP-ZA-006', codeClient: 'CLI-001', nomClient: 'Diop Amadou', numeroTitreFoncier: 'TF/DK/2021-44567', natureBien: 'VILLA', ville: 'Dakar', quartier: 'Fann', lot: 'LOT-12', ilot: 'ILOT-G', zoneGeographique: 'ZONE_A', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 68000000, dateExpertise: addYears(today, -4), montantInscription: 80000000, rangHypotheque: 1, datePeremptionInscription: addMonths(today, -3), soldePret: 72000000, latitude: 14.6978, longitude: -17.4654, pretId: prets['PRE-2021-001'].id, clientId: clients['CLI-001'].id }, // *SF* 72M > 68M*1.0=68M + expertise expirée + inscription périmée
    { numeroPret: 'HYP-ZA-007', codeClient: 'ENT-001', nomClient: 'Immobilière du Sénégal SA', numeroTitreFoncier: 'TF/DK/2019-55678', natureBien: 'IMMEUBLE_RAPPORT', ville: 'Dakar', quartier: 'Ouakam', lot: 'LOT-3', ilot: 'ILOT-A', zoneGeographique: 'ZONE_A', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 520000000, dateExpertise: addYears(today, -2), montantInscription: 460000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 240000000, latitude: 14.7256, longitude: -17.5156, pretId: prets['PRE-2020-019'].id, clientId: clients['ENT-001'].id },
    { numeroPret: 'HYP-ZA-008', codeClient: 'CLI-002', nomClient: 'Sow Fatou', numeroTitreFoncier: 'TF/DK/2020-66789', natureBien: 'TERRAIN_NU', ville: 'Dakar', quartier: 'Grand Yoff', lot: 'LOT-88', ilot: null, zoneGeographique: 'ZONE_A', statutOccupation: 'LIBRE', valeurExpertiseInitiale: 35000000, dateExpertise: addYears(today, -2), montantInscription: 42000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 38000000, latitude: 14.7419, longitude: -17.4398, pretId: prets['PRE-2020-002'].id, clientId: clients['CLI-002'].id }, // *SF* 38M > 35M*1.0=35M
    // ── ZONE B (7) ──
    { numeroPret: 'HYP-ZB-009', codeClient: 'CLI-002', nomClient: 'Sow Fatou', numeroTitreFoncier: 'TF/PK/2020-77890', natureBien: 'VILLA', ville: 'Pikine', quartier: 'Pikine Nord', lot: 'LOT-15', ilot: 'ILOT-B', zoneGeographique: 'ZONE_B', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 92000000, dateExpertise: addYears(today, -4), montantInscription: 82000000, rangHypotheque: 1, datePeremptionInscription: addMonths(today, -2), soldePret: 82000000, latitude: 14.7545, longitude: -17.3952, pretId: prets['PRE-2020-002'].id, clientId: clients['CLI-002'].id }, // *SF* 82M > 92*0.85=78.2M + expertise expirée + inscription périmée
    { numeroPret: 'HYP-ZB-010', codeClient: 'CLI-005', nomClient: 'Thiam Ousmane', numeroTitreFoncier: 'TF/RU/2021-88901', natureBien: 'TERRAIN_NU', ville: 'Rufisque', quartier: 'Rufisque Est', lot: 'LOT-42', ilot: null, zoneGeographique: 'ZONE_B', statutOccupation: 'LIBRE', valeurExpertiseInitiale: 45000000, dateExpertise: addYears(today, -1), montantInscription: 40000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 4), soldePret: 34500000, latitude: 14.7156, longitude: -17.2779, pretId: prets['PRE-2021-005'].id, clientId: clients['CLI-005'].id },
    { numeroPret: 'HYP-ZB-011', codeClient: 'ENT-002', nomClient: 'BatiConstruct Sénégal SA', numeroTitreFoncier: 'TF/TH/2021-99012', natureBien: 'BUREAU', ville: 'Thiès', quartier: 'Centre', lot: 'LOT-56', ilot: 'ILOT-C', zoneGeographique: 'ZONE_B', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 185000000, dateExpertise: addYears(today, -1), montantInscription: 160000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 4), soldePret: 145000000, latitude: 14.7919, longitude: -16.9245, pretId: prets['PRE-2021-012'].id, clientId: clients['ENT-002'].id },
    { numeroPret: 'HYP-ZB-012', codeClient: 'ENT-004', nomClient: 'Groupe Hôtelier Teranga SA', numeroTitreFoncier: 'TF/MB/2022-10123', natureBien: 'IMMEUBLE_RAPPORT', ville: "M'Bour", quartier: 'Bord de mer', lot: 'LOT-1', ilot: 'ILOT-A', zoneGeographique: 'ZONE_B', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 820000000, dateExpertise: addMonths(today, -18), montantInscription: 700000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 5), soldePret: 595000000, latitude: 14.4135, longitude: -16.9659, pretId: prets['PRE-2022-014'].id, clientId: clients['ENT-004'].id },
    { numeroPret: 'HYP-ZB-013', codeClient: 'CLI-003', nomClient: 'Ndiaye Moussa', numeroTitreFoncier: 'TF/SL/2019-21234', natureBien: 'VILLA', ville: 'Saint-Louis', quartier: 'Guet Ndar', lot: 'LOT-7', ilot: 'ILOT-D', zoneGeographique: 'ZONE_B', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 78000000, dateExpertise: addYears(today, -4), montantInscription: 65000000, rangHypotheque: 1, datePeremptionInscription: addMonths(today, 6), soldePret: 41000000, latitude: 16.0179, longitude: -16.4896, pretId: prets['PRE-2019-003'].id, clientId: clients['CLI-003'].id }, // expertise expirée
    { numeroPret: 'HYP-ZB-014', codeClient: 'CLI-008', nomClient: 'Diallo Rokhaya', numeroTitreFoncier: 'TF/MB/2022-32345', natureBien: 'VILLA', ville: "M'Bour", quartier: 'Saly Portudal', lot: 'LOT-33', ilot: 'ILOT-E', zoneGeographique: 'ZONE_B', statutOccupation: 'LIBRE', valeurExpertiseInitiale: 68000000, dateExpertise: addMonths(today, -16), montantInscription: 62000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 4), soldePret: 58000000, latitude: 14.4201, longitude: -16.9501, pretId: prets['PRE-2022-008'].id, clientId: clients['CLI-008'].id },
    { numeroPret: 'HYP-ZB-015', codeClient: 'CLI-011', nomClient: 'Faye Lamine', numeroTitreFoncier: 'TF/RU/2018-43456', natureBien: 'VILLA', ville: 'Rufisque', quartier: 'Rufisque Centre', lot: 'LOT-21', ilot: 'ILOT-B', zoneGeographique: 'ZONE_B', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 52000000, dateExpertise: addYears(today, -6), montantInscription: 38000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, -2), soldePret: 0, latitude: 14.7156, longitude: -17.2890, pretId: prets['PRE-2018-011'].id, clientId: clients['CLI-011'].id }, // prêt soldé, inscription périmée
    // ── ZONE C (6) ──
    { numeroPret: 'HYP-ZC-016', codeClient: 'CLI-004', nomClient: 'Baldé Mariama', numeroTitreFoncier: 'TF/ZG/2022-54567', natureBien: 'TERRAIN_NU', ville: 'Ziguinchor', quartier: 'Boudody', lot: 'LOT-14', ilot: null, zoneGeographique: 'ZONE_C', statutOccupation: 'LIBRE', valeurExpertiseInitiale: 24000000, dateExpertise: addYears(today, -2), montantInscription: 22000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 16500000, latitude: 12.5681, longitude: -16.2719, pretId: prets['PRE-2022-004'].id, clientId: clients['CLI-004'].id }, // *SF* 16.5M > 24*0.70=16.8M... not SF. Let me adjust: val=22M, sold=17M, VNC=22*0.70=15.4M → SF
    { numeroPret: 'HYP-ZC-017', codeClient: 'ENT-003', nomClient: 'Agrotech Casamance SARL', numeroTitreFoncier: 'TF/ZG/2019-65678', natureBien: 'USINE', ville: 'Ziguinchor', quartier: 'Lyndiane', lot: 'LOT-89', ilot: null, zoneGeographique: 'ZONE_C', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 215000000, dateExpertise: addYears(today, -2), montantInscription: 198000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 168000000, latitude: 12.5612, longitude: -16.2645, pretId: prets['PRE-2019-013'].id, clientId: clients['ENT-003'].id },
    { numeroPret: 'HYP-ZC-018', codeClient: 'CLI-005', nomClient: 'Thiam Ousmane', numeroTitreFoncier: 'TF/KL/2021-76789', natureBien: 'VILLA', ville: 'Kaolack', quartier: 'Médina Mbaba', lot: 'LOT-5', ilot: 'ILOT-A', zoneGeographique: 'ZONE_C', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 58000000, dateExpertise: addYears(today, -2), montantInscription: 50000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 34500000, latitude: 14.1520, longitude: -16.0723, pretId: prets['PRE-2021-005'].id, clientId: clients['CLI-005'].id },
    { numeroPret: 'HYP-ZC-019', codeClient: 'CLI-009', nomClient: 'Mbaye Cheikh Tidiane', numeroTitreFoncier: 'TF/TB/2019-87890', natureBien: 'TERRAIN_NU', ville: 'Touba', quartier: 'Darou Khoudoss', lot: 'LOT-101', ilot: null, zoneGeographique: 'ZONE_C', statutOccupation: 'LIBRE', valeurExpertiseInitiale: 28000000, dateExpertise: addYears(today, -4), montantInscription: 24000000, rangHypotheque: 1, datePeremptionInscription: addMonths(today, -4), soldePret: 21000000, latitude: 14.8585, longitude: -15.8836, pretId: prets['PRE-2019-009'].id, clientId: clients['CLI-009'].id }, // *SF* 21M > 28*0.70=19.6M + expertise expirée + inscription périmée
    { numeroPret: 'HYP-ZC-020', codeClient: 'CLI-003', nomClient: 'Ndiaye Moussa', numeroTitreFoncier: 'TF/LG/2020-98901', natureBien: 'VILLA', ville: 'Louga', quartier: 'Ndiol', lot: 'LOT-18', ilot: 'ILOT-C', zoneGeographique: 'ZONE_C', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 48000000, dateExpertise: addYears(today, -2), montantInscription: 43000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 41000000, latitude: 15.6177, longitude: -16.2245, pretId: prets['PRE-2019-003'].id, clientId: clients['CLI-003'].id },
    { numeroPret: 'HYP-ZC-021', codeClient: 'ENT-008', nomClient: 'Commerce & Distribution Sine-Saloum SARL', numeroTitreFoncier: 'TF/KL/2021-09012', natureBien: 'IMMEUBLE_RAPPORT', ville: 'Kaolack', quartier: 'Centre Commercial', lot: 'LOT-2', ilot: 'ILOT-B', zoneGeographique: 'ZONE_C', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 145000000, dateExpertise: addMonths(today, -20), montantInscription: 120000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 4), soldePret: 82000000, latitude: 14.1612, longitude: -16.0650, pretId: prets['PRE-2021-018'].id, clientId: clients['ENT-008'].id },
    // ── ZONE INDUSTRIELLE (4) ──
    { numeroPret: 'HYP-ZI-022', codeClient: 'ENT-006', nomClient: 'Industries Plastiques du Sahel SA', numeroTitreFoncier: 'TF/IND-DK/2018-10123', natureBien: 'USINE', ville: 'Dakar', quartier: 'Hann Bel-Air', lot: 'LOT-4', ilot: null, zoneGeographique: 'ZONE_INDUSTRIELLE', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 420000000, dateExpertise: addYears(today, -2), montantInscription: 380000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 285000000, latitude: 14.7023, longitude: -17.4012, pretId: prets['PRE-2018-016'].id, clientId: clients['ENT-006'].id },
    { numeroPret: 'HYP-ZI-023', codeClient: 'ENT-002', nomClient: 'BatiConstruct Sénégal SA', numeroTitreFoncier: 'TF/IND-TH/2021-21234', natureBien: 'USINE', ville: 'Thiès', quartier: 'Zone Industrielle', lot: 'LOT-12', ilot: null, zoneGeographique: 'ZONE_INDUSTRIELLE', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 298000000, dateExpertise: addYears(today, -1), montantInscription: 265000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 4), soldePret: 258000000, latitude: 14.7801, longitude: -16.9372, pretId: prets['PRE-2021-012'].id, clientId: clients['ENT-002'].id },
    { numeroPret: 'HYP-ZI-024', codeClient: 'ENT-005', nomClient: 'Transport & Logistique Dakar SARL', numeroTitreFoncier: 'TF/IND-DK/2023-32345', natureBien: 'BUREAU', ville: 'Dakar', quartier: 'Zone Industrielle Mbao', lot: 'LOT-8', ilot: 'ILOT-B', zoneGeographique: 'ZONE_INDUSTRIELLE', statutOccupation: 'LOUE_AVEC_BAIL', valeurExpertiseInitiale: 185000000, dateExpertise: addMonths(today, -10), montantInscription: 165000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 5), soldePret: 178000000, latitude: 14.6978, longitude: -17.3845, pretId: prets['PRE-2023-015'].id, clientId: clients['ENT-005'].id },
    { numeroPret: 'HYP-ZI-025', codeClient: 'ENT-008', nomClient: 'Commerce & Distribution Sine-Saloum SARL', numeroTitreFoncier: 'TF/IND-KL/2021-43456', natureBien: 'USINE', ville: 'Kaolack', quartier: 'Zone Industrielle', lot: 'LOT-6', ilot: null, zoneGeographique: 'ZONE_INDUSTRIELLE', statutOccupation: 'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale: 142000000, dateExpertise: addYears(today, -2), montantInscription: 125000000, rangHypotheque: 1, datePeremptionInscription: addYears(today, 3), soldePret: 82000000, latitude: 14.1612, longitude: -16.0445, pretId: prets['PRE-2021-018'].id, clientId: clients['ENT-008'].id },
  ];

  // Fix HYP-ZC-016 soldePret to create shortfall
  hypData.find(h => h.numeroPret === 'HYP-ZC-016')!.valeurExpertiseInitiale = 22000000;

  const hyps: Record<string, { id: number }> = {};
  for (const h of hypData) {
    const created = await prisma.hypotheque.upsert({ where: { numeroPret: h.numeroPret }, update: {}, create: h as any });
    hyps[h.numeroPret] = created;
  }
  console.log('✅ 25 hypothèques avec coordonnées GPS');

  // ─── 6. ÉCHÉANCES (pour chaque prêt) ──────────────────────────────────────
  const echeances: any[] = [];
  const pretEcheancesMap: Record<string, { pretId: number; montant: number; statuts: string[] }> = {
    'PRE-2021-001': { pretId: prets['PRE-2021-001'].id, montant: 720000, statuts: ['PAYE','PAYE','PAYE','PAYE','EN_ATTENTE','EN_ATTENTE'] },
    'PRE-2020-002': { pretId: prets['PRE-2020-002'].id, montant: 420000, statuts: ['PAYE','PAYE','PAYE','PARTIEL','IMPAYE','IMPAYE'] },
    'PRE-2019-003': { pretId: prets['PRE-2019-003'].id, montant: 520000, statuts: ['PAYE','PAYE','PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2022-004': { pretId: prets['PRE-2022-004'].id, montant: 185000, statuts: ['PAYE','PAYE','EN_ATTENTE','EN_ATTENTE'] },
    'PRE-2021-005': { pretId: prets['PRE-2021-005'].id, montant: 385000, statuts: ['PAYE','PAYE','IMPAYE','IMPAYE','IMPAYE'] },
    'PRE-2023-006': { pretId: prets['PRE-2023-006'].id, montant: 1450000, statuts: ['PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2020-007': { pretId: prets['PRE-2020-007'].id, montant: 900000, statuts: ['PAYE','PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2022-008': { pretId: prets['PRE-2022-008'].id, montant: 600000, statuts: ['PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2019-009': { pretId: prets['PRE-2019-009'].id, montant: 260000, statuts: ['PAYE','PAYE','IMPAYE','IMPAYE','IMPAYE'] },
    'PRE-2023-010': { pretId: prets['PRE-2023-010'].id, montant: 1800000, statuts: ['PAYE','EN_ATTENTE'] },
    'PRE-2020-011E': { pretId: prets['PRE-2020-011E'].id, montant: 3500000, statuts: ['PAYE','PAYE','PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2021-012': { pretId: prets['PRE-2021-012'].id, montant: 2200000, statuts: ['PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2019-013': { pretId: prets['PRE-2019-013'].id, montant: 1650000, statuts: ['PAYE','PAYE','IMPAYE','IMPAYE'] },
    'PRE-2022-014': { pretId: prets['PRE-2022-014'].id, montant: 4800000, statuts: ['PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2023-015': { pretId: prets['PRE-2023-015'].id, montant: 2100000, statuts: ['PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2018-016': { pretId: prets['PRE-2018-016'].id, montant: 2500000, statuts: ['PAYE','PAYE','PAYE','PAYE','PARTIEL','EN_ATTENTE'] },
    'PRE-2021-017': { pretId: prets['PRE-2021-017'].id, montant: 1200000, statuts: ['PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2021-018': { pretId: prets['PRE-2021-018'].id, montant: 850000, statuts: ['PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2020-019': { pretId: prets['PRE-2020-019'].id, montant: 2100000, statuts: ['PAYE','PAYE','PAYE','PAYE','EN_ATTENTE'] },
    'PRE-2022-020': { pretId: prets['PRE-2022-020'].id, montant: 1700000, statuts: ['PAYE','PAYE','PAYE','EN_ATTENTE'] },
  ];

  for (const [key, cfg] of Object.entries(pretEcheancesMap)) {
    for (let i = 0; i < cfg.statuts.length; i++) {
      const stat = cfg.statuts[i];
      const montantPaye = stat === 'PAYE' ? cfg.montant : stat === 'PARTIEL' ? cfg.montant * 0.5 : 0;
      echeances.push({
        pretId: cfg.pretId,
        numeroEcheance: i + 1,
        dateEcheance: addMonths(addMonths(today, -(cfg.statuts.length - i)), 0),
        capitalDu: Math.round(cfg.montant * 0.75),
        interetsDus: Math.round(cfg.montant * 0.25),
        montantTotal: cfg.montant,
        capitalRembourse: stat === 'PAYE' ? Math.round(cfg.montant * 0.75) : 0,
        interetsRembourses: stat === 'PAYE' ? Math.round(cfg.montant * 0.25) : 0,
        montantPaye,
        statut: stat,
        datePaiement: stat === 'PAYE' ? addMonths(today, -(cfg.statuts.length - i)) : null,
      });
    }
  }
  await prisma.echeancePret.createMany({ data: echeances, skipDuplicates: true });
  console.log(`✅ ${echeances.length} échéances`);

  // ─── 7. ALERTES ────────────────────────────────────────────────────────────
  const alertes = [
    // Shortfalls
    { hypothequeId: hyps['HYP-ZA-006'].id, type: 'SHORTFALL', message: 'Shortfall détecté : soldePret (72 MFCFA) > VNC (68 MFCFA). Déficit de couverture : 4 MFCFA.' },
    { hypothequeId: hyps['HYP-ZA-008'].id, type: 'SHORTFALL', message: 'Shortfall détecté : soldePret (38 MFCFA) > VNC Zone A (35 MFCFA). Déficit : 3 MFCFA.' },
    { hypothequeId: hyps['HYP-ZB-009'].id, type: 'SHORTFALL', message: 'Shortfall Zone B : soldePret (82 MFCFA) > VNC (92×0.85=78.2 MFCFA). Déficit : 3.8 MFCFA.' },
    { hypothequeId: hyps['HYP-ZC-019'].id, type: 'SHORTFALL', message: 'Shortfall Zone C : soldePret (21 MFCFA) > VNC (28×0.70=19.6 MFCFA). Déficit : 1.4 MFCFA.' },
    { hypothequeId: hyps['HYP-ZC-016'].id, type: 'SHORTFALL', message: 'Shortfall Zone C : soldePret (16.5 MFCFA) > VNC (22×0.70=15.4 MFCFA). Déficit : 1.1 MFCFA.' },
    // Expertises expirées
    { hypothequeId: hyps['HYP-ZA-003'].id, type: 'EXPERTISE_EXPIREE', message: 'Expertise datée de plus de 3 ans (il y a 5 ans). Renouvellement urgent requis.' },
    { hypothequeId: hyps['HYP-ZA-006'].id, type: 'EXPERTISE_EXPIREE', message: 'Expertise datée de plus de 3 ans (il y a 4 ans). Renouvellement requis.' },
    { hypothequeId: hyps['HYP-ZB-009'].id, type: 'EXPERTISE_EXPIREE', message: 'Expertise datée de plus de 3 ans (il y a 4 ans). Renouvellement requis.' },
    { hypothequeId: hyps['HYP-ZB-013'].id, type: 'EXPERTISE_EXPIREE', message: 'Expertise datée de plus de 3 ans (il y a 4 ans). Renouvellement requis.' },
    { hypothequeId: hyps['HYP-ZC-019'].id, type: 'EXPERTISE_EXPIREE', message: 'Expertise datée de plus de 3 ans. Renouvellement urgent.' },
    // Expirations prochaines
    { hypothequeId: hyps['HYP-ZA-001'].id, type: 'EXPERTISE_BIENTOT_EXPIREE', message: 'Expertise bientôt expirée dans 14 mois. Planifier le renouvellement.', dateEcheance: addMonths(today, 14) },
    { hypothequeId: hyps['HYP-ZC-021'].id, type: 'EXPERTISE_BIENTOT_EXPIREE', message: 'Expertise expire dans 4 mois. Action requise.', dateEcheance: addMonths(today, 4) },
    // Inscriptions périmées
    { hypothequeId: hyps['HYP-ZA-003'].id, type: 'INSCRIPTION_PERIMEE', message: 'Inscription hypothécaire périmée depuis 6 mois. Renouvellement au bureau de la conservation foncière requis.' },
    { hypothequeId: hyps['HYP-ZA-006'].id, type: 'INSCRIPTION_PERIMEE', message: 'Inscription périmée depuis 3 mois. Renouvellement urgent.' },
    { hypothequeId: hyps['HYP-ZB-009'].id, type: 'INSCRIPTION_PERIMEE', message: 'Inscription périmée depuis 2 mois.' },
    { hypothequeId: hyps['HYP-ZC-019'].id, type: 'INSCRIPTION_PERIMEE', message: 'Inscription périmée depuis 4 mois.' },
    { hypothequeId: hyps['HYP-ZB-015'].id, type: 'INSCRIPTION_PERIMEE', message: 'Inscription périmée depuis 2 ans (prêt soldé).' },
  ];
  await prisma.alert.createMany({ data: alertes, skipDuplicates: true });
  console.log('✅ 17 alertes');

  // ─── 8. DOCUMENTS GED ──────────────────────────────────────────────────────
  const docCount = await prismaAny.document.count();
  if (docCount === 0) {
    const docs = await prismaAny.document.createManyAndReturn({
      data: [
        { titre: 'Titre Foncier TF/DK/2020-45821', type: 'TITRE_FONCIER', hypothequeId: hyps['HYP-ZA-001'].id, statut: 'ACTIF', description: 'Titre foncier original — Immeuble Plateau', tags: '["original","plateau"]' },
        { titre: 'Rapport expertise Almadies juin 2023', type: 'RAPPORT_EXPERTISE', hypothequeId: hyps['HYP-ZA-002'].id, statut: 'ACTIF', description: 'Rapport expert Sall & Associés — Villa Almadies', tags: '["expertise","2023"]' },
        { titre: 'Contrat de prêt PRE-2020-011E', type: 'CONTRAT_PRET', pretId: prets['PRE-2020-011E'].id, statut: 'ACTIF', description: 'Contrat prêt immobilier commercial 480 MFCFA', tags: '["contrat","commercial"]' },
        { titre: 'Police assurance NSIA — CLI-006', type: 'POLICE_ASSURANCE', clientId: clients['CLI-006'].id, statut: 'ACTIF', description: 'Police décès-invalidité NSIA Assurances', tags: '["assurance","nsia"]' },
        { titre: 'Titre Foncier TF/TH/2021-99012', type: 'TITRE_FONCIER', hypothequeId: hyps['HYP-ZB-011'].id, statut: 'ACTIF', description: 'Titre foncier BatiConstruct — Thiès', tags: '["original","thies"]' },
        { titre: 'Acte de propriété Mermoz', type: 'ACTE_PROPRIETE', hypothequeId: hyps['HYP-ZA-003'].id, statut: 'ACTIF', description: 'Acte notarié acquisition villa Mermoz', tags: '["notaire","acte"]' },
        { titre: 'Rapport expertise Zone Industrielle Hann', type: 'RAPPORT_EXPERTISE', hypothequeId: hyps['HYP-ZI-022'].id, statut: 'ACTIF', description: 'Expertise usine Industries Plastiques', tags: '["industriel","expertise"]' },
        { titre: 'Contrat prêt PRE-2022-014', type: 'CONTRAT_PRET', pretId: prets['PRE-2022-014'].id, statut: 'ACTIF', description: 'Contrat 650 MFCFA — Groupe Hôtelier Teranga', tags: '["contrat","hotellerie"]' },
        { titre: 'Titre Foncier TF/MB/2022-10123', type: 'TITRE_FONCIER', hypothequeId: hyps['HYP-ZB-012'].id, statut: 'ACTIF', description: 'TF hôtel Teranga M\'Bour', tags: '["original","mbour"]' },
        { titre: 'Rapport expertise Saint-Louis 2019', type: 'RAPPORT_EXPERTISE', hypothequeId: hyps['HYP-ZB-013'].id, statut: 'ARCHIVE', description: 'Rapport d\'expertise de 2019 — expiré', tags: '["expertise","expire","2019"]' },
        { titre: 'Police Allianz — ENT-002', type: 'POLICE_ASSURANCE', clientId: clients['ENT-002'].id, statut: 'ACTIF', description: 'Police incendie catastrophe Allianz Sénégal', tags: '["assurance","allianz"]' },
        { titre: 'Titre Foncier TF/ZG/2019-65678', type: 'TITRE_FONCIER', hypothequeId: hyps['HYP-ZC-017'].id, statut: 'ACTIF', description: 'TF usine Agrotech Casamance', tags: '["original","ziguinchor"]' },
        { titre: 'Accord de restructuration PRE-2018-016', type: 'ACCORD_CREDIT', pretId: prets['PRE-2018-016'].id, statut: 'ACTIF', description: 'Avenant renégociation prêt Industries Plastiques 2021', tags: '["renégociation","avenant"]' },
        { titre: 'Rapport expertise Touba 2019', type: 'RAPPORT_EXPERTISE', hypothequeId: hyps['HYP-ZC-019'].id, statut: 'ARCHIVE', description: 'Expertise terrain Touba — expiré depuis 4 ans', tags: '["expire","touba"]' },
        { titre: 'Titre Foncier TF/IND-DK/2018-10123', type: 'TITRE_FONCIER', hypothequeId: hyps['HYP-ZI-022'].id, statut: 'ACTIF', description: 'TF Zone Industrielle Hann', tags: '["industriel","original"]' },
      ],
    });
    for (const doc of docs) {
      await prismaAny.documentVersion.create({ data: { documentId: doc.id, numeroVersion: 1, filePath: `/uploads/doc_${doc.id}.pdf`, fileName: `${doc.titre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, mimeType: 'application/pdf', taille: 350000 + Math.floor(Math.random() * 200000), uploadedById: admin.id } });
    }
    console.log('✅ 15 documents + 15 versions GED');
  }

  // ─── 9. ASSURANCES ─────────────────────────────────────────────────────────
  const assCount = await prismaAny.assurance.count();
  if (assCount === 0) {
    await prismaAny.assurance.createMany({
      data: [
        { numeroPolice: 'NSIA-2023-0001', compagnie: 'NSIA Assurances Sénégal', typeAssurance: 'DECES_INVALIDITE', pretId: prets['PRE-2023-006'].id, clientId: clients['CLI-006'].id, hypothequeId: hyps['HYP-ZA-002'].id, montantAssure: 185000000, primeMensuelle: 46250, primeAnnuelle: 555000, dateDebut: new Date('2023-02-01'), dateFin: new Date('2043-02-01'), statut: 'ACTIVE', beneficiaire: 'Banque Nationale du Sénégal' },
        { numeroPolice: 'ALLIANZ-2021-0045', compagnie: 'Allianz Sénégal', typeAssurance: 'DECES_INVALIDITE', pretId: prets['PRE-2021-012'].id, clientId: clients['ENT-002'].id, hypothequeId: hyps['HYP-ZB-011'].id, montantAssure: 295000000, primeMensuelle: 73750, primeAnnuelle: 885000, dateDebut: new Date('2021-05-01'), dateFin: new Date('2036-05-01'), statut: 'ACTIVE', beneficiaire: 'Banque Nationale du Sénégal' },
        { numeroPolice: 'SANLAM-2022-0112', compagnie: 'Sanlam Sénégal', typeAssurance: 'INCENDIE_CATASTROPHE', hypothequeId: hyps['HYP-ZI-022'].id, clientId: clients['ENT-006'].id, montantAssure: 420000000, primeMensuelle: 105000, primeAnnuelle: 1260000, dateDebut: new Date('2022-01-01'), dateFin: new Date('2032-01-01'), statut: 'ACTIVE', beneficiaire: 'Banque Nationale du Sénégal' },
        { numeroPolice: 'NSIA-2020-0089', compagnie: 'NSIA Assurances Sénégal', typeAssurance: 'DECES_INVALIDITE', pretId: prets['PRE-2020-011E'].id, clientId: clients['ENT-001'].id, hypothequeId: hyps['HYP-ZA-001'].id, montantAssure: 480000000, primeMensuelle: 120000, primeAnnuelle: 1440000, dateDebut: new Date('2020-03-01'), dateFin: new Date('2040-03-01'), statut: 'ACTIVE', beneficiaire: 'Banque Nationale du Sénégal' },
        { numeroPolice: 'GFA-2022-0033', compagnie: 'GFA Assurances', typeAssurance: 'MULTIRISQUE_HABITATION', hypothequeId: hyps['HYP-ZA-002'].id, clientId: clients['CLI-006'].id, montantAssure: 225000000, primeMensuelle: 28125, primeAnnuelle: 337500, dateDebut: new Date('2023-02-01'), dateFin: new Date('2028-02-01'), statut: 'ACTIVE' },
        { numeroPolice: 'CNIA-2022-0078', compagnie: 'CNIA Saâda Sénégal', typeAssurance: 'DECES_INVALIDITE', pretId: prets['PRE-2022-014'].id, clientId: clients['ENT-004'].id, montantAssure: 650000000, primeMensuelle: 162500, primeAnnuelle: 1950000, dateDebut: new Date('2022-07-01'), dateFin: new Date('2042-07-01'), statut: 'ACTIVE', beneficiaire: 'Banque Nationale du Sénégal' },
        { numeroPolice: 'ALLIANZ-2018-0012', compagnie: 'Allianz Sénégal', typeAssurance: 'INCENDIE_CATASTROPHE', hypothequeId: hyps['HYP-ZB-013'].id, clientId: clients['CLI-003'].id, montantAssure: 78000000, primeMensuelle: 19500, primeAnnuelle: 234000, dateDebut: new Date('2019-01-01'), dateFin: new Date('2024-01-01'), statut: 'EXPIREE', notes: 'Police expirée — renouvellement en attente' },
        { numeroPolice: 'SANLAM-2021-0201', compagnie: 'Sanlam Sénégal', typeAssurance: 'DEFAILLANCE_CREDIT', pretId: prets['PRE-2021-005'].id, clientId: clients['CLI-005'].id, montantAssure: 38000000, primeMensuelle: 9500, primeAnnuelle: 114000, dateDebut: new Date('2021-07-01'), dateFin: new Date('2031-07-01'), statut: 'ACTIVE' },
        { numeroPolice: 'NSIA-2021-0156', compagnie: 'NSIA Assurances Sénégal', typeAssurance: 'DECES_INVALIDITE', pretId: prets['PRE-2021-017'].id, clientId: clients['ENT-007'].id, montantAssure: 145000000, primeMensuelle: 36250, primeAnnuelle: 435000, dateDebut: new Date('2021-11-01'), dateFin: new Date('2036-11-01'), statut: 'ACTIVE' },
        { numeroPolice: 'GFA-2023-0065', compagnie: 'GFA Assurances', typeAssurance: 'INCENDIE_CATASTROPHE', hypothequeId: hyps['HYP-ZI-023'].id, clientId: clients['ENT-002'].id, montantAssure: 298000000, primeMensuelle: 74500, primeAnnuelle: 894000, dateDebut: new Date('2021-05-01'), dateFin: new Date('2036-05-01'), statut: 'ACTIVE' },
      ],
    });
    console.log('✅ 10 assurances');
  }

  // ─── 10. WORKFLOW ──────────────────────────────────────────────────────────
  const wfCount = await prismaAny.demandeValidation.count();
  if (wfCount === 0) {
    const wfDemandes = [
      { type: 'CREATION_HYPOTHEQUE', entiteId: hyps['HYP-ZA-002'].id, entiteType: 'Hypotheque', titre: 'Création hypothèque — Villa Almadies (CLI-006)', description: 'Nouvelle hypothèque villa Almadies, montant 225 MFCFA, rang 1', statut: 'APPROUVE', createurId: gest.id, etapeActuelle: 3, totalEtapes: 3 },
      { type: 'CREATION_HYPOTHEQUE', entiteId: hyps['HYP-ZA-004'].id, entiteType: 'Hypotheque', titre: 'Création hypothèque — Immeuble Yoff (CLI-010)', statut: 'EN_COURS', createurId: gest.id, etapeActuelle: 2, totalEtapes: 3 },
      { type: 'CREATION_HYPOTHEQUE', entiteId: hyps['HYP-ZI-024'].id, entiteType: 'Hypotheque', titre: 'Création hypothèque — Zone Industrielle Mbao (ENT-005)', statut: 'EN_ATTENTE', createurId: eng.id, etapeActuelle: 1, totalEtapes: 3 },
      { type: 'REEVALUATION', entiteId: hyps['HYP-ZA-003'].id, entiteType: 'Hypotheque', titre: 'Réévaluation urgente — Villa Mermoz expertise expirée', description: 'Expertise datée de 5 ans, renouvellement requis par BCEAO', statut: 'EN_ATTENTE', createurId: gest.id, etapeActuelle: 1, totalEtapes: 3 },
      { type: 'REEVALUATION', entiteId: hyps['HYP-ZB-009'].id, entiteType: 'Hypotheque', titre: 'Réévaluation — Villa Pikine (shortfall détecté)', statut: 'EN_COURS', createurId: gest.id, etapeActuelle: 2, totalEtapes: 3 },
      { type: 'RADIATION', entiteId: hyps['HYP-ZB-015'].id, entiteType: 'Hypotheque', titre: 'Radiation hypothèque — Villa Rufisque (prêt soldé)', description: 'Prêt soldé en 2024, demande de mainlevée et radiation', statut: 'APPROUVE', createurId: gest.id, etapeActuelle: 3, totalEtapes: 3 },
      { type: 'CREATION_PRET', entiteId: prets['PRE-2023-015'].id, entiteType: 'Pret', titre: 'Nouveau prêt entrepôt logistique — ENT-005', statut: 'REJETE', createurId: eng.id, etapeActuelle: 2, totalEtapes: 3 },
      { type: 'MODIFICATION_PRET', entiteId: prets['PRE-2018-016'].id, entiteType: 'Pret', titre: 'Renégociation conditions prêt — ENT-006', statut: 'APPROUVE', createurId: eng.id, etapeActuelle: 3, totalEtapes: 3 },
    ];

    for (const wf of wfDemandes) {
      const d = await prismaAny.demandeValidation.create({ data: wf });
      const etapes = [
        { demandeId: d.id, numeroEtape: 1, libelle: 'Vérification dossier', roleRequis: 'GESTIONNAIRE_GARANTIES', statut: ['APPROUVE','EN_COURS','EN_ATTENTE','EN_ATTENTE','EN_COURS','APPROUVE','APPROUVE','APPROUVE'][wfDemandes.indexOf(wf)] === 'EN_ATTENTE' ? 'EN_ATTENTE' : 'APPROUVE', valideurId: gest.id, dateTraitement: addMonths(today, -1) },
        { demandeId: d.id, numeroEtape: 2, libelle: 'Analyse risques', roleRequis: 'RESPONSABLE_RISQUES', statut: wf.statut === 'APPROUVE' || wf.statut === 'REJETE' ? (wf.statut === 'REJETE' ? 'REJETE' : 'APPROUVE') : wf.etapeActuelle >= 2 ? 'APPROUVE' : 'EN_ATTENTE', valideurId: risq.id, commentaire: wf.statut === 'REJETE' ? 'Ratio LTV insuffisant — garantie insuffisante' : undefined },
        { demandeId: d.id, numeroEtape: 3, libelle: 'Validation finale', roleRequis: 'ADMIN', statut: wf.statut === 'APPROUVE' ? 'APPROUVE' : 'EN_ATTENTE', valideurId: wf.statut === 'APPROUVE' ? admin.id : null },
      ];
      for (const e of etapes) {
        await prismaAny.etapeValidation.create({ data: e }).catch(() => {});
      }
    }
    console.log('✅ 8 demandes workflow + étapes');
  }

  // ─── 11. RÉÉVALUATIONS ─────────────────────────────────────────────────────
  const reevCount = await prismaAny.reevaluationExpertise.count();
  if (reevCount === 0) {
    await prismaAny.reevaluationExpertise.createMany({
      data: [
        { hypothequeId: hyps['HYP-ZA-001'].id, dateExpertise: addYears(today, -1), valeurExpertise: 420000000, expertNom: 'Boubacar Sall', expertAgreeId: exp1.id, motif: 'Réévaluation annuelle réglementaire BCEAO', observations: 'Valeur maintenue — marché stable sur le Plateau', createdById: gest.id },
        { hypothequeId: hyps['HYP-ZA-002'].id, dateExpertise: addMonths(today, -8), valeurExpertise: 225000000, expertNom: 'Adja Diallo', expertAgreeId: exp2.id, motif: 'Expertise initiale acquisition', observations: 'Bien en excellent état, localisation prime Almadies', createdById: gest.id },
        { hypothequeId: hyps['HYP-ZI-022'].id, dateExpertise: addYears(today, -2), valeurExpertise: 420000000, expertNom: 'Alioune Badara Cissé', motif: 'Réévaluation suite extension usine', observations: 'Nouvelle unité de production augmente la valeur de 12%', createdById: admin.id },
        { hypothequeId: hyps['HYP-ZB-012'].id, dateExpertise: addMonths(today, -18), valeurExpertise: 820000000, expertNom: 'Rokhaya Mbaye', expertAgreeId: exp4.id, motif: 'Expertise annuelle portefeuille hôtelier', observations: 'Complexe hôtelier 5 étoiles, taux occupation 78%, valeur prime', createdById: gest.id },
        { hypothequeId: hyps['HYP-ZA-003'].id, dateExpertise: addYears(today, -5), valeurExpertise: 152000000, expertNom: 'Moustapha Gaye', motif: 'Expertise initiale 2019', observations: 'Expert suspendu depuis 2024 — renouvellement urgent requis par un expert agréé actif', createdById: admin.id },
        { hypothequeId: hyps['HYP-ZC-017'].id, dateExpertise: addYears(today, -2), valeurExpertise: 215000000, expertNom: 'Adja Diallo', expertAgreeId: exp2.id, motif: 'Réévaluation dossier contentieux', observations: 'Usine opérationnelle malgré difficultés financières', createdById: risq.id },
        { hypothequeId: hyps['HYP-ZA-007'].id, dateExpertise: addYears(today, -2), valeurExpertise: 520000000, expertNom: 'Boubacar Sall', expertAgreeId: exp1.id, motif: 'Réévaluation post-rénovation immeuble', observations: 'Rénovation complète 2022 — valeur réévaluée à la hausse', createdById: gest.id },
        { hypothequeId: hyps['HYP-ZB-011'].id, dateExpertise: addYears(today, -1), valeurExpertise: 185000000, expertNom: 'Alioune Badara Cissé', motif: 'Expertise annuelle', observations: 'Marché stable à Thiès, localisation centrale', createdById: gest.id },
      ],
    });
    console.log('✅ 8 réévaluations');
  }

  // ─── 12. HISTORIQUE VALEURS ───────────────────────────────────────────────
  const histCount = await prisma.historiqueValeur.count();
  if (histCount === 0) {
    await prisma.historiqueValeur.createMany({
      data: [
        { hypothequeId: hyps['HYP-ZA-001'].id, valeurExpertise: 400000000, dateExpertise: addYears(today, -3), zoneGeographique: 'ZONE_A', statutOccupation: 'LOUE_AVEC_BAIL', decoteZone: 0, decoteAnciennete: 5, decoteOccupation: 0, decoteTotale: 5, valeurNetteCouverture: 380000000, loanToValue: 1.0474, modifiePar: 'Système' },
        { hypothequeId: hyps['HYP-ZA-001'].id, valeurExpertise: 410000000, dateExpertise: addYears(today, -2), zoneGeographique: 'ZONE_A', statutOccupation: 'LOUE_AVEC_BAIL', decoteZone: 0, decoteAnciennete: 3, decoteOccupation: 0, decoteTotale: 3, valeurNetteCouverture: 397700000, loanToValue: 1.0057, modifiePar: 'Ndiaye Fatou' },
        { hypothequeId: hyps['HYP-ZA-001'].id, valeurExpertise: 420000000, dateExpertise: addYears(today, -1), zoneGeographique: 'ZONE_A', statutOccupation: 'LOUE_AVEC_BAIL', decoteZone: 0, decoteAnciennete: 2, decoteOccupation: 0, decoteTotale: 2, valeurNetteCouverture: 411600000, loanToValue: 0.9671, modifiePar: 'Sall Boubacar' },
        { hypothequeId: hyps['HYP-ZI-022'].id, valeurExpertise: 380000000, dateExpertise: addYears(today, -4), zoneGeographique: 'ZONE_INDUSTRIELLE', statutOccupation: 'OCCUPE_PROPRIETAIRE', decoteZone: 40, decoteAnciennete: 8, decoteOccupation: 0, decoteTotale: 45, valeurNetteCouverture: 209000000, loanToValue: 1.3636, modifiePar: 'Système' },
        { hypothequeId: hyps['HYP-ZI-022'].id, valeurExpertise: 420000000, dateExpertise: addYears(today, -2), zoneGeographique: 'ZONE_INDUSTRIELLE', statutOccupation: 'OCCUPE_PROPRIETAIRE', decoteZone: 40, decoteAnciennete: 5, decoteOccupation: 0, decoteTotale: 42, valeurNetteCouverture: 243600000, loanToValue: 1.1700, modifiePar: 'Cissé Alioune' },
        { hypothequeId: hyps['HYP-ZB-012'].id, valeurExpertise: 750000000, dateExpertise: addYears(today, -3), zoneGeographique: 'ZONE_B', statutOccupation: 'LOUE_AVEC_BAIL', decoteZone: 15, decoteAnciennete: 5, decoteOccupation: 0, decoteTotale: 19, valeurNetteCouverture: 607500000, loanToValue: 0.9802, modifiePar: 'Système' },
        { hypothequeId: hyps['HYP-ZB-012'].id, valeurExpertise: 820000000, dateExpertise: addMonths(today, -18), zoneGeographique: 'ZONE_B', statutOccupation: 'LOUE_AVEC_BAIL', decoteZone: 15, decoteAnciennete: 3, decoteOccupation: 0, decoteTotale: 17, valeurNetteCouverture: 680600000, loanToValue: 0.8742, modifiePar: 'Mbaye Rokhaya' },
        { hypothequeId: hyps['HYP-ZA-006'].id, valeurExpertise: 75000000, dateExpertise: addYears(today, -6), zoneGeographique: 'ZONE_A', statutOccupation: 'OCCUPE_PROPRIETAIRE', decoteZone: 0, decoteAnciennete: 12, decoteOccupation: 0, decoteTotale: 12, valeurNetteCouverture: 66000000, loanToValue: 1.0909, modifiePar: 'Système' },
        { hypothequeId: hyps['HYP-ZA-006'].id, valeurExpertise: 68000000, dateExpertise: addYears(today, -4), zoneGeographique: 'ZONE_A', statutOccupation: 'OCCUPE_PROPRIETAIRE', decoteZone: 0, decoteAnciennete: 8, decoteOccupation: 0, decoteTotale: 8, valeurNetteCouverture: 62560000, loanToValue: 1.1510, modifiePar: 'Gaye Moustapha' },
        { hypothequeId: hyps['HYP-ZC-019'].id, valeurExpertise: 32000000, dateExpertise: addYears(today, -4), zoneGeographique: 'ZONE_C', statutOccupation: 'LIBRE', decoteZone: 30, decoteAnciennete: 8, decoteOccupation: 5, decoteTotale: 38, valeurNetteCouverture: 19840000, loanToValue: 1.0585, modifiePar: 'Système' },
      ],
    });
    console.log('✅ 10 entrées historique valeurs');
  }

  // ─── 13. MAINLEVÉES ────────────────────────────────────────────────────────
  const mlCount = await prismaAny.mainleveeRadiation.count();
  if (mlCount === 0) {
    await prismaAny.mainleveeRadiation.createMany({
      data: [
        { hypothequeId: hyps['HYP-ZB-015'].id, statut: 'COMPLETE', motif: 'Prêt intégralement remboursé en juin 2024. Demande de mainlevée et radiation définitive.', dateNotaire: addMonths(today, -4), referenceNotaire: 'ME-FALL-2024-0123', dateConservationFonciere: addMonths(today, -3), referenceConservation: 'CF-RU-2024-0456', dateRadiation: addMonths(today, -3), observations: 'Radiation effectuée — hypothèque levée définitivement', createdById: admin.id },
        { hypothequeId: hyps['HYP-ZA-004'].id, statut: 'EN_ATTENTE_NOTAIRE', motif: 'Remboursement anticipé partiel — client souhaite libérer la garantie pour refinancement', dateNotaire: null, createdById: gest.id },
        { hypothequeId: hyps['HYP-ZC-021'].id, statut: 'EN_PREPARATION', motif: 'Fin de prêt prévue dans 6 mois — préparation anticipée du dossier mainlevée', createdById: gest.id },
        { hypothequeId: hyps['HYP-ZA-003'].id, statut: 'REJETE', motif: 'Demande de mainlevée suite expertise expirée', observations: 'Rejeté — expertise doit être renouvelée avant toute mainlevée. Dossier incomplet.', createdById: eng.id },
        { hypothequeId: hyps['HYP-ZB-013'].id, statut: 'EN_PREPARATION', motif: 'Prêt renégocié — restructuration avec libération partielle de la garantie envisagée', createdById: gest.id },
      ],
    });
    console.log('✅ 5 mainlevées/radiations');
  }

  // ─── 14. RECOUVREMENT ─────────────────────────────────────────────────────
  const recCount = await prismaAny.dossierRecouvrement.count();
  if (recCount === 0) {
    // Prêts EN_DEFAUT: PRE-2021-005, PRE-2019-009, PRE-2019-013
    const dos1 = await prismaAny.dossierRecouvrement.create({ data: { pretId: prets['PRE-2021-005'].id, statut: 'PRE_CONTENTIEUX', montantDu: 36225000, montantPenalites: 1811250, createdById: risq.id } });
    const dos2 = await prismaAny.dossierRecouvrement.create({ data: { pretId: prets['PRE-2019-009'].id, statut: 'CONTENTIEUX', montantDu: 22050000, montantPenalites: 2205000, createdById: risq.id } });
    const dos3 = await prismaAny.dossierRecouvrement.create({ data: { pretId: prets['PRE-2019-013'].id, statut: 'JUDICIAIRE', montantDu: 176400000, montantPenalites: 17640000, createdById: admin.id } });

    // Plan apurement pour dos1 et dos2
    for (const [dos, montantTotal, nEch] of [[dos1, 38036250, 12], [dos2, 24255000, 8]] as [any, number, number][]) {
      const plan = await prismaAny.planApurement.create({ data: { dossierId: dos.id, dateDebut: today, montantTotal, nombreEcheances: nEch, periodeEcheance: 'MENSUEL', tauxPenalite: 0.02 } });
      const echs = [];
      for (let i = 0; i < nEch; i++) {
        const stat = i < 3 ? 'PAYE' : i < 5 ? 'PARTIEL' : 'EN_ATTENTE';
        echs.push({ planId: plan.id, numeroEcheance: i + 1, dateEcheance: addMonths(today, i - 2), montant: Math.round(montantTotal / nEch), statut: stat, datePaiement: stat === 'PAYE' ? addMonths(today, i - 2) : null, montantPaye: stat === 'PAYE' ? Math.round(montantTotal / nEch) : stat === 'PARTIEL' ? Math.round(montantTotal / nEch / 2) : null });
      }
      await prismaAny.echeanceApurement.createMany({ data: echs });
    }
    console.log('✅ 3 dossiers recouvrement + 2 plans apurement');
  }

  // ─── 15. NOTIFICATIONS ────────────────────────────────────────────────────
  const notifCount = await prismaAny.notification.count();
  if (notifCount === 0) {
    await prismaAny.notification.createMany({
      data: [
        { userId: admin.id, type: 'SHORTFALL_DETECTE', titre: '5 shortfalls détectés dans le portefeuille', message: 'Analyse hebdomadaire : 5 hypothèques présentent un déficit de couverture. Montant total : 13.3 MFCFA.', entiteType: 'HYPOTHEQUE', lu: false },
        { userId: admin.id, type: 'WORKFLOW_EN_ATTENTE', titre: 'Validation requise — Immeuble Yoff', message: 'La demande de création hypothèque Immeuble Yoff (CLI-010) attend votre validation à l\'étape 3.', entiteType: 'WORKFLOW', lu: false },
        { userId: admin.id, type: 'WORKFLOW_EN_ATTENTE', titre: 'Validation requise — Zone Industrielle Mbao', message: 'Nouvelle demande de création hypothèque ENT-005 en attente de traitement (étape 1).', entiteType: 'WORKFLOW', lu: false },
        { userId: admin.id, type: 'ASSURANCE_EXPIRATION', titre: 'Police assurance expirée — CLI-003', message: 'La police ALLIANZ-2018-0012 (Allianz Sénégal) pour CLI-003 a expiré le 01/01/2024. Renouvellement urgent.', entiteType: 'HYPOTHEQUE', lu: false },
        { userId: admin.id, type: 'WORKFLOW_APPROUVE', titre: 'Dossier approuvé — Villa Almadies', message: 'La demande de création hypothèque Villa Almadies (CLI-006) a été approuvée par toutes les étapes.', lu: true },
        { userId: admin.id, type: 'WORKFLOW_APPROUVE', titre: 'Renégociation approuvée — ENT-006', message: 'La modification des conditions du prêt PRE-2018-016 a été validée.', lu: true },
        { userId: admin.id, type: 'SYSTEME', titre: 'Rapport BCEAO Q3 2024 disponible', message: 'Le rapport trimestriel BCEAO a été généré automatiquement et est disponible dans l\'onglet Rapports.', lu: true },
        { userId: gest.id, type: 'EXPERTISE_RENOUVELER', titre: 'Expertise à renouveler — Villa Mermoz', message: 'L\'expertise de HYP-ZA-003 (Villa Mermoz, CLI-007) date de 5 ans. Renouvellement obligatoire.', entiteType: 'HYPOTHEQUE', entiteId: hyps['HYP-ZA-003'].id, lu: false },
        { userId: gest.id, type: 'EXPERTISE_RENOUVELER', titre: 'Expertise à renouveler — Villa Pikine', message: 'L\'expertise de HYP-ZB-009 (Villa Pikine, CLI-002) date de 4 ans. Renouvellement requis.', entiteType: 'HYPOTHEQUE', entiteId: hyps['HYP-ZB-009'].id, lu: false },
        { userId: gest.id, type: 'ECHEANCE_PROCHE', titre: '3 échéances dues dans 7 jours', message: 'Les prêts PRE-2021-001, PRE-2020-007 et PRE-2021-012 ont des échéances dans moins de 7 jours.', lu: false },
        { userId: gest.id, type: 'WORKFLOW_APPROUVE', titre: 'Radiation approuvée — Villa Rufisque', message: 'La radiation de l\'hypothèque HYP-ZB-015 (CLI-011) a été approuvée et effectuée.', lu: true },
        { userId: gest.id, type: 'ALERTE_EXPIRATION', titre: 'Inscription périmée — 5 hypothèques', message: '5 inscriptions hypothécaires ont expiré. Renouvellement requis à la conservation foncière.', lu: true },
        { userId: risq.id, type: 'SHORTFALL_DETECTE', titre: 'Shortfall critique — HYP-ZB-009 (Pikine)', message: 'Shortfall de 3.8 MFCFA détecté. LTV effective : 105%. Provisionnement requis.', entiteType: 'HYPOTHEQUE', entiteId: hyps['HYP-ZB-009'].id, lu: false },
        { userId: risq.id, type: 'SHORTFALL_DETECTE', titre: 'Shortfall — HYP-ZA-006 (Fann)', message: 'Shortfall de 4 MFCFA. Expertise expirée — valeur potentiellement sous-évaluée.', entiteType: 'HYPOTHEQUE', entiteId: hyps['HYP-ZA-006'].id, lu: false },
        { userId: risq.id, type: 'SYSTEME', titre: 'Stress test BCEAO — résultats disponibles', message: 'Le stress test scénario modéré (-15%) génère 8 shortfalls supplémentaires pour 47.5 MFCFA d\'impact.', lu: false },
      ],
    });
    console.log('✅ 15 notifications');
  }

  // ─── 16. EXPORTS PLANIFIÉS ────────────────────────────────────────────────
  const expCount = await prismaAny.exportPlanifie.count();
  if (expCount === 0) {
    await prismaAny.exportPlanifie.createMany({
      data: [
        { type: 'RAPPORT_BCEAO', frequence: 'MENSUEL', destinataires: JSON.stringify(['admin@banque.sn', 'direction@banque.sn']), statut: 'ACTIF', prochainExport: addMonths(today, 1), createdById: admin.id },
        { type: 'RAPPORT_COMITE', frequence: 'TRIMESTRIEL', destinataires: JSON.stringify(['risques@banque.sn', 'admin@banque.sn', 'comite@banque.sn']), statut: 'ACTIF', prochainExport: addMonths(today, 2), createdById: risq.id },
        { type: 'PORTEFEUILLE_CSV', frequence: 'MENSUEL', destinataires: JSON.stringify(['gestionnaire@banque.sn']), statut: 'ACTIF', prochainExport: addMonths(today, 1), createdById: gest.id },
      ],
    });
    console.log('✅ 3 exports planifiés');
  }

  // ─── 17. AUDIT LOG ────────────────────────────────────────────────────────
  const auditCount = await prismaAny.auditLog.count();
  if (auditCount === 0) {
    await prismaAny.auditLog.createMany({
      data: [
        { userId: admin.id, action: 'CREATE', entite: 'HYPOTHEQUE', entiteId: String(hyps['HYP-ZA-001'].id), details: 'Création hypothèque Immeuble Plateau ENT-001', ip: '192.168.1.10', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -6) },
        { userId: gest.id, action: 'CREATE', entite: 'HYPOTHEQUE', entiteId: String(hyps['HYP-ZA-002'].id), details: 'Création hypothèque Villa Almadies CLI-006', ip: '192.168.1.11', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -3) },
        { userId: risq.id, action: 'UPDATE', entite: 'HYPOTHEQUE', entiteId: String(hyps['HYP-ZB-012'].id), details: 'Mise à jour valeur expertise — 820 MFCFA', ip: '192.168.1.12', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -2) },
        { userId: admin.id, action: 'APPROVE', entite: 'WORKFLOW', entiteId: '1', details: 'Approbation finale demande création Villa Almadies', ip: '192.168.1.10', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -2) },
        { userId: eng.id, action: 'CREATE', entite: 'PRET', entiteId: String(prets['PRE-2023-015'].id), details: 'Création prêt entrepôt logistique ENT-005 — 185 MFCFA', ip: '192.168.1.13', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -1) },
        { userId: gest.id, action: 'EXPORT', entite: 'HYPOTHEQUE', entiteId: null, details: 'Export CSV portefeuille complet — 25 hypothèques', ip: '192.168.1.11', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -1) },
        { userId: admin.id, action: 'DELETE', entite: 'USER', entiteId: '99', details: 'Suppression compte utilisateur inactif', ip: '192.168.1.10', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -1) },
        { userId: risq.id, action: 'UPDATE', entite: 'HYPOTHEQUE', entiteId: String(hyps['HYP-ZC-017'].id), details: 'Reclassification dossier Agrotech Casamance — contentieux', ip: '192.168.1.12', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, -1) },
        { userId: admin.id, action: 'LOGIN', entite: 'USER', entiteId: String(admin.id), details: 'Connexion réussie', ip: '196.203.45.12', userAgent: 'Chrome/120', createdAt: addMonths(today, 0) },
        { userId: gest.id, action: 'CREATE', entite: 'HYPOTHEQUE', entiteId: String(hyps['HYP-ZI-024'].id), details: 'Création hypothèque Zone Industrielle Mbao ENT-005', ip: '192.168.1.11', userAgent: 'Mozilla/5.0', createdAt: addMonths(today, 0) },
      ],
    });
    console.log('✅ 10 entrées audit log');
  }

  console.log('\n=== 🎉 SEED TERMINÉ ===');
  console.log('Entités créées:');
  console.log('  👤 5 utilisateurs (admin, gestionnaire, risques, engagements, audit)');
  console.log('  🏛️  5 experts agréés (3 ACTIF, 1 SUSPENDU, 1 incluant statut expiré)');
  console.log('  👥 20 clients (12 particuliers + 8 entreprises)');
  console.log('  💳 20 prêts (12 ACTIF, 3 EN_DEFAUT, 2 RENEGOCIE, 1 SOLDE, 2 divers)');
  console.log('  🏠 25 hypothèques (8 ZA + 7 ZB + 6 ZC + 4 ZI) avec coordonnées GPS');
  console.log('  📅 Échéances, alertes, documents GED, assurances, workflow');
  console.log('  🔄 Mainlevées, recouvrement, notifications, audit log');
  console.log('\nCredentials:');
  console.log('  Admin:        admin@banque.sn        / Admin@1234');
  console.log('  Gestionnaire: gestionnaire@banque.sn / Gest@1234');
  console.log('  Risques:      risques@banque.sn       / Risques@1234');
  console.log('  Engagements:  engagements@banque.sn  / Engag@1234');
  console.log('  Audit:        audit@banque.sn         / Audit@1234');
}

main().catch(e => { console.error('Seed error:', e); process.exit(1); }).finally(() => prisma.$disconnect());
