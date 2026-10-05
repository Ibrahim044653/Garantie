-- CreateTable: ReevaluationPhoto — contenu des photos stocke en base.
-- Le systeme de fichiers des hebergements utilises est ephemere : les photos
-- ecrites sur disque devenaient irrecuperables, et aucune route ne servait le
-- dossier uploads. Meme approche que DocumentVersion.fileContent.
CREATE TABLE "ReevaluationPhoto" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "fileContent" BYTEA NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReevaluationPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReevaluationPhoto_uploadedById_idx" ON "ReevaluationPhoto"("uploadedById");

-- AddForeignKey
ALTER TABLE "ReevaluationPhoto" ADD CONSTRAINT "ReevaluationPhoto_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
