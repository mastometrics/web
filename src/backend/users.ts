import { Prisma, throwOnError, useDatabase } from "./db";

export type UserOrderKeys = "lastIndex" | "createdAt" | "lastLogin" | "followerCount" | "statusCount";
export type UserFilters = "suspended";

export type listUsersParams = {
  order?: UserOrderKeys;
  dir?: "asc" | "desc";
  filters?: UserFilters[];
  query?: string;
  page?: number;
  limit?: number;
  skip?: number;
};
export type listUsersResponse = NonNullable<Awaited<ReturnType<typeof listUsers>>[0]>;
export const listUsers = async (params: listUsersParams = {}) =>
  useDatabase(async (db) => {
    const dir = params.dir ?? "desc";
    const orderings: Record<UserOrderKeys, Prisma.UserOrderByWithRelationInput> = {
      lastIndex: { Account: { lastIndex: dir } },
      createdAt: { createdAt: dir },
      lastLogin: { lastSeen: dir },
      followerCount: { Account: { followersCount: dir } },
      statusCount: { Account: { statusesCount: dir } },
    } as const;

    const filters: Record<UserFilters, Prisma.UserWhereInput> = {
      suspended: { Account: { metadata: { path: ["suspendedSync"], not: Prisma.AnyNull } } },
    };

    const limit = params.limit || 50;
    const page = params.page || 0;
    const take = limit + 1; // +1 to check if there are more pages
    const skip = params.skip ?? 0 + page * limit;
    const users = await db.user.findMany({
      where: {
        AND: [
          ...(params.filters?.map((f) => filters[f]) ?? []),
          ...(params.query ? [{ Account: { username: { contains: params.query } } }] : []),
        ],
      },
      orderBy: orderings[params.order ?? "lastLogin"],
      include: { Account: true },
      take,
      skip,
    });
    const hasMore = users.length > limit;
    return { users: hasMore ? users.slice(0, -1) : users, page, limit, hasMore, params };
  });

export async function getTotalUserCount() {
  return throwOnError(
    await useDatabase(async (db) => {
      return await db.user.count();
    })
  );
}
