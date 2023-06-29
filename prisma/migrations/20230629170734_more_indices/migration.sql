-- CreateIndex
CREATE INDEX "cached_accounts_username_hostInstance_idx" ON "cached_accounts"("username", "hostInstance");

-- CreateIndex
CREATE INDEX "cached_accounts_instanceAccountId_idx" ON "cached_accounts"("instanceAccountId");

-- CreateIndex
CREATE INDEX "interactions_statusUri_idx" ON "interactions"("statusUri");

-- CreateIndex
CREATE INDEX "metrics_accountId_timestamp_idx" ON "metrics"("accountId", "timestamp");

-- CreateIndex
CREATE INDEX "metrics_timestamp_idx" ON "metrics"("timestamp");

-- CreateIndex
CREATE INDEX "metrics_accountId_idx" ON "metrics"("accountId");

-- CreateIndex
CREATE INDEX "statuses_accountId_idx" ON "statuses"("accountId");

-- CreateIndex
CREATE INDEX "statuses_favoritesCount_idx" ON "statuses"("favoritesCount");

-- CreateIndex
CREATE INDEX "statuses_repliesCount_idx" ON "statuses"("repliesCount");

-- CreateIndex
CREATE INDEX "statuses_isReblog_idx" ON "statuses"("isReblog");

-- CreateIndex
CREATE INDEX "users_accountId_idx" ON "users"("accountId");
