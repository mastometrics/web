-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "instances" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "statuses" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "metadata" JSONB;
