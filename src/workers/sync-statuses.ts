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
    const upserts = [];
    for await (const status of statuses) {
      // Skip direct messages
      if (status.visibility === "direct") continue;

      // Skip boosts of the same status
      // It will overwrite the original status without any engagement data
      if (status.reblog?.uri === status.uri) continue;

      const statusData: Prisma.StatusUpdateInput = {
        boostsCount: status.reblogs_count,
        favoritesCount: status.favourites_count,
        repliesCount: status.replies_count,
        engagementsCount: status.replies_count + status.reblogs_count + status.favourites_count,
        raw: status as unknown as Prisma.JsonObject,
        content: getTextContent(status.content),
        url: status.url,
        publishedAt: new Date(status.created_at),
        isReblog: !!status.reblog,
      };

      upserts.push(
        db.status.upsert({
          where: { statusUri: status.uri },
          update: statusData,
          // Scalar accountId (instead of connecting the relation) lets Prisma use a native INSERT ... ON CONFLICT
          create: {
            ...(statusData as Prisma.StatusUncheckedCreateInput),
            statusUri: status.uri,
            accountId: account.id,
          },
        })
      );
    }

    // One at a time instead of in a transaction, which would hold on to a connection for every round trip. With many
    // accounts syncing at once (or a slow connection) other syncs would time out waiting for a free connection.
    // Each upsert is idempotent, so a failed sync is simply completed by the next one.
    for (const upsert of upserts) await upsert;
  });
}
