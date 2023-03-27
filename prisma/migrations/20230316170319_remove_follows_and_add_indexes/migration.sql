/*
  Warnings:

  - You are about to drop the `follows` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "follows" DROP CONSTRAINT "follows_accountId_fkey";

-- DropForeignKey
ALTER TABLE "follows" DROP CONSTRAINT "follows_followingId_fkey";

-- DropTable
DROP TABLE "follows";

-- CreateIndex
CREATE INDEX "accounts_username_idx" ON "accounts"("username");

-- CreateIndex
CREATE INDEX "accounts_lastIndex_idx" ON "accounts"("lastIndex");

-- CreateIndex
CREATE INDEX "statuses_publishedAt_idx" ON "statuses"("publishedAt");

-- CreateIndex
CREATE INDEX "statuses_engagementsCount_idx" ON "statuses"("engagementsCount");

-- CreateIndex
CREATE INDEX "statuses_boostsCount_idx" ON "statuses"("boostsCount");

-- CreateIndex
CREATE INDEX "statuses_statusUri_idx" ON "statuses"("statusUri");
