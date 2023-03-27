-- CreateTable
CREATE TABLE "cached_accounts" (
    "id" SERIAL NOT NULL,
    "instance" CITEXT NOT NULL,
    "username" CITEXT NOT NULL,
    "hostInstance" CITEXT NOT NULL,
    "instanceAccountId" TEXT NOT NULL,
    "displayName" TEXT,
    "followersCount" INTEGER,
    "followingCount" INTEGER,
    "statusesCount" INTEGER,
    "avatar" TEXT,
    "lastIndex" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cached_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "username" CITEXT NOT NULL,
    "type" TEXT NOT NULL,
    "instanceAccountId" TEXT NOT NULL,
    "reach" INTEGER,
    "statusUri" TEXT,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cached_accounts_username_hostInstance_key" ON "cached_accounts"("username", "hostInstance");

-- CreateIndex
CREATE INDEX "interactions_accountId_idx" ON "interactions"("accountId");

-- CreateIndex
CREATE INDEX "interactions_username_idx" ON "interactions"("username");

-- CreateIndex
CREATE INDEX "interactions_type_idx" ON "interactions"("type");

-- CreateIndex
CREATE INDEX "interactions_accountId_username_idx" ON "interactions"("accountId", "username");

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
