import { handleAccountSyncingError } from "~/backend/account";
import { useDatabase } from "~/backend/db";
import { HandledError } from "~/lib/error";
import { ApiOptions } from "~/lib/mastodon/http";
import { AccountMetadata, readMetadata } from "~/lib/metadata";
import { syncStatuses } from "./sync-statuses";
import { updateAccountMetrics } from "./update-metrics";
import { createOrUpdateAccount } from "./upsert-account";

/** Fetch the latest counts + profile info, sync the last 120 status counts and update the metrics accordingly */
export async function syncAccount(handle: string, api?: ApiOptions) {
  return useDatabase(async (db) => {
    const account = await createOrUpdateAccount(handle, undefined, api, db);
    if (readMetadata<AccountMetadata>(account.metadata)?.suspendedSync)
      throw new HandledError(`Account ${handle} is suspended`);
    if (readMetadata<AccountMetadata>(account.metadata)?.pendingImport)
      throw new HandledError(`Account ${handle} is pending import`);
    if (!account) throw new HandledError(`Account ${handle} not found`);
    try {
      if (!api) {
        const user = await db.user.findUnique({ where: { accountId: account.id } });
        api = { token: user?.token, instance: account.instance };
      }
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
