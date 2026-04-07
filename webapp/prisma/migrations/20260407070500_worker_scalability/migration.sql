-- CreateTable
CREATE TABLE "PlatformScanStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "lastSuccess" TIMESTAMP(3),
    "lastError" TEXT,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformScanStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformScanStatus_userId_platform_key" ON "PlatformScanStatus"("userId", "platform");

-- AddForeignKey
ALTER TABLE "PlatformScanStatus" ADD CONSTRAINT "PlatformScanStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
