-- v2: CRM Client + Loan Management + Workflow de validation

-- ─── Nouveaux Enums ───────────────────────────────────────────────────────────

CREATE TYPE "TypeClient" AS ENUM ('PARTICULIER', 'ENTREPRISE');
CREATE TYPE "StatutClient" AS ENUM ('ACTIF', 'INACTIF', 'BLACKLISTE');
CREATE TYPE "TypeAmortissement" AS ENUM ('LINEAIRE', 'CONSTANT', 'IN_FINE');
CREATE TYPE "StatutPret" AS ENUM ('ACTIF', 'EN_DEFAUT', 'CLOTURE', 'RENEGOCIE', 'SOLDE');
CREATE TYPE "StatutEcheance" AS ENUM ('EN_ATTENTE', 'PAYE', 'PARTIEL', 'IMPAYE');
CREATE TYPE "TypeDemande" AS ENUM ('CREATION_HYPOTHEQUE', 'REEVALUATION', 'RADIATION', 'CREATION_PRET', 'MODIFICATION_PRET');
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'APPROUVE', 'REJETE', 'ANNULE');
CREATE TYPE "StatutEtape" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REJETE');

-- ─── Module CRM Client ────────────────────────────────────────────────────────

CREATE TABLE "Client" (
    "id"             SERIAL NOT NULL,
    "codeClient"     TEXT NOT NULL,
    "typeClient"     "TypeClient" NOT NULL DEFAULT 'PARTICULIER',
    "nom"            TEXT NOT NULL,
    "prenom"         TEXT,
    "raisonSociale"  TEXT,
    "telephone"      TEXT,
    "email"          TEXT,
    "adresse"        TEXT,
    "ville"          TEXT,
    "dateNaissance"  DATE,
    "numeroIdentite" TEXT,
    "statut"         "StatutClient" NOT NULL DEFAULT 'ACTIF',
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Client_codeClient_key" ON "Client"("codeClient");
CREATE INDEX "Client_nom_idx" ON "Client"("nom");
CREATE INDEX "Client_codeClient_idx" ON "Client"("codeClient");
CREATE INDEX "Client_statut_idx" ON "Client"("statut");
CREATE INDEX "Client_typeClient_idx" ON "Client"("typeClient");

-- ─── Module Loan Management ───────────────────────────────────────────────────

CREATE TABLE "Pret" (
    "id"                SERIAL NOT NULL,
    "numeroPret"        TEXT NOT NULL,
    "clientId"          INTEGER NOT NULL,
    "montantInitial"    DECIMAL(18, 2) NOT NULL,
    "montantRestant"    DECIMAL(18, 2) NOT NULL,
    "tauxInteret"       DECIMAL(7, 4) NOT NULL,
    "dureeMois"         INTEGER NOT NULL,
    "typeAmortissement" "TypeAmortissement" NOT NULL DEFAULT 'LINEAIRE',
    "dateDebut"         TIMESTAMPTZ NOT NULL,
    "dateFin"           TIMESTAMPTZ NOT NULL,
    "statut"            "StatutPret" NOT NULL DEFAULT 'ACTIF',
    "objet"             TEXT,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Pret_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pret_numeroPret_key" ON "Pret"("numeroPret");
CREATE INDEX "Pret_clientId_idx" ON "Pret"("clientId");
CREATE INDEX "Pret_statut_idx" ON "Pret"("statut");
CREATE INDEX "Pret_dateDebut_idx" ON "Pret"("dateDebut");
CREATE INDEX "Pret_numeroPret_idx" ON "Pret"("numeroPret");

CREATE TABLE "EcheancePret" (
    "id"                 SERIAL NOT NULL,
    "pretId"             INTEGER NOT NULL,
    "numeroEcheance"     INTEGER NOT NULL,
    "dateEcheance"       TIMESTAMPTZ NOT NULL,
    "capitalDu"          DECIMAL(18, 2) NOT NULL,
    "interetsDus"        DECIMAL(18, 2) NOT NULL,
    "montantTotal"       DECIMAL(18, 2) NOT NULL,
    "capitalRembourse"   DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "interetsRembourses" DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "penalites"          DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "montantPaye"        DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "statut"             "StatutEcheance" NOT NULL DEFAULT 'EN_ATTENTE',
    "datePaiement"       TIMESTAMPTZ,
    "commentaire"        TEXT,

    CONSTRAINT "EcheancePret_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EcheancePret_pretId_numeroEcheance_key" ON "EcheancePret"("pretId", "numeroEcheance");
CREATE INDEX "EcheancePret_pretId_idx" ON "EcheancePret"("pretId");
CREATE INDEX "EcheancePret_pretId_statut_idx" ON "EcheancePret"("pretId", "statut");
CREATE INDEX "EcheancePret_dateEcheance_idx" ON "EcheancePret"("dateEcheance");
CREATE INDEX "EcheancePret_statut_idx" ON "EcheancePret"("statut");

-- ─── Module Workflow ──────────────────────────────────────────────────────────

CREATE TABLE "DemandeValidation" (
    "id"            SERIAL NOT NULL,
    "type"          "TypeDemande" NOT NULL,
    "entiteId"      INTEGER NOT NULL,
    "entiteType"    TEXT NOT NULL,
    "titre"         TEXT NOT NULL,
    "description"   TEXT,
    "statut"        "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "createurId"    INTEGER NOT NULL,
    "etapeActuelle" INTEGER NOT NULL DEFAULT 1,
    "totalEtapes"   INTEGER NOT NULL DEFAULT 3,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMPTZ NOT NULL,

    CONSTRAINT "DemandeValidation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DemandeValidation_statut_idx" ON "DemandeValidation"("statut");
CREATE INDEX "DemandeValidation_createurId_idx" ON "DemandeValidation"("createurId");
CREATE INDEX "DemandeValidation_entiteId_entiteType_idx" ON "DemandeValidation"("entiteId", "entiteType");
CREATE INDEX "DemandeValidation_type_idx" ON "DemandeValidation"("type");

CREATE TABLE "EtapeValidation" (
    "id"             SERIAL NOT NULL,
    "demandeId"      INTEGER NOT NULL,
    "numeroEtape"    INTEGER NOT NULL,
    "libelle"        TEXT NOT NULL,
    "roleRequis"     "UserRole" NOT NULL,
    "valideurId"     INTEGER,
    "statut"         "StatutEtape" NOT NULL DEFAULT 'EN_ATTENTE',
    "commentaire"    TEXT,
    "dateTraitement" TIMESTAMPTZ,
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EtapeValidation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EtapeValidation_demandeId_numeroEtape_key" ON "EtapeValidation"("demandeId", "numeroEtape");
CREATE INDEX "EtapeValidation_demandeId_idx" ON "EtapeValidation"("demandeId");
CREATE INDEX "EtapeValidation_statut_idx" ON "EtapeValidation"("statut");
CREATE INDEX "EtapeValidation_roleRequis_idx" ON "EtapeValidation"("roleRequis");

-- ─── Modifications Hypotheque (FK vers Client et Pret) ────────────────────────

ALTER TABLE "Hypotheque" ADD COLUMN "clientId" INTEGER;
ALTER TABLE "Hypotheque" ADD COLUMN "pretId" INTEGER;
CREATE INDEX "Hypotheque_clientId_idx" ON "Hypotheque"("clientId");
CREATE INDEX "Hypotheque_pretId_idx" ON "Hypotheque"("pretId");

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

ALTER TABLE "Pret" ADD CONSTRAINT "Pret_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EcheancePret" ADD CONSTRAINT "EcheancePret_pretId_fkey"
    FOREIGN KEY ("pretId") REFERENCES "Pret"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DemandeValidation" ADD CONSTRAINT "DemandeValidation_createurId_fkey"
    FOREIGN KEY ("createurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EtapeValidation" ADD CONSTRAINT "EtapeValidation_demandeId_fkey"
    FOREIGN KEY ("demandeId") REFERENCES "DemandeValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EtapeValidation" ADD CONSTRAINT "EtapeValidation_valideurId_fkey"
    FOREIGN KEY ("valideurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Hypotheque" ADD CONSTRAINT "Hypotheque_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Hypotheque" ADD CONSTRAINT "Hypotheque_pretId_fkey"
    FOREIGN KEY ("pretId") REFERENCES "Pret"("id") ON DELETE SET NULL ON UPDATE CASCADE;
