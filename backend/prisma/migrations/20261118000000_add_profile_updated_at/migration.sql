-- Backfill existing profiles, then let Prisma maintain updatedAt on writes.
ALTER TABLE "Profile" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Profile" ALTER COLUMN "updatedAt" DROP DEFAULT;
