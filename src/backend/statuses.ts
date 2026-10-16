import type { MastodonStatus } from "~/lib/mastodon/types";
import { simpleMastodonSanitizer } from "~/lib/mastodon/html.server";
import { type periodKeys, periodToDate } from "~/lib/period";
import { useDatabase, Prisma } from "./db";
import type { Status } from "~/generated/prisma/client";

export type orderKeys = "engagements" | "favorites" | "boosts" | "replies" | "publishedAt";

// Order of keys below determines default secondary sort order
const orderings: Record<orderKeys, Prisma.StatusOrderByWithRelationInput> = {
  engagements: { engagementsCount: "desc" },
  favorites: { favoritesCount: "desc" },
  boosts: { boostsCount: "desc" },
  replies: { repliesCount: "desc" },
  publishedAt: { publishedAt: "desc" },
};
export type getStatusesParams = {
  period: periodKeys;
  order: orderKeys;
  includeReplies?: boolean;
  query?: string;
  page?: number;
  limit?: number;
  skip?: number;
};

/** A status as shown in the UI, with sanitized html content */
export type StatusView = {
  id: number;
  url: string | null;
  publishedAt: Date;
  favoritesCount: number | null;
  boostsCount: number | null;
  repliesCount: number | null;
  html: string;
  avatar?: string;
  images: { url: string; previewUrl: string; description: string }[];
};

export function toStatusView(status: Status): StatusView {
  const raw = (status.raw ?? {}) as unknown as Partial<MastodonStatus>;
  return {
    id: status.id,
    url: status.url,
    publishedAt: status.publishedAt,
    favoritesCount: status.favoritesCount,
    boostsCount: status.boostsCount,
    repliesCount: status.repliesCount,
    html: simpleMastodonSanitizer(raw.content ?? "", undefined, {
      a: ["text-mastodon-purple-600", "dark:text-mastodon-purple-300", "hover:underline"],
      p: ["text-gray-700", "dark:text-mastodon-purple-100", "my-2"],
    }),
    avatar: raw.account?.avatar_static,
    images: (raw.media_attachments ?? [])
      .filter((x) => x.type == "image")
      .map((image) => ({ url: image.url, previewUrl: image.preview_url, description: image.description ?? "" })),
  };
}

export type getStatusesResponse = NonNullable<Awaited<ReturnType<typeof getStatuses>>[0]>;
export const getStatuses = async (
  handle: string,
  params: getStatusesParams = { period: "30d", order: "engagements" }
) =>
  useDatabase(async (db) => {
    const limit = params.limit || 10;
    const page = params.page || 0;
    const take = limit + 1; // +1 to check if there are more pages
    const skip = params.skip ?? page * limit;
    const statuses = await db.status.findMany({
      where: {
        Account: { username: handle },
        isReblog: false,
        publishedAt: params.period != "all" ? { gte: periodToDate(params.period) } : undefined,
        ...(params.includeReplies ? {} : { NOT: { content: { startsWith: "@" } } }),
        content: params?.query?.trim()?.length ? { contains: params?.query.trim(), mode: "insensitive" } : undefined,
      },
      orderBy: [orderings[params.order], ...Object.values(orderings)],
      take,
      skip,
    });
    const hasMore = statuses.length > limit;
    return {
      statuses: (hasMore ? statuses.slice(0, -1) : statuses).map(toStatusView),
      page,
      limit,
      hasMore,
      params,
    };
  });
