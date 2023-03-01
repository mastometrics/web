import { runInConnection } from "~/db";
import { MASTODON } from "~/lib/mastodon/api";
import { ApiOptions } from "~/lib/mastodon/http";
import { backfillMetrics } from "./backfill-metrics";
import { syncStatuses } from "./sync-statuses";
import { updateAccountMetrics } from "./update-metrics";
import { createOrUpdateAccount } from "./upsert-account";

export async function importAccount(handle: string, api?: ApiOptions) {
  return runInConnection(async (db) => {
    const account = await createOrUpdateAccount(handle, undefined, api, db);

    await syncStatuses(account, api, { limit: MASTODON.API.STATUS_PER_PAGE_LIMIT * 50 });
    await updateAccountMetrics(account);
    console.log(`✅ Imported ${handle}`);
    return await backfillMetrics(account.username);
  });
}
