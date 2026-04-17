-- CreateTable
CREATE TABLE "PlatformCanaryStatus" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "domIntact" BOOLEAN NOT NULL DEFAULT true,
    "consecutiveEmptyCount" INTEGER NOT NULL DEFAULT 0,
    "healthState" TEXT NOT NULL DEFAULT 'healthy',
    "unhealthyReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCanaryStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCanaryStatus_platform_key" ON "PlatformCanaryStatus"("platform");
