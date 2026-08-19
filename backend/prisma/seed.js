'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const addMonths = (d, m) => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };
const addYears  = (d, y) => { const r = new Date(d); r.setFullYear(r.getFullYear() + y); return r; };
const now = new Date();

// ─── 1. USERS ────────────────────────────────────────────────────────────────

async function seedUsers() {
  const defs = [
    { email: 'admin@banque.sn',        password: 'Admin@1234',   nom: 'Diallo',  prenom: 'Mamadou', role: 'ADMIN' },
    { email: 'gestionnaire@banque.sn', password: 'Gest@1234',    nom: 'Ndiaye',  prenom: 'Fatou',   role: 'GESTIONNAIRE_GARANTIES' },
    { email: 'risques@banque.sn',      password: 'Risques@1234', nom: 'Sy',      prenom: 'Ousmane', role: 'RESPONSABLE_RISQUES' },
    { email: 'engagements@banque.sn',  password: 'Engag@1234',   nom: 'Konaté',  prenom: 'Seydou',  role: 'ENGAGEMENTS' },
    { email: 'audit@banque.sn',        password: 'Audit@1234',   nom: 'Traoré',  prenom: 'Aminata', role: 'AUDIT_INTERNE' },
  ];
  for (const u of defs) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { email: u.email, password: hash, nom: u.nom, prenom: u.prenom, role: u.role },
    });
  }
  console.log('Seed: 5 users upserted');
}

// ─── 2. HYPOTHÈQUES ───────────────────────────────────────────────────────────

