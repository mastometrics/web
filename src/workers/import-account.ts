import { handleAccountSyncingError } from "~/backend/account";
import { useDatabase, throwOnError } from "~/backend/db";
import { HandledError } from "~/lib/error";
import { MASTODON } from "~/lib/mastodon/api";
import { ApiOptions } from "~/lib/mastodon/http";
import { AccountMetadata, readMetadata, setMetadata } from "~/lib/metadata";
import { backfillMetrics } from "./backfill-metrics";
import { syncStatuses } from "./sync-statuses";
import { updateAccountMetrics } from "./update-metrics";
import { createOrUpdateAccount } from "./upsert-account";

const MAX_STATUS_PAGES_IMPORT = 50;
const MAX_IMPORT = MASTODON.API.STATUS_PER_PAGE_LIMIT * MAX_STATUS_PAGES_IMPORT;
export async function importAccount(handle: string, api?: ApiOptions) {
  return useDatabase(async (db) => {
    let account = await createOrUpdateAccount(handle, undefined, api, db);

    const pendingImport = readMetadata<AccountMetadata>(account.metadata)?.pendingImport;
    if (pendingImport && new Date(pendingImport).getTime() < Date.now() - 1000 * 60 * 60) {
      console.log(`🚫 Found import for ${handle} taking more than an hour, retrying`);
    } else if (pendingImport) {
      console.log(`🚫 Already importing ${handle}`);
      return false;
    }

    let metadata = setMetadata<AccountMetadata>(account.metadata, { pendingImport: new Date().toISOString() });
    account = await db.account.update({ where: { id: account.id }, data: { tracking: true, metadata } });

    try {
      throwOnError(await syncStatuses(account, api, { limit: MAX_IMPORT }));
      throwOnError(await updateAccountMetrics(account));
      throwOnError(await backfillMetrics(account.username));

      metadata = setMetadata<AccountMetadata>(account.metadata, { pendingImport: undefined, suspendedSync: undefined });
      account = await db.account.update({ where: { id: account.id }, data: { metadata } });
      console.log(`✅ Imported ${handle}`);
    } catch (e) {
      console.error(`❌ Failed to import ${handle}`, e);
      await handleAccountSyncingError(account, e, db);
      if (e instanceof HandledError) throw e;
      return false;
    }

    return true;
  });
}
