-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hypotheque" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codeClient" TEXT NOT NULL,
    "nomClient" TEXT NOT NULL,
    "numeroPret" TEXT NOT NULL,
    "numeroTitreFoncier" TEXT NOT NULL,
    "natureBien" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "quartier" TEXT,
    "lot" TEXT,
    "ilot" TEXT,
    "zoneGeographique" TEXT NOT NULL,
    "statutOccupation" TEXT NOT NULL,
    "valeurExpertiseInitiale" REAL NOT NULL,
    "dateExpertise" DATETIME NOT NULL,
    "montantInscription" REAL NOT NULL DEFAULT 0,
    "rangHypotheque" INTEGER NOT NULL DEFAULT 1,
    "datePeremptionInscription" DATETIME NOT NULL,
    "soldePret" REAL NOT NULL DEFAULT 0,
    "dateEcheancePret" DATETIME,
    "pjExpertisePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Hypotheque" ("codeClient", "createdAt", "dateEcheancePret", "dateExpertise", "datePeremptionInscription", "id", "ilot", "lot", "montantInscription", "natureBien", "nomClient", "numeroPret", "numeroTitreFoncier", "pjExpertisePath", "quartier", "rangHypotheque", "soldePret", "statutOccupation", "updatedAt", "valeurExpertiseInitiale", "ville", "zoneGeographique") SELECT "codeClient", "createdAt", "dateEcheancePret", "dateExpertise", "datePeremptionInscription", "id", "ilot", "lot", "montantInscription", "natureBien", "nomClient", "numeroPret", "numeroTitreFoncier", "pjExpertisePath", "quartier", "rangHypotheque", "soldePret", "statutOccupation", "updatedAt", "valeurExpertiseInitiale", "ville", "zoneGeographique" FROM "Hypotheque";
DROP TABLE "Hypotheque";
ALTER TABLE "new_Hypotheque" RENAME TO "Hypotheque";
CREATE UNIQUE INDEX "Hypotheque_numeroPret_key" ON "Hypotheque"("numeroPret");
CREATE INDEX "Hypotheque_nomClient_idx" ON "Hypotheque"("nomClient");
CREATE INDEX "Hypotheque_codeClient_idx" ON "Hypotheque"("codeClient");
CREATE INDEX "Hypotheque_ville_idx" ON "Hypotheque"("ville");
CREATE INDEX "Hypotheque_zoneGeographique_idx" ON "Hypotheque"("zoneGeographique");
CREATE INDEX "Hypotheque_rangHypotheque_idx" ON "Hypotheque"("rangHypotheque");
CREATE INDEX "Hypotheque_dateExpertise_idx" ON "Hypotheque"("dateExpertise");
CREATE INDEX "Hypotheque_datePeremptionInscription_idx" ON "Hypotheque"("datePeremptionInscription");
CREATE INDEX "Hypotheque_createdAt_idx" ON "Hypotheque"("createdAt");
CREATE UNIQUE INDEX "Hypotheque_numeroTitreFoncier_rangHypotheque_key" ON "Hypotheque"("numeroTitreFoncier", "rangHypotheque");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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

-- CreateIndex
CREATE INDEX "HistoriqueValeur_hypothequeId_idx" ON "HistoriqueValeur"("hypothequeId");

-- CreateIndex
CREATE INDEX "HistoriqueValeur_hypothequeId_dateModification_idx" ON "HistoriqueValeur"("hypothequeId", "dateModification");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
