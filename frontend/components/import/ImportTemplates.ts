export const TEMPLATES = {
  hypotheques: `codeClient,nomClient,numeroPret,numeroTitreFoncier,natureBien,ville,quartier,zoneGeographique,statutOccupation,valeurExpertiseInitiale,dateExpertise,montantInscription,datePeremptionInscription,soldePret,dateEcheancePret
C001,Jean Dupont,PRE-2024-001,TF/DKR/12345,VILLA,Dakar,Plateau,ZONE_A,LIBRE,50000000,01/01/2023,50000000,01/01/2033,30000000,01/01/2034`,

  clients: `codeClient,nom,prenom,typeClient,telephone,email,adresse,ville
C001,Dupont,Jean,PARTICULIER,+221 77 000 0000,jean.dupont@email.com,Rue 10 Plateau,Dakar`,

  prets: `numeroPret,codeClient,montant,typeAmortissement,tauxInteret,duree,dateDebut,statut
PRE-2024-001,C001,30000000,LINEAIRE,8.5,120,01/01/2024,ACTIF`,
};

export type ImportType = keyof typeof TEMPLATES;
