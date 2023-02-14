import { Status } from "@prisma/client";
import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show, Suspense } from "solid-js";
import { RouteDataArgs, Title, useLocation, useRouteData } from "solid-start";
import server$, { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { Select } from "~/components/Select";
import { StatCard } from "~/components/Statcard";
import { StatusList } from "~/components/Status";
import { Tabbar } from "~/components/Tabbar";
import { getFullAccount, getStatuses, orderKeys, periodKeys, startTracking, syncAccount } from "~/db/account";
import { getUser } from "~/db/session";
import { formatDate, formatRelativeTime } from "~/lib/format";
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

export function routeData({ params }: RouteDataArgs) {
  createServerData$(
    async (handle, { request }) => {
      const [user] = await getUser(request);
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
  const [statuses, setStatuses] = createSignal<Status[]>(accountData()?.statuses ?? accountData.latest?.statuses ?? []);
  const [hasMore, setHasMore] = createSignal(false);

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
    // statuses: () => accountData()?.statuses ?? accountData.latest?.statuses,
    statuses,
    resource: accountData,
    period,
    setPeriod,
    ordering,
    setOrdering,
    loadMore,
    hasMore,
  };
}

export default function AccountHandleRoute() {
  const user = useAuthentication();
  const params = useParams();

  const { account, period, setPeriod, statuses, resource, ordering, setOrdering, hasMore, loadMore } =
    useRouteData<typeof routeData>();

  const [syncing, sync] = createServerAction$(syncAccount);
  const [_, track] = createServerAction$(startTracking);

  const followersHistory = () => account()?.Metrics.map((h) => ({ date: h.date, value: h.followers ?? 0 })) ?? [];
  const followingHistory = () => account()?.Metrics.map((h) => ({ date: h.date, value: h.following ?? 0 })) ?? [];
  const statusesHistory = () => account()?.Metrics.map((h) => ({ date: h.date, value: h.statuses ?? 0 })) ?? [];

  const tabs = Object.entries(orderingOptions).map(([key, title]) => ({ key, title }));
  const periods = Object.entries(periodOptions).map(([value, label]) => ({ value, label }));
  return (
    <>
      <Suspense>
        <Title>MastoMetrics - {account()?.displayName ?? params.handle}</Title>
        <Show when={account()} keyed>
          {(acc) => (
            <div class="bg-mastodon-purple-100/90">
              <div class="container max-w-4xl mx-auto  py-8  px-6">
                <div class="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
                  <div class="ml-4 mt-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <img class="h-16 w-16 rounded-md" src={acc.avatar!} alt={acc.displayName!} />
                      </div>
                      <div class="ml-4">
                        <h3 class="text-lg sm:text-xl leading-6 font-medium text-mastodon-purple-800">
                          {acc.displayName}
                        </h3>
                        <p class="sm:text-base text-sm text-mastodon-purple-900/50">
                          <a href="#"> {acc.username} </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 mt-4 flex-shrink-0 flex flex-col items-end gap-2">
                    <p class="text-mastodon-purple-900/50 text-xs sm:text-sm">
                      Last updated {formatRelativeTime(acc.lastIndex)}
                    </p>
                    <Show when={user()?.isAdmin}>
                      <div class="flex-wrap gap-4">
                        {!acc.tracking && (
                          <button
                            type="button"
                            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => track(params.handle)}
                          >
                            <span> Start Tracking </span>
                          </button>
                        )}
                        <button
                          type="button"
                          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-25"
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

      <div class="container max-w-4xl mx-auto  py-4 px-6">
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
        <div class="flex items-center">
          <Tabbar
            class="mb-4 mt-8 flex-auto"
            tabs={tabs}
            active={ordering()}
            onChange={({ key }) => setOrdering(key as orderKeys)}
          />
          <Select options={periods} value={period()} onChange={setPeriod} />
        </div>
        <StatusList.Wrapper>
          <For each={statuses()}>{(status) => <StatusList.Item status={status} />}</For>
          {hasMore() && <StatusList.LoadMoreButton action={() => loadMore()} />}
        </StatusList.Wrapper>
      </div>
    </>
  );
}
