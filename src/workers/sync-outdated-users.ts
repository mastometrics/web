import { runInConnection } from "~/backend/db";
import { syncAccount } from "./sync-account";

export async function updateOutdatedUsers() {
  return runInConnection(async (db) => {
    const outdatedAfter = new Date(Date.now() - 1000 * 60 * 30);
    const accounts = await db.account.findMany({
      where: {
        OR: [
          { tracking: true, lastIndex: { lt: outdatedAfter } },
          {
            tracking: true,
            Metrics: { none: { timestamp: { gt: outdatedAfter } } },
          },
        ],
      },
      include: { User: true },
    });
    for (const account of accounts) {
      syncAccount(account.username, { token: account.User[0]?.token, instance: account.instance, throttle: true });
    }
  });
}
