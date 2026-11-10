-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'CODEFORCES',
    "externalId" TEXT NOT NULL,
    "contestId" INTEGER,
    "problemIdx" TEXT,
    "name" TEXT NOT NULL,
    "rating" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "Problem_platform_rating_idx" ON "Problem"("platform", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_platform_externalId_key" ON "Problem"("platform", "externalId");
