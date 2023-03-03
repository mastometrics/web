import { Metric, Account } from "@prisma/client";
import { Component, createResource, onMount, Suspense } from "solid-js";
import server$ from "solid-start/server";
import { requireAuth, throwUnauthorized } from "~/backend/authentication";
import { AggregateMetric, getAccountMetrics } from "~/backend/metrics";
import { periodKeys } from "~/lib/period";
import { usePermissions } from "~/lib/permissions";
import { StatCard } from "../Statcard";

export const AccountMetrics: Component<{ handle: string; account: () => Account | null | undefined }> = (props) => {
  const clientUtcOffset = new Date().getTimezoneOffset();

  const [metrics, { refetch }] = createResource(
    () => ({
      handle: props.handle,
      params: { utcOffset: new Date().getTimezoneOffset(), period: "30d" as periodKeys },
    }),
    async ({ handle, params }) =>
      server$(async (handle, params: { period: periodKeys; utcOffset: number }) => {
        const user = await requireAuth(server$.request);
        if (!usePermissions(user).account.view(handle)) throwUnauthorized();
        return getAccountMetrics(handle, params);
      })(handle, params)
  );

  onMount(() => {
    if (metrics()?.offset != clientUtcOffset) refetch();
  });

  const followersHistory = () =>
    metricsToChartData(metrics.latest?.metrics, "followers", props.account()?.followersCount ?? 0);
  const followingHistory = () =>
    metricsToChartData(metrics.latest?.metrics, "following", props.account()?.followingCount ?? 0);
  const statusesHistory = () =>
    metricsToChartData(metrics.latest?.metrics, "statuses", props.account()?.statusesCount ?? 0);

  return (
    <Suspense>
      <div class="mt-6">
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard title="Total Followers" values={followersHistory()} />
          <StatCard title="Total Following" values={followingHistory()} />
          <StatCard title="Posts" values={statusesHistory()} />
        </dl>
      </div>
    </Suspense>
  );
};

function metricsToChartData(metrics: AggregateMetric[] | undefined, key: keyof Metric, defaultValue: number = 0) {
  return metrics?.length
    ? metrics.map((m: any) => ({ date: m.date, value: m[key] }))
    : [{ date: new Date(), value: defaultValue }];
}
