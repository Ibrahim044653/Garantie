-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GESTIONNAIRE_GARANTIES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Hypotheque" (
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
    "montantInscription" REAL NOT NULL,
    "rangHypotheque" INTEGER NOT NULL DEFAULT 1,
    "datePeremptionInscription" DATETIME NOT NULL,
    "soldePret" REAL NOT NULL,
    "pjExpertisePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HistoriqueValeur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hypothequeId" INTEGER NOT NULL,
    "valeurExpertise" REAL NOT NULL,
    "dateExpertise" DATETIME NOT NULL,
    "zoneGeographique" TEXT NOT NULL,
    "statutOccupation" TEXT NOT NULL,
    "decoteZone" REAL NOT NULL,
    "decoteAnciennete" REAL NOT NULL,
    "decoteOccupation" REAL NOT NULL,
    "decoteTotale" REAL NOT NULL,
    "valeurNetteCouverture" REAL NOT NULL,
    "loanToValue" REAL NOT NULL,
    "modifiePar" TEXT NOT NULL,
    "dateModification" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif" TEXT,
    CONSTRAINT "HistoriqueValeur_hypothequeId_fkey" FOREIGN KEY ("hypothequeId") REFERENCES "Hypotheque" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hypothequeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dateEcheance" DATETIME,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_hypothequeId_fkey" FOREIGN KEY ("hypothequeId") REFERENCES "Hypotheque" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Hypotheque_numeroPret_key" ON "Hypotheque"("numeroPret");
