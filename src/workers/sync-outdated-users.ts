import { runInConnection } from "~/db";
import { syncAccount } from "./sync-account";

export async function updateOutdatedUsers() {
  return runInConnection(async (db) => {
    const sinceOneDay = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const sinceOneHour = new Date(Date.now() - 1000 * 60 * 60);
    const accounts = await db.account.findMany({
      where: {
        OR: [
          { tracking: true, lastIndex: { lt: sinceOneHour } },
          {
            tracking: true,
            Metrics: { none: { date: { gt: sinceOneDay } } },
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
