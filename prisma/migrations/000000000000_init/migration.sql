-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "instance" CITEXT NOT NULL,
    "username" CITEXT NOT NULL,
    "displayName" TEXT,
    "instanceAccountId" TEXT NOT NULL,
    "followersCount" INTEGER,
    "followingCount" INTEGER,
    "statusesCount" INTEGER,
    "bot" BOOLEAN,
    "discoverable" BOOLEAN,
    "noindex" BOOLEAN,
    "locked" BOOLEAN,
    "avatar" TEXT,
    "lastIndex" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tracking" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "followers" INTEGER,
    "following" INTEGER,
    "statuses" INTEGER,
    "engagements" INTEGER,
    "replies" INTEGER,
    "boosts" INTEGER,
    "favorites" INTEGER,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" SERIAL NOT NULL,
    "statusUri" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT NOT NULL,
    "isReblog" BOOLEAN,
    "repliesCount" INTEGER,
    "accountId" INTEGER NOT NULL,
    "boostsCount" INTEGER,
    "favoritesCount" INTEGER,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "lastIndex" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw" JSONB,
    "engagementsCount" INTEGER,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIndex" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instances" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "host" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "token" TEXT,
    "raw" JSONB,
    "rawClient" JSONB,

    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_accountId_date_key" ON "metrics"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_statusUri_key" ON "statuses"("statusUri");

-- CreateIndex
CREATE UNIQUE INDEX "follows_accountId_followingId_key" ON "follows"("accountId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "instances_host_key" ON "instances"("host");

-- CreateIndex
CREATE UNIQUE INDEX "users_accountId_key" ON "users"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "users_token_key" ON "users"("token");

-- CreateIndex
CREATE UNIQUE INDEX "users_instanceId_accountId_key" ON "users"("instanceId", "accountId");

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

