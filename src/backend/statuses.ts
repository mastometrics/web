import { HandledError } from "~/lib/error";
import { logNewUser } from "~/lib/logsnag/logsnag";
import { periodKeys, periodToDate } from "~/lib/period";
import { importAccount } from "~/workers/import-account";
import { runInConnection, db, Prisma } from "./db";

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
  page?: number;
  limit?: number;
  skip?: number;
};
export type getStatusesResponse = NonNullable<Awaited<ReturnType<typeof getStatuses>>[0]>;
export const getStatuses = async (
  handle: string,
  params: getStatusesParams = { period: "30d", order: "engagements" }
) =>
  runInConnection(async (db) => {
    const limit = params.limit || 10;
    const page = params.page || 0;
    const take = limit + 1; // +1 to check if there are more pages
    const skip = params.skip ?? 0 + page * limit;
    const statuses = await db.status.findMany({
      where: {
        Account: { username: handle },
        isReblog: false,
        publishedAt: params.period != "all" ? { gte: periodToDate(params.period) } : undefined,
      },
      orderBy: [orderings[params.order], ...Object.values(orderings)],
      take,
      skip,
    });
    const hasMore = statuses.length > limit;
    return { statuses: hasMore ? statuses.slice(0, -1) : statuses, page, limit, hasMore, params };
  });
