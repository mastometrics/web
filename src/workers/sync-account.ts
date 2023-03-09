import { handleAccountSyncingError } from "~/backend/account";
import { useDatabase } from "~/backend/db";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";
import { mastodonApi } from "~/lib/mastodon/api";
import { ApiOptions } from "~/lib/mastodon/http";
import { AccountMetadata, readMetadata } from "~/lib/metadata";
import { SYNC_MAX_STATUS_COUNT } from "./config";
import { syncStatuses } from "./sync-statuses";
import { updateAccountMetrics } from "./update-metrics";
import { createOrUpdateAccount } from "./upsert-account";

/** Fetch the latest counts + profile info, sync the last 120 status counts and update the metrics accordingly */
export async function syncAccount(handle: string, api?: ApiOptions, opts?: { accountId?: string }) {
  return useDatabase(async (db) => {
    try {
      let accountData = opts?.accountId && api ? await mastodonApi(api!).accounts.get(opts.accountId) : undefined;
      const account = await createOrUpdateAccount(handle, accountData, api, db);
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

        await syncStatuses(account, api, { limit: SYNC_MAX_STATUS_COUNT });
        await updateAccountMetrics(account);

        logger.debug(`👍 Synced ${handle}`);
        return true;
      } catch (e) {
        logger.warn(`👎 Failed to sync ${handle}`, e);
        await handleAccountSyncingError(account, e, db);
        if (e instanceof HandledError) throw e;
      }
    } catch (e) {
      logger.warn(`🛑 Failed to fetch account for ${handle}`, e);
      const account = await db.account.findUnique({ where: { username: handle } });
      if (account) await handleAccountSyncingError(account, e, db);
      if (e instanceof HandledError) throw e;
    }
  });
}
