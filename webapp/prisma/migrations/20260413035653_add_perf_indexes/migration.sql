-- CreateIndex
CREATE INDEX "CircleFollow_userId_createdAt_idx" ON "CircleFollow"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Keyword_userId_createdAt_idx" ON "Keyword"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PlatformScanStatus_userId_idx" ON "PlatformScanStatus"("userId");

-- CreateIndex
CREATE INDEX "SeenItem_userId_platform_firstSeen_idx" ON "SeenItem"("userId", "platform", "firstSeen" DESC);
