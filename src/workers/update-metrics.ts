import { Account, Prisma } from "@prisma/client";
import { runInConnection, Result } from "~/db";
import { sum } from "~/lib/format";
import { createOrUpdateAccount } from "./upsert-account";

export async function updateAccountMetrics(handle: string): Result<void>;
export async function updateAccountMetrics(account: Account): Result<void>;
export async function updateAccountMetrics(user: Account | string) {
  return runInConnection(async (db) => {
    const account = typeof user === "string" ? await createOrUpdateAccount(user, undefined, undefined, db) : user;
    const aggregates = await db.status.aggregate({
      where: { Account: { id: account.id } },
      _sum: { favoritesCount: true, boostsCount: true, repliesCount: true },
    });
    const counts: Prisma.MetricUpdateInput = {
      followers: account.followersCount,
      following: account.followingCount,
      statuses: account.statusesCount,
      favorites: aggregates._sum.favoritesCount,
      boosts: aggregates._sum.boostsCount,
      replies: aggregates._sum.repliesCount,
      engagements: sum(aggregates._sum.favoritesCount, aggregates._sum.boostsCount, aggregates._sum.repliesCount),
    };
    // truncate date to day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`Updating stats for ${account.username} on ${today}`);

    await db.metric.upsert({
      where: { accountId_date: { accountId: account.id, date: today }, date: today },
      update: counts,
      create: {
        ...(counts as Prisma.MetricCreateInput),
        Account: { connect: { id: account.id } },
        date: today,
      },
    });
  });
}
