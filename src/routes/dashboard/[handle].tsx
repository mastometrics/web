import { Metric, Status } from "@prisma/client";
import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, onMount, Show, Suspense } from "solid-js";
import { isServer } from "solid-js/web";
import { RouteDataArgs, Title, useLocation, useNavigate, useRouteData } from "solid-start";
import server$, { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { TinyLoadingIndicator } from "~/components/LoadingIndicator";
import { Select } from "~/components/Select";
import { StatCard } from "~/components/Statcard";
import { StatusList } from "~/components/Status";
import { Tabbar } from "~/components/Tabbar";
import { getFullAccount, getStatuses, orderKeys, startTracking, syncAccount } from "~/db/account";
import { AggregateMetric, getAccountMetrics } from "~/db/metrics";
import { getUser } from "~/db/session";
import { formatRelativeTime } from "~/lib/format";
import { periodKeys } from "~/lib/period";
import { useAuthentication } from "~/lib/useAuthentication";

const periodOptions: { [key in periodKeys]?: string } = {
  "24h": "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  // "90d": "Last 90 days",
  // "1y": "Last year",
  all: "All time",
};
const orderingOptions: { [key in orderKeys]?: string } = {
  engagements: "Top posts",
  publishedAt: "Latest posts",
};

const fetchAccount = server$(getFullAccount);
const fetchStatuses = server$(getStatuses);
const fetchMetrics = server$(getAccountMetrics);

export function routeData({ params }: RouteDataArgs) {
  createServerData$(
    async (handle, { request }) => {
      const user = await getUser(request);
      // Simplistic way to prevent unauthorized access to other users' dashboards
      if (!user?.isAdmin && user?.account?.username != handle) return redirect(`/dashboard/${user?.account?.username}`);
    },
    {
      key: () => params.handle,
    }
  );

  const [period, setPeriod] = createSignal<periodKeys>("30d");
  const [ordering, setOrdering] = createSignal<orderKeys>("engagements");
  const [loading, setLoading] = createSignal(false);
  const [accountData, { mutate }] = createResource(params.handle, async (handle) => {
    const [data, err] = await fetchAccount(handle, { period: period(), order: "engagements" });
    if (err) throw err;
    return data;
  });

  const [metrics, { refetch: loadMetrics }] = createResource(
    () => ({
      handle: params.handle,
      params: { utcOffset: new Date().getTimezoneOffset(), period: "30d" as periodKeys },
    }),
    async ({ handle, params }) => fetchMetrics(handle, params)
  );

  const [statuses, setStatuses] = createSignal<Status[]>(accountData()?.statuses ?? accountData.latest?.statuses ?? []);
  const [hasMore, setHasMore] = createSignal(accountData()?.hasMore ?? accountData.latest?.hasMore ?? false);

  createEffect(async () => {
    if (loading()) return;
    if (period() != accountData()?.params.period || ordering() != accountData()?.params.order) {
      setLoading(true);
      const [result, err] = await fetchStatuses(params.handle, { period: period(), order: ordering() });
      if (err) throw err;
      mutate((data) => ({ ...data!, statuses: result?.statuses, params: { ...data!.params, ...result.params } }));
      setStatuses(result.statuses);
      setLoading(false);
      setHasMore(result.hasMore);
    }
  });

  function loadMore() {
    if (loading()) return;
    setLoading(true);
    fetchStatuses(params.handle, { period: period(), order: ordering(), skip: statuses().length }).then(
      ([result, err]) => {
        if (err) throw err;
        setStatuses((prev) => [...prev, ...result.statuses]);
        setLoading(false);
        setHasMore(result.hasMore);
      }
    );
  }

  return {
    account: () => accountData()?.account ?? accountData.latest?.account,
    metrics, //: () => accountData()?.metrics ?? accountData.latest?.metrics ?? [],
    // statuses: () => accountData()?.statuses ?? accountData.latest?.statuses,
    loadMetrics,
    statuses,
    resource: accountData,
    period,
    setPeriod,
    ordering,
    setOrdering,
    loadMore,
    loading,
    hasMore,
  };
}

function metricsToChartData(metrics: AggregateMetric[] | undefined, key: keyof Metric, defaultValue: number = 0) {
  return metrics?.length
    ? metrics.map((m: any) => ({ date: m.date, value: m[key] }))
    : [{ date: new Date(), value: defaultValue }];
}

export default function AccountHandleRoute() {
  const user = useAuthentication();
  const params = useParams();
  const {
    account,
    metrics,
    period,
    setPeriod,
    statuses,
    loading,
    ordering,
    setOrdering,
    hasMore,
    loadMore,
    loadMetrics,
  } = useRouteData<typeof routeData>();

  const [syncing, sync] = createServerAction$((handle: string) => syncAccount(handle));
  const [pendingTracking, track] = createServerAction$(startTracking);
  const clientUtcOffset = new Date().getTimezoneOffset();
  const followersHistory = () => metricsToChartData(metrics()?.metrics, "followers", account()?.followersCount ?? 0);
  const followingHistory = () => metricsToChartData(metrics()?.metrics, "following", account()?.followingCount ?? 0);
  const statusesHistory = () => metricsToChartData(metrics()?.metrics, "statuses", account()?.statusesCount ?? 0);

  async function startTrackingAccount() {
    if (await track(account()?.username!)) window.location.reload();
  }

  onMount(() => {
    if (!account()?.tracking && user()?.account?.id == account()?.id) startTrackingAccount();
    if (metrics()?.offset != clientUtcOffset) loadMetrics();
  });

  const tabs = Object.entries(orderingOptions).map(([key, title]) => ({ key, title }));
  const periods = Object.entries(periodOptions).map(([value, label]) => ({ value, label }));
  return (
    <>
      <Suspense>
        <Title>MastoMetrics - {account()?.displayName ?? params.handle}</Title>
        <Show when={account()} keyed>
          {(acc) => (
            <div class="bg-mastodon-purple-100/90 dark:bg-mastodon-purple-800/10">
              <div class="container mx-auto max-w-4xl py-8 px-6">
                <div class="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
                  <div class="ml-4 mt-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <img class="h-16 w-16 rounded-md" src={acc.avatar!} alt={acc.displayName!} />
                      </div>
                      <div class="ml-4">
                        <h3 class="text-lg font-medium leading-6 text-mastodon-purple-800 dark:text-mastodon-purple-100 sm:text-xl">
                          {acc.displayName}
                        </h3>
                        <p class="text-sm text-mastodon-purple-900/50 dark:text-mastodon-purple-300 sm:text-base">
                          <a href="#"> {acc.username} </a>
                        </p>
                        {acc.lastIndex && (
                          <p class="mt-2 text-xs text-mastodon-purple-800/50 dark:text-mastodon-purple-200 sm:hidden">
                            Last updated {formatRelativeTime(acc.lastIndex)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 mt-4 flex flex-shrink-0 flex-col items-end gap-2">
                    {acc.lastIndex && (
                      <p class="hidden text-xs text-mastodon-purple-800/50 dark:text-mastodon-purple-200 sm:block ">
                        Last updated {formatRelativeTime(acc.lastIndex)}
                      </p>
                    )}
                    <Show when={user()?.isAdmin}>
                      <div class="flex-wrap gap-4">
                        {!acc.tracking && (
                          <button
                            type="button"
                            class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => track(params.handle)}
                            disabled={pendingTracking.pending}
                          >
                            <span> Start Tracking </span>
                          </button>
                        )}
                        <button
                          type="button"
                          class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25"
                          onClick={() => sync(params.handle)}
                          disabled={syncing.pending}
                        >
                          <span> Sync </span>
                        </button>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Show>
        {/* <Show when={!resource() && !resource.loading} keyed>
          Not found <button onClick={() => sync(params.handle)}>Import account</button>
        </Show> */}
      </Suspense>

      <div class="container mx-auto max-w-4xl px-4 py-2 sm:py-4 sm:px-6">
        <Suspense>
          <div class="mt-6">
            {/* <h3 class="text-lg leading-6 font-medium text-gray-900">{periodOptions[period()]}</h3> */}
            <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <StatCard title="Total Followers" values={followersHistory()} />
              <StatCard title="Total Following" values={followingHistory()} />
              <StatCard title="Posts" values={statusesHistory()} />
            </dl>
          </div>
        </Suspense>
        {account()?.tracking == false && pendingTracking.pending && (
          <div class="my-8 rounded-lg bg-mastodon-purple-200/50  px-5 py-6 text-mastodon-purple-800  dark:bg-mastodon-purple-800/40 dark:text-white sm:px-6">
            <TinyLoadingIndicator /> Importing account data
          </div>
        )}
        <div class="mb-0 mt-8 flex items-center gap-4 sm:mt-12 ">
          <Tabbar
            class="flex-auto"
            tabs={tabs}
            active={ordering()}
            onChange={({ key }) => setOrdering(key as orderKeys)}
          />
          <Select options={periods} value={period()} onChange={setPeriod} label="Select a period" hideLabel />
        </div>
      </div>
      <div class="container mx-auto max-w-4xl sm:mb-12 sm:px-6">
        <StatusList.Wrapper>
          <For each={statuses()}>{(status) => <StatusList.Item status={status} />}</For>
          {hasMore() && <StatusList.LoadMoreButton action={() => loadMore()} loading={loading()} />}
        </StatusList.Wrapper>
      </div>
    </>
  );
}