async function seedHypotheques() {
  const list = [
    { codeClient:'CLI001', nomClient:'SOCIETE IMMOBILIERE DU SENEGAL', numeroPret:'PRE2021001', numeroTitreFoncier:'TF/DK/12345', natureBien:'IMMEUBLE_RAPPORT', ville:'Dakar',      quartier:'Plateau',          lot:'LOT-45',  ilot:'ILOT-B', zoneGeographique:'ZONE_A', statutOccupation:'LOUE_AVEC_BAIL',       valeurExpertiseInitiale:250000000, dateExpertise:addYears(now,-2), montantInscription:200000000, rangHypotheque:1, datePeremptionInscription:addYears(now,3),  soldePret:180000000 },
    { codeClient:'CLI002', nomClient:'AMADOU DIOP',                   numeroPret:'PRE2020002', numeroTitreFoncier:'TF/DK/67890', natureBien:'VILLA',            ville:'Dakar',      quartier:'Almadies',         lot:'LOT-12',  ilot:'ILOT-A', zoneGeographique:'ZONE_A', statutOccupation:'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale:180000000, dateExpertise:addYears(now,-4), montantInscription:150000000, rangHypotheque:1, datePeremptionInscription:addMonths(now,3),  soldePret:120000000 },
    { codeClient:'CLI003', nomClient:'ENTREPRISE BATIBUILD',          numeroPret:'PRE2022003', numeroTitreFoncier:'TF/TH/11223', natureBien:'USINE',            ville:'Thiès',      quartier:'Zone Industrielle',lot:'LOT-78',  ilot:null,     zoneGeographique:'ZONE_B', statutOccupation:'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale:350000000, dateExpertise:addYears(now,-1), montantInscription:300000000, rangHypotheque:1, datePeremptionInscription:addYears(now,4),  soldePret:280000000 },
    { codeClient:'CLI004', nomClient:'MARIE CLAIRE MENDY',            numeroPret:'PRE2021004', numeroTitreFoncier:'TF/ZG/44556', natureBien:'TERRAIN_NU',       ville:'Ziguinchor', quartier:'Boudody',          lot:'LOT-23',  ilot:'ILOT-C', zoneGeographique:'ZONE_C', statutOccupation:'LIBRE',               valeurExpertiseInitiale:45000000,  dateExpertise:addYears(now,-3), montantInscription:40000000,  rangHypotheque:1, datePeremptionInscription:addMonths(now,2),  soldePret:38000000 },
    { codeClient:'CLI005', nomClient:'GROUPE COMMERCIAL THIAW',       numeroPret:'PRE2023005', numeroTitreFoncier:'TF/DK/99887', natureBien:'BUREAU',           ville:'Dakar',      quartier:'Centre Ville',     lot:'LOT-67',  ilot:'ILOT-D', zoneGeographique:'ZONE_A', statutOccupation:'LOUE_AVEC_BAIL',       valeurExpertiseInitiale:420000000, dateExpertise:addMonths(now,-18),montantInscription:400000000, rangHypotheque:1, datePeremptionInscription:addYears(now,5),  soldePret:390000000 },
    { codeClient:'CLI006', nomClient:'IBRAHIMA FALL',                 numeroPret:'PRE2019006', numeroTitreFoncier:'TF/KL/33214', natureBien:'VILLA',            ville:'Kaolack',    quartier:'Médina',           lot:'LOT-34',  ilot:'ILOT-F', zoneGeographique:'ZONE_B', statutOccupation:'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale:95000000,  dateExpertise:addYears(now,-6), montantInscription:80000000,  rangHypotheque:2, datePeremptionInscription:addYears(now,-1),  soldePret:75000000 },
    { codeClient:'CLI007', nomClient:'AGROALIMENTAIRE CASAMANCE SA',  numeroPret:'PRE2022007', numeroTitreFoncier:'TF/ZG/77654', natureBien:'USINE',            ville:'Ziguinchor', quartier:'Lyndiane',         lot:'LOT-89',  ilot:null,     zoneGeographique:'ZONE_C', statutOccupation:'OCCUPE_PROPRIETAIRE', valeurExpertiseInitiale:220000000, dateExpertise:addYears(now,-2), montantInscription:200000000, rangHypotheque:1, datePeremptionInscription:addYears(now,3),  soldePret:195000000 },
    { codeClient:'CLI008', nomClient:'FATOU DIALLO WADE',             numeroPret:'PRE2023008', numeroTitreFoncier:'TF/DK/56781', natureBien:'VILLA',            ville:'Dakar',      quartier:'Mermoz',           lot:'LOT-101', ilot:'ILOT-G', zoneGeographique:'ZONE_A', statutOccupation:'LIBRE',               valeurExpertiseInitiale:135000000, dateExpertise:addMonths(now,-6), montantInscription:120000000, rangHypotheque:1, datePeremptionInscription:addYears(now,5),  soldePret:115000000 },
    { codeClient:'CLI009', nomClient:'COMPLEXE HÔTELIER TERANGA',     numeroPret:'PRE2020009', numeroTitreFoncier:'TF/MB/23456', natureBien:'IMMEUBLE_RAPPORT', ville:"M'Bour",     quartier:'Centre',           lot:'LOT-55',  ilot:'ILOT-H', zoneGeographique:'ZONE_B', statutOccupation:'LOUE_AVEC_BAIL',       valeurExpertiseInitiale:680000000, dateExpertise:addYears(now,-3), montantInscription:600000000, rangHypotheque:1, datePeremptionInscription:addMonths(now,5),  soldePret:550000000 },
    { codeClient:'CLI010', nomClient:'CHEIKH AHMADOU BAMBA TOURE',    numeroPret:'PRE2021010', numeroTitreFoncier:'TF/TH/98765', natureBien:'TERRAIN_NU',       ville:'Thiès',      quartier:'Randoulène',       lot:'LOT-17',  ilot:null,     zoneGeographique:'ZONE_B', statutOccupation:'LIBRE',               valeurExpertiseInitiale:28000000,  dateExpertise:addYears(now,-2), montantInscription:25000000,  rangHypotheque:1, datePeremptionInscription:addYears(now,3),  soldePret:22000000 },
  ];
  let created = 0;
  for (const h of list) {
    const existing = await prisma.hypotheque.findUnique({ where: { numeroPret: h.numeroPret } });
    if (!existing) { await prisma.hypotheque.create({ data: h }); created++; }
  }
  console.log(`Seed: ${created} hypothèques created (${list.length - created} already existed)`);
}

// ─── 3. CLIENTS CRM ───────────────────────────────────────────────────────────

async function seedClients() {
  const list = [
    // Entreprises
    { codeClient:'CLI001', typeClient:'ENTREPRISE', nom:'SOCIETE IMMOBILIERE DU SENEGAL', raisonSociale:'SIS SA', telephone:'+221 33 821 00 01', email:'contact@sis.sn',         adresse:'5 Rue du Commerce', ville:'Dakar',       statut:'ACTIF' },
    { codeClient:'CLI003', typeClient:'ENTREPRISE', nom:'ENTREPRISE BATIBUILD',            raisonSociale:'BATIBUILD SARL',  telephone:'+221 33 951 22 33', email:'dg@batibuild.sn',          adresse:'Zone Industrielle',  ville:'Thiès',       statut:'ACTIF' },
    { codeClient:'CLI005', typeClient:'ENTREPRISE', nom:'GROUPE COMMERCIAL THIAW',         raisonSociale:'GCT SA',          telephone:'+221 33 821 55 66', email:'direction@gct.sn',         adresse:'18 Av. Cheikh Anta Diop', ville:'Dakar',  statut:'ACTIF' },
    { codeClient:'CLI007', typeClient:'ENTREPRISE', nom:'AGROALIMENTAIRE CASAMANCE SA',    raisonSociale:'AGROCAS SA',      telephone:'+221 33 991 10 20', email:'admin@agrocas.sn',         adresse:'Lyndiane',           ville:'Ziguinchor',  statut:'ACTIF' },
    { codeClient:'CLI009', typeClient:'ENTREPRISE', nom:'COMPLEXE HÔTELIER TERANGA',       raisonSociale:'CHT SA',          telephone:'+221 33 957 88 99', email:'reservation@teranga.sn',   adresse:'Front de mer',       ville:"M'Bour",      statut:'ACTIF' },
    // Particuliers
    { codeClient:'CLI002', typeClient:'PARTICULIER', nom:'DIOP',    prenom:'Amadou',        telephone:'+221 77 500 10 20', email:'amadou.diop@gmail.com',  adresse:'Almadies, Villa 12', ville:'Dakar',       dateNaissance:new Date('1975-04-12'), numeroIdentite:'1 7504 12345 02', statut:'ACTIF' },
    { codeClient:'CLI004', typeClient:'PARTICULIER', nom:'MENDY',   prenom:'Marie Claire',  telephone:'+221 77 620 33 44', email:'mclaire.mendy@yahoo.fr', adresse:'Quartier Boudody',   ville:'Ziguinchor',  dateNaissance:new Date('1982-09-25'), numeroIdentite:'2 8209 67890 01', statut:'ACTIF' },
    { codeClient:'CLI006', typeClient:'PARTICULIER', nom:'FALL',    prenom:'Ibrahima',      telephone:'+221 76 401 55 66', email:'ibrahima.fall@hotmail.fr',adresse:'Médina, Rue 14',     ville:'Kaolack',     dateNaissance:new Date('1968-11-03'), numeroIdentite:'1 6811 11223 05', statut:'ACTIF' },
    { codeClient:'CLI008', typeClient:'PARTICULIER', nom:'DIALLO WADE', prenom:'Fatou',     telephone:'+221 78 300 77 88', email:'fatou.dw@gmail.com',     adresse:'Mermoz, Lot 101',    ville:'Dakar',       dateNaissance:new Date('1990-07-19'), numeroIdentite:'2 9007 33445 03', statut:'ACTIF' },
    { codeClient:'CLI010', typeClient:'PARTICULIER', nom:'TOURE',   prenom:'Cheikh Ahmadou Bamba', telephone:'+221 77 210 99 00', email:'cab.toure@gmail.com', adresse:'Randoulène',  ville:'Thiès',       dateNaissance:new Date('1978-02-28'), numeroIdentite:'1 7802 55667 04', statut:'ACTIF' },
    // 5 nouveaux clients sans hypothèque (pour enrichir le CRM)
    { codeClient:'CLI011', typeClient:'PARTICULIER', nom:'SARR',    prenom:'Pape Moussa',   telephone:'+221 77 100 20 30', email:'pm.sarr@gmail.com',      adresse:'HLM Grand Yoff',     ville:'Dakar',       dateNaissance:new Date('1985-06-14'), numeroIdentite:'1 8506 77889 01', statut:'ACTIF' },
    { codeClient:'CLI012', typeClient:'ENTREPRISE',  nom:'CONSTRUCTION DIENG FRERES',       raisonSociale:'CDF SARL',        telephone:'+221 33 832 40 50', email:'info@cdf-senegal.sn',      adresse:'Pikine Industriel',  ville:'Dakar',       statut:'ACTIF' },
    { codeClient:'CLI013', typeClient:'PARTICULIER', nom:'BA',      prenom:'Mariama',       telephone:'+221 70 550 66 77', email:'mariama.ba@orange.sn',   adresse:'Liberté VI, Apt 3B', ville:'Dakar',       dateNaissance:new Date('1992-12-01'), numeroIdentite:'2 9212 00112 06', statut:'ACTIF' },
    { codeClient:'CLI014', typeClient:'ENTREPRISE',  nom:'SENEGAL TRANSIT LOGISTIQUE',      raisonSociale:'STL SA',          telephone:'+221 33 849 70 80', email:'operations@stl.sn',        adresse:'Port de Dakar',      ville:'Dakar',       statut:'ACTIF' },
    { codeClient:'CLI015', typeClient:'PARTICULIER', nom:'GUEYE',   prenom:'Ousmane',       telephone:'+221 76 770 88 99', email:'ousmane.gueye@live.fr',  adresse:'Cité Lamy',          ville:'Thiès',       dateNaissance:new Date('1971-08-22'), numeroIdentite:'1 7108 34456 02', statut:'BLACKLISTE' },
  ];

  let created = 0;
  for (const c of list) {
    const { codeClient, typeClient, nom, prenom, raisonSociale, telephone, email, adresse, ville, dateNaissance, numeroIdentite, statut } = c;
    const existing = await prisma.client.findUnique({ where: { codeClient } });
    if (!existing) {
      await prisma.client.create({ data: { codeClient, typeClient, nom, prenom: prenom || null, raisonSociale: raisonSociale || null, telephone: telephone || null, email: email || null, adresse: adresse || null, ville: ville || null, dateNaissance: dateNaissance || null, numeroIdentite: numeroIdentite || null, statut } });
      created++;
    }
  }
  console.log(`Seed: ${created} clients created (${list.length - created} already existed)`);
}

// ─── 4. PRÊTS + ÉCHÉANCES ─────────────────────────────────────────────────────

async function seedPrets() {
  const pretDefs = [
    { numeroPret:'PRE2021001', codeClient:'CLI001', montantInitial:250000000, tauxInteret:6.5,  dureeMois:120, typeAmortissement:'LINEAIRE', dateDebut:'2021-01-15', statut:'ACTIF',     objet:'Financement immeuble de rapport Plateau' },
    { numeroPret:'PRE2020002', codeClient:'CLI002', montantInitial:160000000, tauxInteret:7.0,  dureeMois:84,  typeAmortissement:'LINEAIRE', dateDebut:'2020-06-01', statut:'ACTIF',     objet:'Acquisition villa Almadies' },
    { numeroPret:'PRE2022003', codeClient:'CLI003', montantInitial:350000000, tauxInteret:6.0,  dureeMois:180, typeAmortissement:'CONSTANT', dateDebut:'2022-03-01', statut:'ACTIF',     objet:'Extension usine Zone Industrielle Thiès' },
    { numeroPret:'PRE2021004', codeClient:'CLI004', montantInitial:42000000,  tauxInteret:8.5,  dureeMois:60,  typeAmortissement:'LINEAIRE', dateDebut:'2021-09-01', statut:'EN_DEFAUT', objet:'Achat terrain Ziguinchor' },
    { numeroPret:'PRE2023005', codeClient:'CLI005', montantInitial:450000000, tauxInteret:5.5,  dureeMois:240, typeAmortissement:'LINEAIRE', dateDebut:'2023-01-01', statut:'ACTIF',     objet:'Bureaux Centre Ville Dakar' },
    { numeroPret:'PRE2019006', codeClient:'CLI006', montantInitial:90000000,  tauxInteret:7.5,  dureeMois:120, typeAmortissement:'LINEAIRE', dateDebut:'2019-03-01', statut:'ACTIF',     objet:'Acquisition villa Kaolack' },
    { numeroPret:'PRE2022007', codeClient:'CLI007', montantInitial:230000000, tauxInteret:6.0,  dureeMois:120, typeAmortissement:'CONSTANT', dateDebut:'2022-06-01', statut:'ACTIF',     objet:'Modernisation usine agroalimentaire' },
    { numeroPret:'PRE2023008', codeClient:'CLI008', montantInitial:130000000, tauxInteret:6.5,  dureeMois:84,  typeAmortissement:'LINEAIRE', dateDebut:'2023-06-01', statut:'ACTIF',     objet:'Villa Mermoz résidence principale' },
    { numeroPret:'PRE2020009', codeClient:'CLI009', montantInitial:700000000, tauxInteret:5.0,  dureeMois:180, typeAmortissement:'IN_FINE',  dateDebut:'2020-01-01', statut:'RENEGOCIE', objet:'Construction complexe hôtelier M\'Bour' },
    { numeroPret:'PRE2021010', codeClient:'CLI010', montantInitial:25000000,  tauxInteret:8.0,  dureeMois:60,  typeAmortissement:'LINEAIRE', dateDebut:'2021-04-01', statut:'ACTIF',     objet:'Terrain Thiès résidentiel' },
  ];

  // Montants restants correspondant aux hypothèques existantes
  const soldes = { PRE2021001:180000000, PRE2020002:120000000, PRE2022003:280000000, PRE2021004:38000000, PRE2023005:390000000, PRE2019006:75000000, PRE2022007:195000000, PRE2023008:115000000, PRE2020009:550000000, PRE2021010:22000000 };

  let pretCreated = 0, echCreated = 0;

  for (const p of pretDefs) {
    const client = await prisma.client.findUnique({ where: { codeClient: p.codeClient } });
    if (!client) continue;

    let pret = await prisma.pret.findUnique({ where: { numeroPret: p.numeroPret } });
    if (!pret) {
      const dateDebut = new Date(p.dateDebut);
      const dateFin   = addMonths(dateDebut, p.dureeMois);
      pret = await prisma.pret.create({ data: {
        numeroPret: p.numeroPret,
        clientId:   client.id,
        montantInitial:    p.montantInitial,
        montantRestant:    soldes[p.numeroPret],
        tauxInteret:       p.tauxInteret,
        dureeMois:         p.dureeMois,
        typeAmortissement: p.typeAmortissement,
        dateDebut,
        dateFin,
        statut: p.statut,
        objet:  p.objet,
      }});
      pretCreated++;

      // Générer 6 échéances : 3 passées + 1 courante + 2 futures
      const capitalMensuel = Math.round(p.montantInitial / p.dureeMois);
      const interetMensuel = Math.round((soldes[p.numeroPret] * (p.tauxInteret / 100)) / 12);
      const totalMensuel   = capitalMensuel + interetMensuel;

      const echeances = [];
      for (let i = -3; i <= 2; i++) {
        const dateEch = addMonths(now, i);
        dateEch.setDate(15); // le 15 de chaque mois
        let statut = 'EN_ATTENTE';
        let montantPaye = 0;
        let datePaiement = null;

        if (i < 0) {
          // Passées
          if (p.statut === 'EN_DEFAUT' && i >= -2) {
            statut = 'IMPAYE'; // 2 derniers mois impayés pour le prêt en défaut
          } else {
            statut = 'PAYE';
            montantPaye = totalMensuel;
            datePaiement = new Date(dateEch);
            datePaiement.setDate(datePaiement.getDate() + Math.floor(Math.random() * 5)); // payé dans les 5 jours
          }
        } else if (i === 0) {
          if (p.statut === 'EN_DEFAUT') {
            statut = 'IMPAYE';
          } else {
            statut = 'EN_ATTENTE';
          }
        }
        // Calculer un numéro d'échéance plausible
        const monthsSinceStart = Math.round((now - new Date(p.dateDebut)) / (1000 * 60 * 60 * 24 * 30));
        const numeroEcheance = Math.max(1, monthsSinceStart + i);

        echeances.push({
          pretId: pret.id,
          numeroEcheance,
          dateEcheance: dateEch,
          capitalDu:    capitalMensuel,
          interetsDus:  interetMensuel,
          montantTotal: totalMensuel,
          capitalRembourse:   statut === 'PAYE' ? capitalMensuel : 0,
          interetsRembourses: statut === 'PAYE' ? interetMensuel : 0,
          montantPaye,
          statut,
          datePaiement,
        });
      }

      await prisma.echeancePret.createMany({ data: echeances });
      echCreated += echeances.length;
    }

    // Lier l'hypothèque au client et au prêt
    await prisma.hypotheque.updateMany({
      where: { numeroPret: p.numeroPret },
      data:  { clientId: client.id, pretId: pret.id },
    });
  }

  console.log(`Seed: ${pretCreated} prêts + ${echCreated} échéances créés`);
}

// ─── 5. WORKFLOW ──────────────────────────────────────────────────────────────

async function seedWorkflow() {
  const existing = await prisma.demandeValidation.count();
  if (existing > 0) {
    console.log(`Seed: ${existing} demandes workflow déjà présentes`);
    return;
  }

  const gest    = await prisma.user.findUnique({ where: { email: 'gestionnaire@banque.sn' } });
  const risques = await prisma.user.findUnique({ where: { email: 'risques@banque.sn' } });
  const admin   = await prisma.user.findUnique({ where: { email: 'admin@banque.sn' } });

  const hyp1 = await prisma.hypotheque.findUnique({ where: { numeroPret: 'PRE2021001' } });
  const hyp2 = await prisma.hypotheque.findUnique({ where: { numeroPret: 'PRE2020002' } });
  const hyp3 = await prisma.hypotheque.findUnique({ where: { numeroPret: 'PRE2022003' } });
  const hyp4 = await prisma.hypotheque.findUnique({ where: { numeroPret: 'PRE2021004' } });
  const hyp5 = await prisma.hypotheque.findUnique({ where: { numeroPret: 'PRE2023005' } });
  const pret1 = await prisma.pret.findUnique({ where: { numeroPret: 'PRE2020009' } });

  const etapesStd = (demandeId) => [
    { demandeId, numeroEtape:1, libelle:'Validation Gestionnaire',        roleRequis:'GESTIONNAIRE_GARANTIES', statut:'EN_ATTENTE' },
    { demandeId, numeroEtape:2, libelle:'Validation Responsable Risques', roleRequis:'RESPONSABLE_RISQUES',    statut:'EN_ATTENTE' },
    { demandeId, numeroEtape:3, libelle:'Approbation Direction',          roleRequis:'ADMIN',                  statut:'EN_ATTENTE' },
  ];

  const demandes = [];

  // 1 — EN_ATTENTE étape 1 : Réévaluation hypothèque CLI001
  const d1 = await prisma.demandeValidation.create({ data: {
    type:'REEVALUATION', entiteId: hyp1.id, entiteType:'Hypotheque',
    titre:'Réévaluation expertise — SIS SA (TF/DK/12345)',
    description:'Expertise initiale de 2021 à renouveler suite à la circulaire. Nouvelle estimation externe requise.',
    statut:'EN_ATTENTE', createurId: gest.id, etapeActuelle:1, totalEtapes:3,
  }});
  await prisma.etapeValidation.createMany({ data: etapesStd(d1.id) });
  demandes.push('Réévaluation CLI001 [EN_ATTENTE étape 1]');

  // 2 — EN_COURS étape 2 : Création hypothèque CLI004
  const d2 = await prisma.demandeValidation.create({ data: {
    type:'CREATION_HYPOTHEQUE', entiteId: hyp4.id, entiteType:'Hypotheque',
    titre:'Nouvelle prise en garantie — Marie Claire Mendy (TF/ZG/44556)',
    description:'Prêt habitat zone C, terrain nu. LTV à vérifier avant décaissement.',
    statut:'EN_COURS', createurId: gest.id, etapeActuelle:2, totalEtapes:3,
  }});
  await prisma.etapeValidation.createMany({ data: [
    { demandeId:d2.id, numeroEtape:1, libelle:'Validation Gestionnaire',        roleRequis:'GESTIONNAIRE_GARANTIES', statut:'APPROUVE', valideurId: gest.id,    commentaire:'Dossier complet, titre foncier vérifié.', dateTraitement: addMonths(now,-1) },
    { demandeId:d2.id, numeroEtape:2, libelle:'Validation Responsable Risques', roleRequis:'RESPONSABLE_RISQUES',    statut:'EN_ATTENTE' },
    { demandeId:d2.id, numeroEtape:3, libelle:'Approbation Direction',          roleRequis:'ADMIN',                  statut:'EN_ATTENTE' },
  ]});
  demandes.push('Création hypothèque CLI004 [EN_COURS étape 2]');

  // 3 — APPROUVE : Radiation hypothèque CLI002 (arrivée à terme)
  const d3 = await prisma.demandeValidation.create({ data: {
    type:'RADIATION', entiteId: hyp2.id, entiteType:'Hypotheque',
    titre:'Mainlevée hypothèque — Amadou Diop (TF/DK/67890)',
    description:'Prêt soldé anticipativement. Mainlevée à enregistrer à la Conservation foncière.',
    statut:'APPROUVE', createurId: gest.id, etapeActuelle:3, totalEtapes:3,
  }});
  await prisma.etapeValidation.createMany({ data: [
    { demandeId:d3.id, numeroEtape:1, libelle:'Validation Gestionnaire',        roleRequis:'GESTIONNAIRE_GARANTIES', statut:'APPROUVE', valideurId: gest.id,    commentaire:'Attestation de solde reçue.', dateTraitement: addMonths(now,-3) },
    { demandeId:d3.id, numeroEtape:2, libelle:'Validation Responsable Risques', roleRequis:'RESPONSABLE_RISQUES',    statut:'APPROUVE', valideurId: risques.id, commentaire:'OK pour radiation, encours soldé.', dateTraitement: addMonths(now,-2) },
    { demandeId:d3.id, numeroEtape:3, libelle:'Approbation Direction',          roleRequis:'ADMIN',                  statut:'APPROUVE', valideurId: admin.id,   commentaire:'Approuvé. Mainlevée autorisée.', dateTraitement: addMonths(now,-1) },
  ]});
  demandes.push('Mainlevée CLI002 [APPROUVE]');

  // 4 — REJETE : Réévaluation hypothèque CLI007 (dossier incomplet)
  const d4 = await prisma.demandeValidation.create({ data: {
    type:'REEVALUATION', entiteId: hyp3.id, entiteType:'Hypotheque',
    titre:'Réévaluation urgente — Batibuild (TF/TH/11223)',
    description:'Demande de réévaluation à la hausse suite aux travaux d\'extension.',
    statut:'REJETE', createurId: gest.id, etapeActuelle:2, totalEtapes:3,
  }});
  await prisma.etapeValidation.createMany({ data: [
    { demandeId:d4.id, numeroEtape:1, libelle:'Validation Gestionnaire',        roleRequis:'GESTIONNAIRE_GARANTIES', statut:'APPROUVE', valideurId: gest.id,    commentaire:'Rapport d\'expert fourni.', dateTraitement: addMonths(now,-2) },
    { demandeId:d4.id, numeroEtape:2, libelle:'Validation Responsable Risques', roleRequis:'RESPONSABLE_RISQUES',    statut:'REJETE',   valideurId: risques.id, commentaire:'Rapport expertise non signé par expert agréé Circulaire 04-2017. Dossier à compléter.', dateTraitement: addMonths(now,-1) },
    { demandeId:d4.id, numeroEtape:3, libelle:'Approbation Direction',          roleRequis:'ADMIN',                  statut:'EN_ATTENTE' },
  ]});
  demandes.push('Réévaluation Batibuild [REJETE étape 2]');

  // 5 — EN_ATTENTE étape 1 : Création prêt pour CLI005
  const d5 = await prisma.demandeValidation.create({ data: {
    type:'CREATION_PRET', entiteId: hyp5.id, entiteType:'Hypotheque',
    titre:'Décaissement complément prêt — Groupe Thiaw (PRE2023005)',
    description:'Demande de décaissement de la 2ème tranche du financement bureaux Centre Ville.',
    statut:'EN_ATTENTE', createurId: gest.id, etapeActuelle:1, totalEtapes:3,
  }});
  await prisma.etapeValidation.createMany({ data: etapesStd(d5.id) });
  demandes.push('Création prêt CLI005 [EN_ATTENTE étape 1]');

  // 6 — EN_COURS étape 3 : Renégociation prêt CLI009
  const d6 = await prisma.demandeValidation.create({ data: {
    type:'MODIFICATION_PRET', entiteId: pret1.id, entiteType:'Pret',
    titre:'Renégociation taux — Complexe Hôtelier Teranga (PRE2020009)',
    description:'Demande de réduction du taux de 5% à 4.25% suite à l\'évolution des conditions de marché.',
    statut:'EN_COURS', createurId: gest.id, etapeActuelle:3, totalEtapes:3,
  }});
  await prisma.etapeValidation.createMany({ data: [
    { demandeId:d6.id, numeroEtape:1, libelle:'Validation Gestionnaire',        roleRequis:'GESTIONNAIRE_GARANTIES', statut:'APPROUVE', valideurId: gest.id,    commentaire:'Analyse financière favorable.', dateTraitement: addMonths(now,-2) },
    { demandeId:d6.id, numeroEtape:2, libelle:'Validation Responsable Risques', roleRequis:'RESPONSABLE_RISQUES',    statut:'APPROUVE', valideurId: risques.id, commentaire:'Risque de crédit maîtrisé, historique de paiement excellent.', dateTraitement: addMonths(now,-1) },
    { demandeId:d6.id, numeroEtape:3, libelle:'Approbation Direction',          roleRequis:'ADMIN',                  statut:'EN_ATTENTE' },
  ]});
  demandes.push('Renégociation CHT [EN_COURS étape 3 — en attente direction]');

  console.log(`Seed: ${demandes.length} demandes workflow créées`);
  demandes.forEach(d => console.log(`  - ${d}`));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== SGH v2 — Database Seed ===\n');
  await seedUsers();
  await seedHypotheques();
  await seedClients();
  await seedPrets();
  await seedWorkflow();
  console.log('\n=== Seed terminé avec succès ===\n');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
