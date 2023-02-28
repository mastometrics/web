/*
  Warnings:

  - You are about to drop the column `date` on the `metrics` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId,timestamp]` on the table `metrics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timestamp` to the `metrics` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "metrics_accountId_date_key";

-- DropIndex
DROP INDEX "users_token_key";

-- AlterTable
ALTER TABLE "metrics"
RENAME COLUMN "date" TO "timestamp";

-- CreateIndex
CREATE UNIQUE INDEX "metrics_accountId_timestamp_key" ON "metrics"("accountId", "timestamp");
