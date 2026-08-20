-- AlterTable: add fileContent column and set default for filePath
ALTER TABLE "DocumentVersion" ADD COLUMN "fileContent" BYTEA;
ALTER TABLE "DocumentVersion" ALTER COLUMN "filePath" SET DEFAULT '';
