import { actions } from "astro:actions";
import { type Component, createResource } from "solid-js";
import type { AggregateMetric } from "~/backend/metrics";
import { mapMetricsToDelta, mapMetricsToProgression } from "~/lib/dashboard";
import type { periodKeys } from "~/lib/period";
import { withInitialData } from "~/lib/resource";
import { StatCard } from "../Statcard";

export type MetricsAccount = {
  followersCount: number | null;
  followingCount: number | null;
  statusesCount: number | null;
};

type MetricsParams = { handle: string; utcOffset: number; period: periodKeys };
type MetricsResponse = { metrics: AggregateMetric[]; offset: number };

export const AccountMetrics: Component<{ handle: string; account: MetricsAccount; initial?: MetricsResponse }> = (
  props
) => {
  // Metrics are aggregated per day in the timezone of the browser, server rendered metrics are refetched when the
  // timezone of the server differs.
  const [metrics] = createResource(
    () => ({ handle: props.handle, utcOffset: new Date().getTimezoneOffset(), period: "30d" as periodKeys }),
    withInitialData(
      props.initial,
      (params: MetricsParams) => actions.metrics.orThrow(params),
      (params: MetricsParams) => props.initial?.offset === params.utcOffset
    )
  );

  const followersHistory = () =>
    mapMetricsToProgression(metrics.latest?.metrics, "followers", props.account.followersCount ?? 0);
  const interactionsHistory = () => mapMetricsToDelta(metrics.latest?.metrics, "engagements", 0);
  const statusesHistory = () =>
    mapMetricsToProgression(metrics.latest?.metrics, "statuses", props.account.statusesCount ?? 0);

  return (
    <div class="mt-6">
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard title="Total Followers" values={followersHistory()} />
        <StatCard title="Interactions" values={interactionsHistory()} />
        <StatCard title="Posts" values={statusesHistory()} />
      </dl>
    </div>
  );
};
