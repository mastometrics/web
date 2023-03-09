import { Prisma, useDatabase } from "~/backend/db";
import { logger } from "~/lib/logger";
import { SYNC_MAX_SPIKE, SYNC_OUTDATED_MINS } from "./config";
import { syncAccount } from "./sync-account";

export async function updateOutdatedUsers() {
  return useDatabase(async (db) => {
    const outdatedAfter = new Date(Date.now() - 1000 * 60 * SYNC_OUTDATED_MINS);
    const accountCount = await db.account.count();

    // Throttle the number of accounts to sync at once, forcing them to be spread out over time
    const limit = Math.ceil((accountCount * SYNC_MAX_SPIKE) / 10) * 10;

    const accounts = await db.account.findMany({
      where: {
        OR: [
          { tracking: true, lastIndex: { lt: outdatedAfter } },
          {
            tracking: true,
            Metrics: { none: { timestamp: { gt: outdatedAfter } } },
          },
        ],
        metadata: { path: ["suspendedSync"], equals: Prisma.AnyNull },
      },
      take: limit,
      include: { User: true },
    });

    if (!accounts.length) return logger.info(`🔄 No outdated accounts to sync`);

    logger.info(`🔄 Syncing ${accounts.length} outdated accounts`);
    const results = await Promise.allSettled(
      accounts.map((account) =>
        syncAccount(account.username, { token: account.User[0]?.token, instance: account.instance, throttle: true })
      )
    );
    logger.info(`🔄 Synced ${results.filter((r) => r.status === "fulfilled").length} outdated accounts`);
    if (results.some((r) => r.status === "rejected"))
      logger.warn(`🫤 Failed to sync ${results.filter((r) => r.status === "rejected").length} outdated accounts`);
  });
}
