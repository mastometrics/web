import { Metric, Prisma } from "@prisma/client";
import { mastodonApi } from "../lib/mastodon/api";
import { runInConnection } from "../db";
import { truncateDate } from "~/lib/format";
import { getOrCreateAccount } from "./upsert-account";

type StatusAggregate = {
  date: Date;
  favoritesCount: number;
  boostsCount: number;
  repliesCount: number;
  statusesCount: number;
  accountId: string;
};

type MetricAggregate = {
  favorites: number;
  boosts: number;
  replies: number;
  engagements: number;
  followers: number;
  following: number;
  statuses: number;
};

const metricPeriod = 24 * 60 * 60 * 1000; // 1 day

export async function backfillMetrics(handle: string) {
  return runInConnection(async (db) => {
    try {
      console.log(`🏛️ Backfilling metrics for ${handle}`);
      const account = await getOrCreateAccount(handle, undefined, undefined, db);
      const user = await db.user.findFirstOrThrow({ where: { Account: { id: account.id } } });

      const config = { token: user.token, instance: account.instance };
      const followNotifications = mastodonApi(config).notifications.list({ types: ["follow"] });

      const statusAggregates = await db.$queryRaw<StatusAggregate[]>`
        SELECT DATE_TRUNC('day', "publishedAt") AS date,
        SUM("favoritesCount")::int as "favoritesCount",
        SUM("boostsCount")::int as "boostsCount",
        SUM("repliesCount")::int as "repliesCount",
        COUNT(*)::int as "statusesCount"
        FROM statuses
        WHERE "accountId" = ${account.id}
        GROUP BY date, "accountId";
    `;

      const backfilled = {
        followers: 0,
        statuses: 0,
      };
      const activityOnDays = new Map<string, MetricAggregate>();
      const getActivityOnDay = (date: Date) => {
        const key = truncateDate(date, "day").toISOString();
        return (
          activityOnDays.get(key) ||
          activityOnDays
            .set(key, { favorites: 0, boosts: 0, replies: 0, engagements: 0, followers: 0, following: 0, statuses: 0 })
            .get(key)!
        );
      };

      for (const day of statusAggregates) {
        const activityOnDay = getActivityOnDay(day.date);
        activityOnDay.favorites = day.favoritesCount;
        activityOnDay.boosts = day.boostsCount;
        activityOnDay.replies = day.repliesCount;
        activityOnDay.engagements = day.favoritesCount + day.boostsCount + day.repliesCount;
        activityOnDay.statuses = day.statusesCount;
        backfilled.statuses += day.statusesCount;
      }

      for await (const notification of followNotifications) {
        getActivityOnDay(new Date(notification.created_at)).followers++;
        backfilled.followers++;
      }

      const firstKnownDate = [...activityOnDays.keys()].sort()[0];
      const metricsToBackfill = Math.floor(
        (truncateDate(new Date()).getTime() - new Date(firstKnownDate).getTime()) / metricPeriod
      );

      const datePosition = new Date(firstKnownDate);
      const toCreateMetrics = [...Array(metricsToBackfill).keys()].reduce((macc, i) => {
        const metricDate = new Date(datePosition.getTime() + i * metricPeriod);
        const prevMetric = macc[i - 1] || {
          timestamp: new Date(datePosition.getTime() + (i - 1) * metricPeriod),
          followers: Math.max(0, (account.followersCount ?? 0) - backfilled.followers),
          following: account.followingCount || 0,
          statuses: Math.max(0, (account.statusesCount ?? 0) - backfilled.statuses),
          favorites: 0,
          boosts: 0,
          replies: 0,
          engagements: 0,
        };
        const activityOnDay = getActivityOnDay(metricDate);
        const metric = Object.assign({}, prevMetric, { timestamp: metricDate });
        metric.followers += activityOnDay.followers;
        metric.following += activityOnDay.following;
        metric.statuses += activityOnDay.statuses;
        metric.favorites += activityOnDay.favorites;
        metric.boosts += activityOnDay.boosts;
        metric.replies += activityOnDay.replies;
        metric.engagements += activityOnDay.engagements;
        macc.push(metric);
        return macc;
      }, [] as (MetricAggregate & { timestamp: Date })[]);

      const existingMetrics = (await db.metric.findMany({
        where: { accountId: account.id },
        orderBy: { timestamp: "desc" },
      })) as Metric[];

      const createData: Prisma.MetricCreateManyInput[] = [];
      for (const metric of toCreateMetrics) {
        if (existingMetrics.find((m) => m.timestamp.getTime() === metric.timestamp.getTime())) {
          console.log(`❗ Skipping ${metric.timestamp} because it already exists`);
          continue;
        }
        createData.push({
          ...metric,
          accountId: account.id,
        });
      }

      return await db.metric.createMany({ data: createData });
    } catch (e) {
      console.error(e);
    }
  });
}
