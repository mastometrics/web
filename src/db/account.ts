import { Prisma, PrismaClient } from "@prisma/client";
import { db, runInConnection } from ".";
import { importAccount } from "../syncer/index";

export type periodKeys = "24h" | "7d" | "30d" | "90d" | "1y" | "all";
export type orderKeys = "engagements" | "favorites" | "boosts" | "replies" | "publishedAt";

const periodToDaysAgo: Record<periodKeys, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
  all: 0,
} as const;

function periodToDate(period: periodKeys) {
  if (period == "all") return undefined;
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * periodToDaysAgo[period]);
}

// Order of keys below determines default secondary sort order
const orderings: Record<orderKeys, Prisma.StatusOrderByWithRelationInput> = {
  engagements: { engagementsCount: "desc" },
  favorites: { favoritesCount: "desc" },
  boosts: { boostsCount: "desc" },
  replies: { repliesCount: "desc" },
  publishedAt: { publishedAt: "desc" },
};

export const getFullAccount = async (
  handle: string,
  params: {
    period: periodKeys;
    order: orderKeys;
  } = { period: "30d", order: "engagements" }
) =>
  runInConnection(async () => {
    console.log("getAccount", handle, params);

    const data = await db.account.findUnique({
      where: { username: handle },
      include: {
        Statuses: {
          orderBy: [orderings[params.order], ...Object.values(orderings)],
          where: {
            isReblog: false,
            publishedAt: params.period != "all" ? { gte: periodToDate(params.period) } : undefined,
          },
          take: 11, // +1 to check if there are more pages
        },
        Followers: {
          select: { Account: { select: { username: true, avatar: true, displayName: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        Following: {
          select: { Account: { select: { username: true, avatar: true, displayName: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        Metrics: {
          orderBy: { date: "asc" },
          take: params.period != "all" ? 30 : undefined,
        },
      },
    });
    return {
      id: data?.id,
      account: data,
      statuses: data?.Statuses.slice(0, 10),
      params,
      hasMore: (data?.Statuses.length ?? 0) > 10,
    };
  });

export const getStatuses = async (
  handle: string,
  params: {
    period: periodKeys;
    order: orderKeys;
    page?: number;
    limit?: number;
    skip?: number;
  } = { period: "30d", order: "engagements" }
) =>
  runInConnection(async () => {
    const limit = params.limit || 10;
    const page = params.page || 0;
    const take = limit + 1; // +1 to check if there are more pages
    const skip = params.skip ?? 0 + page * limit;

    console.log("getStatuses", handle, params);
    const db = new PrismaClient();
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

export const syncAccount = async (handle: string) => {
  return importAccount(handle);
};

export const startTracking = async (handle: string) => {
  const account = await db.account.findUnique({ where: { username: handle } });
  if (!account) throw new Error("Account not found");
  await db.account.update({ where: { id: account.id }, data: { tracking: true } });
};
