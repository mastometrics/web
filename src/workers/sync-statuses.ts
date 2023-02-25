import { DOMParser } from "linkedom";
import { Account, Prisma } from "@prisma/client";
import { runInConnection } from "~/db";
import { mastodonApi } from "~/lib/mastodon/api";
import { ApiOptions } from "~/lib/mastodon/http";

export async function syncStatuses(account: Account, api: ApiOptions = { instance: account.instance }) {
  runInConnection(async (db) => {
    const statuses = mastodonApi(api).accounts.statuses({ id: account.instanceAccountId }, { limit: 80 });
    for await (const status of statuses) {
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

      await db.status.upsert({
        where: { statusUri: status.uri },
        update: statusData,
        create: {
          ...(statusData as Prisma.StatusCreateInput),
          statusUri: status.uri,
          Account: { connect: { id: account.id } },
        },
      });
    }
  });
}

function getTextContent(content: string) {
  return (
    new DOMParser().parseFromString(`<!doctype html><html lang="en"><body>${content}</body></html>`, "text/html").body
      .textContent || ""
  );
}
