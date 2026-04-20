-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordTag" (
    "keywordId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "KeywordTag_pkey" PRIMARY KEY ("keywordId","tagId")
);

-- CreateTable
CREATE TABLE "CircleFollowTag" (
    "circleFollowId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CircleFollowTag_pkey" PRIMARY KEY ("circleFollowId","tagId")
);

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "KeywordTag_tagId_idx" ON "KeywordTag"("tagId");

-- CreateIndex
CREATE INDEX "CircleFollowTag_tagId_idx" ON "CircleFollowTag"("tagId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordTag" ADD CONSTRAINT "KeywordTag_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordTag" ADD CONSTRAINT "KeywordTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleFollowTag" ADD CONSTRAINT "CircleFollowTag_circleFollowId_fkey" FOREIGN KEY ("circleFollowId") REFERENCES "CircleFollow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleFollowTag" ADD CONSTRAINT "CircleFollowTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
