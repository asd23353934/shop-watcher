-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN     "discordWebhookUrl" TEXT,
ADD COLUMN     "maxNotifyPerScan" INTEGER,
ADD COLUMN     "sellerBlocklist" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "NotificationSetting" ADD COLUMN     "globalSellerBlocklist" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SeenItem" ADD COLUMN     "itemName" TEXT,
ADD COLUMN     "itemUrl" TEXT;

-- CreateTable
CREATE TABLE "CircleFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "circleName" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CircleFollow_userId_platform_circleId_key" ON "CircleFollow"("userId", "platform", "circleId");

-- AddForeignKey
ALTER TABLE "CircleFollow" ADD CONSTRAINT "CircleFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
