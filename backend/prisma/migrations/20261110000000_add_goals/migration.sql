CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cfHandle" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Goal_targetCount_check" CHECK ("targetCount" BETWEEN 1 AND 1000),
    CONSTRAINT "Goal_deadline_check" CHECK ("deadline" > "startsAt")
);
CREATE INDEX "Goal_userId_createdAt_idx" ON "Goal"("userId", "createdAt");
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
