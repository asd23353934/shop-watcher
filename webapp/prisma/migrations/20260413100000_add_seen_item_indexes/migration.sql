-- Add indexes to SeenItem for history query performance
CREATE INDEX "SeenItem_userId_keywordId_firstSeen_idx" ON "SeenItem"("userId", "keywordId", "firstSeen" DESC);
CREATE INDEX "SeenItem_userId_firstSeen_idx" ON "SeenItem"("userId", "firstSeen" DESC);
