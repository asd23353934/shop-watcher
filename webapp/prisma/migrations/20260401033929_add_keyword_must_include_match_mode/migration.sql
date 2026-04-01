-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN     "matchMode" TEXT NOT NULL DEFAULT 'any',
ADD COLUMN     "mustInclude" TEXT[] DEFAULT ARRAY[]::TEXT[];
