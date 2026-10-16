import { handleAccountSyncingError } from "~/backend/account";
import type { Account } from "~/generated/prisma/client";
import { throwOnError, useDatabase } from "~/backend/db";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";
import { mastodonApi } from "~/lib/mastodon/api";
import { type ApiOptions } from "~/lib/mastodon/http";
import { type AccountMetadata, readMetadata } from "~/lib/metadata";
import { SYNC_MAX_STATUS_COUNT } from "~/lib/config";
import { syncInteractions } from "./sync-interactions";
import { syncStatuses } from "./sync-statuses";
import { updateAccountMetrics } from "./update-metrics";
import { createOrUpdateAccount } from "./upsert-account";

/** Fetch the latest counts + profile info, sync the last 120 status counts and update the metrics accordingly */
export async function syncAccount(handle: string, api?: ApiOptions, opts?: { accountId?: string }) {
  return useDatabase(async (db) => {
    let account: Account;
    try {
      const accountData = opts?.accountId && api ? await mastodonApi(api).accounts.get(opts.accountId) : undefined;
      account = await createOrUpdateAccount(handle, accountData, api, db);
    } catch (e) {
      logger.warn(`🛑 Failed to fetch account for ${handle}`, e);
      const existing = await db.account.findUnique({ where: { username: handle } });
      if (existing) await handleAccountSyncingError(existing, e, db);
      throw e;
    }

    // Skipping is not a failure, so these don't count as warnings
    const metadata = readMetadata<AccountMetadata>(account.metadata);
    if (metadata?.suspendedSync) throw new HandledError(`Account ${handle} is suspended`);
    if (metadata?.pendingImport) throw new HandledError(`Account ${handle} is pending import`);

    try {
      if (!api) {
        const user = await db.user.findUnique({ where: { accountId: account.id } });
        api = { token: user?.token, instance: account.instance };
      }

      // Add a small lock to prevent multiple syncs from running at the same time
      await db.$executeRaw`UPDATE "accounts" SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{pendingSync}', to_json(NOW())::jsonb)  WHERE "id" = ${account.id}`;

      try {
        throwOnError(await syncStatuses(account, api, { limit: SYNC_MAX_STATUS_COUNT }));
        throwOnError(await updateAccountMetrics(account));
        throwOnError(await syncInteractions(account.username, api.token ? { ...api, throttle: true } : undefined));
      } finally {
        // Remove the lock
        await db.$executeRaw`UPDATE "accounts" SET metadata = jsonb_set(metadata, '{pendingSync}', 'null', false)  WHERE "id" = ${account.id}`;
      }

      logger.debug(`👍 Synced ${handle}`);
      return true;
    } catch (e) {
      logger.warn(`👎 Failed to sync ${handle}`, e);
      const current = await db.account.findUniqueOrThrow({ where: { id: account.id } });
      await handleAccountSyncingError(current, e, db);
      throw e;
    }
  });
}
