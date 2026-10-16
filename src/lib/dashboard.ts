// Pure helpers used by the dashboard islands
import type { AggregateMetric } from "~/backend/metrics";
import type { Metric } from "~/generated/prisma/client";

export function mapMetricsToProgression(
  metrics: AggregateMetric[] | undefined,
  key: keyof Metric,
  defaultValue: number = 0
) {
  return metrics?.length
    ? metrics.map((m: any) => ({ date: m.date, value: m[key] }))
    : [{ date: new Date(), value: defaultValue }];
}

export function mapMetricsToDelta(metrics: AggregateMetric[] | undefined, key: keyof Metric, defaultValue: number = 0) {
  return metrics?.length
    ? metrics.reduce(
        (acc, m: any, i) => {
          if (i == 0) return acc;
          acc.push({ date: m.date, value: m[key] - (metrics[i - 1] as any)[key] });
          return acc;
        },
        [] as { date: Date; value: number }[]
      )
    : [{ date: new Date(), value: defaultValue }];
}

export function estimateImportDuration(statusesCount: number) {
  const statuses = Math.min(statusesCount ?? 0, 2000);
  const pages = Math.ceil(statuses / 40);
  const seconds = 15 + Math.ceil((pages * 1.5) / 5) * 5; // 1.5 seconds per page at max 300 paging request per 15 minutes
  return { statuses, seconds };
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) return `${minutes} minutes and ${Math.ceil(seconds % 60)} seconds`;
  return `${Math.ceil(seconds)} seconds`;
}
