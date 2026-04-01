-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN     "blocklist" TEXT[] DEFAULT ARRAY[]::TEXT[];
