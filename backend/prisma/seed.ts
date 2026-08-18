import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('Admin@1234', 10);
  const gestPassword = await bcrypt.hash('Gest@1234', 10);
  const risquesPassword = await bcrypt.hash('Risques@1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@banque.sn' },
    update: {},
    create: {
      email: 'admin@banque.sn',
      password: adminPassword,
      nom: 'Diallo',
      prenom: 'Mamadou',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'gestionnaire@banque.sn' },
    update: {},
    create: {
      email: 'gestionnaire@banque.sn',
      password: gestPassword,
      nom: 'Ndiaye',
      prenom: 'Fatou',
      role: 'GESTIONNAIRE_GARANTIES',
    },
  });

  await prisma.user.upsert({
    where: { email: 'risques@banque.sn' },
    update: {},
    create: {
      email: 'risques@banque.sn',
      password: risquesPassword,
      nom: 'Sy',
      prenom: 'Ousmane',
      role: 'RESPONSABLE_RISQUES',
    },
  });

  console.log('Users created');

  // Helper to add months to a date
  const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const addYears = (date: Date, years: number): Date => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  const today = new Date();

  const hypotheques = [
    {
      codeClient: 'CLI001',
      nomClient: 'SOCIETE IMMOBILIERE DU SENEGAL',
      numeroPret: 'PRE2021001',
      numeroTitreFoncier: 'TF/DK/12345',
      natureBien: 'IMMEUBLE_RAPPORT',
      ville: 'Dakar',
      quartier: 'Plateau',
      lot: 'LOT-45',
      ilot: 'ILOT-B',
      zoneGeographique: 'ZONE_A',
      statutOccupation: 'LOUE_AVEC_BAIL',
      valeurExpertiseInitiale: 250000000,
      dateExpertise: addYears(today, -2),
      montantInscription: 200000000,
      rangHypotheque: 1,
      datePeremptionInscription: addYears(today, 3),
      soldePret: 180000000,
    },
    {
      codeClient: 'CLI002',
      nomClient: 'AMADOU DIOP',
      numeroPret: 'PRE2020002',
      numeroTitreFoncier: 'TF/DK/67890',
      natureBien: 'VILLA',
      ville: 'Dakar',
      quartier: 'Almadies',
      lot: 'LOT-12',
      ilot: 'ILOT-A',
      zoneGeographique: 'ZONE_A',
      statutOccupation: 'OCCUPE_PROPRIETAIRE',
      valeurExpertiseInitiale: 180000000,
      dateExpertise: addYears(today, -4),
      montantInscription: 150000000,
      rangHypotheque: 1,
      datePeremptionInscription: addMonths(today, 3),
      soldePret: 120000000,
    },
    {
      codeClient: 'CLI003',
      nomClient: 'ENTREPRISE BATIBUILD',
      numeroPret: 'PRE2022003',
      numeroTitreFoncier: 'TF/TH/11223',
      natureBien: 'USINE',
      ville: 'Thiès',
      quartier: 'Zone Industrielle',
      lot: 'LOT-78',
      ilot: null,
      zoneGeographique: 'ZONE_B',
      statutOccupation: 'OCCUPE_PROPRIETAIRE',
      valeurExpertiseInitiale: 350000000,
      dateExpertise: addYears(today, -1),
      montantInscription: 300000000,
      rangHypotheque: 1,
      datePeremptionInscription: addYears(today, 4),
      soldePret: 280000000,
    },
    {
      codeClient: 'CLI004',
      nomClient: 'MARIE CLAIRE MENDY',
      numeroPret: 'PRE2021004',
      numeroTitreFoncier: 'TF/ZG/44556',
      natureBien: 'TERRAIN_NU',
      ville: 'Ziguinchor',
      quartier: 'Boudody',
      lot: 'LOT-23',
      ilot: 'ILOT-C',
      zoneGeographique: 'ZONE_C',
      statutOccupation: 'LIBRE',
      valeurExpertiseInitiale: 45000000,
      dateExpertise: addYears(today, -3),
      montantInscription: 40000000,
      rangHypotheque: 1,
      datePeremptionInscription: addMonths(today, 2),
      soldePret: 38000000,
    },
    {
      codeClient: 'CLI005',
      nomClient: 'GROUPE COMMERCIAL THIAW',
      numeroPret: 'PRE2023005',
      numeroTitreFoncier: 'TF/DK/99887',
      natureBien: 'BUREAU',
      ville: 'Dakar',
      quartier: 'Centre Ville',
      lot: 'LOT-67',
      ilot: 'ILOT-D',
      zoneGeographique: 'ZONE_A',
      statutOccupation: 'LOUE_AVEC_BAIL',
      valeurExpertiseInitiale: 420000000,
      dateExpertise: addMonths(today, -18),
      montantInscription: 400000000,
      rangHypotheque: 1,
      datePeremptionInscription: addYears(today, 5),
      soldePret: 390000000,
    },
    {
      codeClient: 'CLI006',
      nomClient: 'IBRAHIMA FALL',
      numeroPret: 'PRE2019006',
      numeroTitreFoncier: 'TF/KL/33214',
      natureBien: 'VILLA',
      ville: 'Kaolack',
      quartier: 'Médina',
      lot: 'LOT-34',
      ilot: 'ILOT-F',
      zoneGeographique: 'ZONE_B',
      statutOccupation: 'OCCUPE_PROPRIETAIRE',
      valeurExpertiseInitiale: 95000000,
      dateExpertise: addYears(today, -6),
      montantInscription: 80000000,
      rangHypotheque: 2,
      datePeremptionInscription: addYears(today, -1),
      soldePret: 75000000,
    },
    {
      codeClient: 'CLI007',
      nomClient: 'AGROALIMENTAIRE CASAMANCE SA',
      numeroPret: 'PRE2022007',
      numeroTitreFoncier: 'TF/ZG/77654',
      natureBien: 'USINE',
      ville: 'Ziguinchor',
      quartier: 'Lyndiane',
      lot: 'LOT-89',
      ilot: null,
      zoneGeographique: 'ZONE_C',
      statutOccupation: 'OCCUPE_PROPRIETAIRE',
      valeurExpertiseInitiale: 220000000,
      dateExpertise: addYears(today, -2),
      montantInscription: 200000000,
      rangHypotheque: 1,
      datePeremptionInscription: addYears(today, 3),
      soldePret: 195000000,
    },
    {
      codeClient: 'CLI008',
      nomClient: 'FATOU DIALLO WADE',
      numeroPret: 'PRE2023008',
      numeroTitreFoncier: 'TF/DK/56781',
      natureBien: 'VILLA',
      ville: 'Dakar',
      quartier: 'Mermoz',
      lot: 'LOT-101',
      ilot: 'ILOT-G',
      zoneGeographique: 'ZONE_A',
      statutOccupation: 'LIBRE',
      valeurExpertiseInitiale: 135000000,
      dateExpertise: addMonths(today, -6),
      montantInscription: 120000000,
      rangHypotheque: 1,
      datePeremptionInscription: addYears(today, 5),
      soldePret: 115000000,
    },
    {
      codeClient: 'CLI009',
      nomClient: 'COMPLEXE HÔTELIER TERANGA',
      numeroPret: 'PRE2020009',
      numeroTitreFoncier: 'TF/MB/23456',
      natureBien: 'IMMEUBLE_RAPPORT',
      ville: 'M\'Bour',
      quartier: 'Centre',
      lot: 'LOT-55',
      ilot: 'ILOT-H',
      zoneGeographique: 'ZONE_B',
      statutOccupation: 'LOUE_AVEC_BAIL',
      valeurExpertiseInitiale: 680000000,
      dateExpertise: addYears(today, -3),
      montantInscription: 600000000,
      rangHypotheque: 1,
      datePeremptionInscription: addMonths(today, 5),
      soldePret: 550000000,
    },
    {
      codeClient: 'CLI010',
      nomClient: 'CHEIKH AHMADOU BAMBA TOURE',
      numeroPret: 'PRE2021010',
      numeroTitreFoncier: 'TF/TH/98765',
      natureBien: 'TERRAIN_NU',
      ville: 'Thiès',
      quartier: 'Randoulène',
      lot: 'LOT-17',
      ilot: null,
      zoneGeographique: 'ZONE_B',
      statutOccupation: 'LIBRE',
      valeurExpertiseInitiale: 28000000,
      dateExpertise: addYears(today, -2),
      montantInscription: 25000000,
      rangHypotheque: 1,
      datePeremptionInscription: addYears(today, 3),
      soldePret: 22000000,
    },
  ];

  for (const h of hypotheques) {
    const existing = await prisma.hypotheque.findUnique({ where: { numeroPret: h.numeroPret } });
    if (!existing) {
      await prisma.hypotheque.create({ data: h });
    }
  }

  console.log('Hypothèques created');
  console.log('Seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  Admin:        admin@banque.sn        / Admin@1234');
  console.log('  Gestionnaire: gestionnaire@banque.sn / Gest@1234');
  console.log('  Risques:      risques@banque.sn       / Risques@1234');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
