import { actions } from "astro:actions";
import { type Component, createSignal, createResource, Switch, Match, For, Show } from "solid-js";
import type { getStatusesParams, getStatusesResponse, orderKeys } from "~/backend/statuses";
import { withInitialData } from "~/lib/resource";
import type { periodKeys } from "~/lib/period";
import { Select } from "../Select";
import { StatusList } from "../Status";
import { Tabbar } from "../Tabbar";
import { Checkbox } from "../Checkbox";
import { Icons } from "../Icon";
import { Popover, PopoverTrigger } from "../Popover";
import { TextField } from "../TextField";

const fetchStatuses = (handle: string, params: getStatusesParams) => actions.statuses.orThrow({ handle, ...params });

export const AccountStatuses: Component<{ handle: string; initial?: getStatusesResponse }> = (props) => {
  // The server falls back to all time when there are no recent posts
  const [period, setPeriod] = createSignal<periodKeys>(props.initial?.params.period ?? "30d");
  const [ordering, setOrdering] = createSignal<orderKeys>("engagements");
  const [loading, setLoading] = createSignal(false);
  const [excludeRepies, setExcludeReplies] = createSignal(true);
  const [query, setQuery] = createSignal("");

  const [data, { mutate }] = createResource(
    () => ({
      handle: props.handle,
      params: { period: period(), order: ordering(), includeReplies: !excludeRepies(), query: query() },
    }),
    withInitialData(props.initial, async ({ handle, params }: { handle: string; params: getStatusesParams }) => {
      if (params.order === "publishedAt") params.period = "all";
      return fetchStatuses(handle, params);
    })
  );

  async function loadMore() {
    if (loading()) return;
    setLoading(true);
    try {
      const result = await fetchStatuses(props.handle, {
        ...((data()?.params ?? {}) as getStatusesParams),
        skip: data()?.statuses.length,
        limit: 50,
      });
      mutate((data) => ({ ...data, ...result, statuses: [...(data?.statuses ?? []), ...result.statuses] }));
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    {
      key: "engagements",
      title: "Top posts",
    },
    {
      key: "boosts",
      title: "Most boosted",
    },
    {
      key: "publishedAt",
      title: "Latest",
    },
  ];
  const periods = Object.entries(periodOptions).map(([value, label]) => ({ value, label }));

  return (
    <>
      <div class="mt-8 mb-0 flex items-center gap-4 px-4 sm:mt-12 sm:px-0">
        <Tabbar
          class="min-w-0 flex-auto"
          tabs={tabs}
          active={ordering()}
          onChange={({ key }) => setOrdering(key as orderKeys)}
        />
        <Popover
          title="Filters"
          triggerEl={
            <PopoverTrigger class="text-mastodon-purple-500 focus-visible:bg-mastodon-purple-600 rounded-sm p-2 focus:outline-hidden focus-visible:text-white dark:text-white/80">
              <Icons.Adjustments />
            </PopoverTrigger>
          }
        >
          <TextField
            label="Search"
            value={query()}
            debounce={300}
            onChange={setQuery}
            icon={Icons.Search}
            class="my-4"
          />

          <Checkbox checked={excludeRepies()} onChange={setExcludeReplies}>
            Exclude replies
          </Checkbox>
        </Popover>
        <Select
          options={periods}
          value={period()}
          onChange={(value) => setPeriod(value as periodKeys)}
          label="Select a period"
          hideLabel
          disabled={ordering() === "publishedAt"}
        />
      </div>
      <StatusList.Wrapper loading={data.loading}>
        <Switch fallback={<>Loading</>}>
          <Match when={data.error}>
            <div class="text-red-400">{data.error.message}</div>
          </Match>
          <Match when={!data.latest?.statuses?.length}>
            <div class="text-mastodon-purple-600 dark:text-mastodon-purple-100 p-6">No posts found</div>
          </Match>
          <Match when={data.latest?.statuses}>
            <For each={data.latest?.statuses}>{(status) => <StatusList.Item status={status} />}</For>
            <Show when={data.latest?.hasMore}>
              <StatusList.LoadMoreButton action={loadMore} loading={loading()} />
            </Show>
          </Match>
        </Switch>
      </StatusList.Wrapper>
    </>
  );
};

const periodOptions: { [key in periodKeys]?: string } = {
  "24h": "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  // "90d": "Last 90 days",
  // "1y": "Last year",
  all: "All time",
};
