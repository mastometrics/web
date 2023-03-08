import { handleAccountSyncingError } from "~/backend/account";
import { runInConnection } from "~/backend/db";
import { HandledError } from "~/lib/error";
import { ApiOptions } from "~/lib/mastodon/http";
import { syncStatuses } from "./sync-statuses";
import { updateAccountMetrics } from "./update-metrics";

/** Fetch the latest counts + profile info, sync the last 120 status counts and update the metrics accordingly */
export async function syncAccount(handle: string, api?: ApiOptions) {
  return runInConnection(async (db) => {
    let account = await db.account.findUnique({ where: { username: handle }, include: { User: true } });
    if (!account) throw new HandledError(`Account ${handle} not found`);
    try {
      if (!api) api = { token: account.User[0]?.token, instance: account.instance };
      const tasks = [];
      if (account.discoverable && !account.noindex) {
        tasks.push(syncStatuses(account, api, { limit: 120 }));
        //   if (account.followersCount) tasks.push(syncFollowers(account, api));
        //   if (account.followingCount) tasks.push(syncFollowing(account, api));
        tasks.push(updateAccountMetrics(account));
      }
      await Promise.all(tasks);
      console.log(`👍 Synced ${handle}`);
    } catch (e) {
      await handleAccountSyncingError(account, e, db);
      if (e instanceof HandledError) throw e;
    }
  });
}
