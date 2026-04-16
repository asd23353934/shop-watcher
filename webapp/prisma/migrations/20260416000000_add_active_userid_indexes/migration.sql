-- Add index on Keyword.active for worker's where:{active:true} queries
CREATE INDEX IF NOT EXISTS "Keyword_active_createdAt_idx" ON "Keyword"("active", "createdAt" DESC);

-- Add index on CircleFollow.active for worker's where:{active:true} queries
CREATE INDEX IF NOT EXISTS "CircleFollow_active_createdAt_idx" ON "CircleFollow"("active", "createdAt" DESC);
