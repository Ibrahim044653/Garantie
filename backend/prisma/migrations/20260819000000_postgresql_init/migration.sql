-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTIONNAIRE_GARANTIES', 'RESPONSABLE_RISQUES', 'ENGAGEMENTS', 'AUDIT_INTERNE');
-- CreateEnum
CREATE TYPE "NatureBien" AS ENUM ('TERRAIN_NU', 'VILLA', 'IMMEUBLE_RAPPORT', 'USINE', 'BUREAU');
-- CreateEnum
CREATE TYPE "ZoneGeographique" AS ENUM ('ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_INDUSTRIELLE');
-- CreateEnum
CREATE TYPE "StatutOccupation" AS ENUM ('LIBRE', 'OCCUPE_PROPRIETAIRE', 'LOUE_AVEC_BAIL');
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SHORTFALL', 'EXPERTISE_EXPIREE', 'EXPERTISE_BIENTOT_EXPIREE', 'EXPERTISE_RENOUVELLEMENT', 'INSCRIPTION_PERIMEE');
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'GESTIONNAIRE_GARANTIES',
    "mfaSecret" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Hypotheque" (
    "id" SERIAL NOT NULL,
    "codeClient" TEXT NOT NULL,
    "nomClient" TEXT NOT NULL,
    "numeroPret" TEXT NOT NULL,
    "numeroTitreFoncier" TEXT NOT NULL,
    "natureBien" "NatureBien" NOT NULL,
    "ville" TEXT NOT NULL,
    "quartier" TEXT,
    "lot" TEXT,
    "ilot" TEXT,
    "zoneGeographique" "ZoneGeographique" NOT NULL,
    "statutOccupation" "StatutOccupation" NOT NULL,
    "valeurExpertiseInitiale" DECIMAL(18,2) NOT NULL,
    "dateExpertise" TIMESTAMPTZ NOT NULL,
    "montantInscription" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "rangHypotheque" INTEGER NOT NULL DEFAULT 1,
    "datePeremptionInscription" TIMESTAMPTZ NOT NULL,
    "soldePret" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dateEcheancePret" TIMESTAMPTZ,
    "pjExpertisePath" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Hypotheque_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "HistoriqueValeur" (
    "id" SERIAL NOT NULL,
    "hypothequeId" INTEGER NOT NULL,
    "valeurExpertise" DECIMAL(18,2) NOT NULL,
    "dateExpertise" TIMESTAMPTZ NOT NULL,
    "zoneGeographique" "ZoneGeographique" NOT NULL,
    "statutOccupation" "StatutOccupation" NOT NULL,
    "decoteZone" DECIMAL(5,2) NOT NULL,
    "decoteAnciennete" DECIMAL(5,2) NOT NULL,
    "decoteOccupation" DECIMAL(5,2) NOT NULL,
    "decoteTotale" DECIMAL(5,2) NOT NULL,
    "valeurNetteCouverture" DECIMAL(18,2) NOT NULL,
    "loanToValue" DECIMAL(10,4) NOT NULL,
    "modifiePar" TEXT NOT NULL,
    "motif" TEXT,
    "dateModification" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoriqueValeur_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "hypothequeId" INTEGER NOT NULL,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "dateEcheance" TIMESTAMPTZ,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
-- CreateIndex
CREATE UNIQUE INDEX "Hypotheque_numeroPret_key" ON "Hypotheque"("numeroPret");
-- CreateIndex
CREATE INDEX "Hypotheque_nomClient_idx" ON "Hypotheque"("nomClient");
-- CreateIndex
CREATE INDEX "Hypotheque_codeClient_idx" ON "Hypotheque"("codeClient");
-- CreateIndex
CREATE INDEX "Hypotheque_ville_idx" ON "Hypotheque"("ville");
-- CreateIndex
CREATE INDEX "Hypotheque_zoneGeographique_idx" ON "Hypotheque"("zoneGeographique");
-- CreateIndex
CREATE INDEX "Hypotheque_rangHypotheque_idx" ON "Hypotheque"("rangHypotheque");
-- CreateIndex
CREATE INDEX "Hypotheque_dateExpertise_idx" ON "Hypotheque"("dateExpertise");
-- CreateIndex
CREATE INDEX "Hypotheque_datePeremptionInscription_idx" ON "Hypotheque"("datePeremptionInscription");
-- CreateIndex
CREATE INDEX "Hypotheque_createdAt_idx" ON "Hypotheque"("createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "Hypotheque_numeroTitreFoncier_rangHypotheque_key" ON "Hypotheque"("numeroTitreFoncier", "rangHypotheque");
-- CreateIndex
CREATE INDEX "HistoriqueValeur_hypothequeId_idx" ON "HistoriqueValeur"("hypothequeId");
-- CreateIndex
CREATE INDEX "HistoriqueValeur_hypothequeId_dateModification_idx" ON "HistoriqueValeur"("hypothequeId", "dateModification");
-- CreateIndex
CREATE INDEX "Alert_hypothequeId_idx" ON "Alert"("hypothequeId");
-- CreateIndex
CREATE INDEX "Alert_hypothequeId_lu_idx" ON "Alert"("hypothequeId", "lu");
-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");
-- CreateIndex
CREATE INDEX "Alert_lu_idx" ON "Alert"("lu");
-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");
-- AddForeignKey
ALTER TABLE "HistoriqueValeur" ADD CONSTRAINT "HistoriqueValeur_hypothequeId_fkey" FOREIGN KEY ("hypothequeId") REFERENCES "Hypotheque"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_hypothequeId_fkey" FOREIGN KEY ("hypothequeId") REFERENCES "Hypotheque"("id") ON DELETE CASCADE ON UPDATE CASCADE;
