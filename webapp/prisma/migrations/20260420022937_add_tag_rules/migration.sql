-- CreateTable
CREATE TABLE "TagRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "systemDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeenItemTag" (
    "seenItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "SeenItemTag_pkey" PRIMARY KEY ("seenItemId","tagId")
);

-- CreateIndex
CREATE INDEX "TagRule_userId_enabled_idx" ON "TagRule"("userId", "enabled");

-- CreateIndex
CREATE INDEX "SeenItemTag_tagId_idx" ON "SeenItemTag"("tagId");

-- AddForeignKey
ALTER TABLE "TagRule" ADD CONSTRAINT "TagRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagRule" ADD CONSTRAINT "TagRule_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeenItemTag" ADD CONSTRAINT "SeenItemTag_seenItemId_fkey" FOREIGN KEY ("seenItemId") REFERENCES "SeenItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeenItemTag" ADD CONSTRAINT "SeenItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
