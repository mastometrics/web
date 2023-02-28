import { Metric, Prisma, PrismaClient } from "@prisma/client";
import { logNewUser } from "~/lib/logsnag/logsnag";
import { periodKeys, periodToDate } from "~/lib/period";
import { importAccount } from "~/workers/import-account";
import { db, runInConnection } from ".";
export { syncAccount } from "../workers/sync-account";
export type orderKeys = "engagements" | "favorites" | "boosts" | "replies" | "publishedAt";

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
  runInConnection(async (db) => {
    console.log("getAccount", handle, params);
    const data = db.account.findUnique({
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
      },
    });

    const accountMetrics = db.$queryRaw<(Omit<Metric, "id" | "date"> & { date: Date })[]>`
      SELECT DATE_TRUNC('day', timestamp AT TIME ZONE '-03:00') AS date,
        MAX(followers)::int   AS followers,
        MAX(following)::int   AS following,
        MAX(statuses)::int    AS statuses,
        MAX(boosts)::int      AS boosts,
        MAX(favorites)::int   AS favorites,
        MAX(engagements)::int AS engagements,
        MAX(replies)::int     AS replies,
        "accountId"
      FROM metrics
      INNER JOIN accounts acc ON "accountId" = acc.id AND "username" = ${handle}
      WHERE timestamp >= ${periodToDate(params.period)}
      GROUP BY date, "accountId"
      ORDER BY date DESC
      LIMIT 30
    `;

    const [account, metrics] = await Promise.all([data, accountMetrics]);
    metrics.reverse();
    return {
      id: account?.id,
      account,
      statuses: account?.Statuses.slice(0, 10),
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

export const startTracking = async (handle: string) => {
  // runInConnection(async (db) => {
  const account = await db.account.findUnique({ where: { username: handle } });
  if (!account) throw new Error("Account not found");
  await db.account.update({ where: { id: account.id }, data: { tracking: true } });
  logNewUser(account);
  await importAccount(handle, { instance: account.instance });
  return true;
  // });
};
