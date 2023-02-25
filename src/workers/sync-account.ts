import { runInConnection } from "~/db";
import { ApiOptions } from "~/lib/mastodon/http";
import { syncFollowers, syncFollowing } from "./sync-follows";
import { syncStatuses } from "./sync-statuses";
import { updateAccountMetrics } from "./update-metrics";
import { createOrUpdateAccount } from "./upsert-account";

export async function syncAccount(handle: string, api?: ApiOptions) {
  return runInConnection(async (db) => {
    const account = await createOrUpdateAccount(handle, undefined, api, db);
    const tasks = [];
    if (account.discoverable && !account.noindex) {
      tasks.push(syncStatuses(account, api));
      if (account.followersCount) tasks.push(syncFollowers(account, api));
      if (account.followingCount) tasks.push(syncFollowing(account, api));
      tasks.push(updateAccountMetrics(account));
    }
    await Promise.all(tasks);
    console.log(`Synced ${handle}`);
  });
}
