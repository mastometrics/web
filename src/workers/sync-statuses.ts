import { DOMParser } from "linkedom";
import { Account, Prisma } from "@prisma/client";
import { useDatabase } from "~/backend/db";
import { mastodonApi } from "~/lib/mastodon/api";
import { ApiOptions } from "~/lib/mastodon/http";

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
          create: {
            ...(statusData as Prisma.StatusCreateInput),
            statusUri: status.uri,
            Account: { connect: { id: account.id } },
          },
        })
      );
    }

    await Promise.all(upserts);
  });
}

function getTextContent(content: string) {
  return (
    new DOMParser().parseFromString(`<!doctype html><html lang="en"><body>${content}</body></html>`, "text/html").body
      .textContent || ""
  );
}
