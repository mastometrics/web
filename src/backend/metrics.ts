import type { Metric } from "~/generated/prisma/client";
import { type periodKeys, periodToDate } from "~/lib/period";
import { db } from "./db";

function formatUtcOffset(offset: number) {
  const sign = offset < 0 ? "-" : "+";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export type AggregateMetric = Omit<Metric, "id" | "timestamp"> & { date: Date };
export const getAccountMetrics = async (handle: string, params?: { period: periodKeys; utcOffset: number }) => {
  const period = params?.period ?? "7d";
  const utcOffset = params?.utcOffset ?? new Date().getTimezoneOffset();

  const accountMetrics = db.$queryRaw<AggregateMetric[]>`
  SELECT DATE_TRUNC('day', timestamp AT TIME ZONE ${formatUtcOffset(utcOffset)}) AS date,
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
  WHERE timestamp >= ${periodToDate(period)}
  GROUP BY date, "accountId"
  ORDER BY date DESC
  LIMIT 30
`;
  return { metrics: (await accountMetrics).reverse(), offset: utcOffset };
};
