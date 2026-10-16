import type { Account } from "~/generated/prisma/client";
import { Prisma } from "~/generated/prisma/client";
import { useDatabase, type Result } from "~/backend/db";
import { sum, truncateDate } from "~/lib/format";
import { logger } from "~/lib/logger";
import { createOrUpdateAccount } from "./upsert-account";

/* Upsert account metrics for today, based on the account's current status counts and all statuses */
export async function updateAccountMetrics(handle: string): Result<void>;
export async function updateAccountMetrics(account: Account): Result<void>;
export async function updateAccountMetrics(user: Account | string) {
  return useDatabase(async (db) => {
    const account = typeof user === "string" ? await createOrUpdateAccount(user, undefined, undefined, db) : user;
    const aggregates = await db.status.aggregate({
      where: { Account: { id: account.id } },
      _sum: { favoritesCount: true, boostsCount: true, repliesCount: true },
    });
    const counts: Prisma.MetricUpdateInput = {
      followers: account.followersCount,
      following: account.followingCount,
      statuses: account.statusesCount,
      favorites: aggregates._sum.favoritesCount,
      boosts: aggregates._sum.boostsCount,
      replies: aggregates._sum.repliesCount,
      engagements: sum(aggregates._sum.favoritesCount, aggregates._sum.boostsCount, aggregates._sum.repliesCount),
    };

    const timestamp = truncateDate(new Date(), "hour");
    logger.debug(`🔄 Updating stats for ${account.username}`);

    await db.metric.upsert({
      where: { accountId_timestamp: { accountId: account.id, timestamp }, timestamp },
      update: counts,
      create: {
        ...(counts as Prisma.MetricCreateInput),
        Account: { connect: { id: account.id } },
        timestamp,
      },
    });
  });
}
