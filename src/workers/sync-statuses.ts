import type { Account } from "~/generated/prisma/client";
import { Prisma } from "~/generated/prisma/client";
import { useDatabase } from "~/backend/db";
import { mastodonApi } from "~/lib/mastodon/api";
import { type ApiOptions } from "~/lib/mastodon/http";
import { getTextContent } from "~/lib/mastodon/html.server";

/** Upsert an accounts most recent statuses and their engagement, (last 120 by default)  */
export async function syncStatuses(
  account: Account,
  api: ApiOptions = { instance: account.instance },
  { limit = 120 } = {}
) {
  return useDatabase(async (db) => {
    const statuses = mastodonApi(api).accounts.statuses({ id: account.instanceAccountId }, { limit });
    const synced: Prisma.StatusCreateManyInput[] = [];
    for await (const status of statuses) {
      // Skip direct messages
      if (status.visibility === "direct") continue;

      // Skip boosts of the same status
      // It will overwrite the original status without any engagement data
      if (status.reblog?.uri === status.uri) continue;

      const publishedAt = new Date(status.created_at);
      if (!status.uri || isNaN(publishedAt.valueOf())) continue;

      synced.push({
        statusUri: status.uri,
        accountId: account.id,
        boostsCount: status.reblogs_count,
        favoritesCount: status.favourites_count,
        repliesCount: status.replies_count,
        engagementsCount: status.replies_count + status.reblogs_count + status.favourites_count,
        raw: status as unknown as Prisma.JsonObject,
        content: getTextContent(status.content),
        url: status.url,
        publishedAt,
        isReblog: !!status.reblog,
      });
    }

    // One at a time instead of in a transaction, which would hold on to a connection for every round trip. With many
    // accounts syncing at once (or a slow connection) other syncs would time out waiting for a free connection.
    // Each write is idempotent, so a failed sync is simply completed by the next one.
    for (const { statusUri, accountId, ...data } of synced) {
      // Status uris are unique across all accounts, but come from the account's (untrusted) instance: only ever update
      // statuses of this account, so an instance can't overwrite the statuses of someone else
      const { count } = await db.status.updateMany({ where: { statusUri, accountId }, data });
      if (!count) await db.status.createMany({ data: [{ statusUri, accountId, ...data }], skipDuplicates: true });
    }
  });
}
