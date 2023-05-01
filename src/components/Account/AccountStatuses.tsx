import { Account } from "@prisma/client";
import { Component, createSignal, createResource, Switch, Match, For, Show } from "solid-js";
import server$ from "solid-start/server";
import { requireAuth, throwUnauthorized } from "~/backend/authentication";
import { getStatusesParams, getStatuses, orderKeys } from "~/backend/statuses";
import { periodKeys } from "~/lib/period";
import { usePermissions } from "~/lib/permissions";
import { Select } from "../Select";
import { StatusList } from "../Status";
import { Tabbar } from "../Tabbar";
import { Checkbox } from "../Checkbox";
import { Icons } from "../Icon";
import { Popover, PopoverTrigger } from "../Popover";
import { debounce } from "~/lib/utils";
import { TextField } from "../TextField";

const fetchStatuses = server$(async (handle, params: getStatusesParams) => {
  const user = await requireAuth(server$.request);
  if (!usePermissions(user).account.view(handle)) throwUnauthorized();
  return getStatuses(handle, params);
});

export const AccountStatuses: Component<{ handle: string; account: () => Account | null | undefined }> = (props) => {
  const [period, setPeriod] = createSignal<periodKeys>("30d");
  const [ordering, setOrdering] = createSignal<orderKeys>("engagements");
  const [loading, setLoading] = createSignal(false);
  const [excludeRepies, setExcludeReplies] = createSignal(true);
  const [query, setQuery] = createSignal("");

  const [data, { mutate }] = createResource(
    () => ({
      handle: props.handle,
      params: { period: period(), order: ordering(), includeReplies: !excludeRepies(), query: query() },
    }),
    async ({ handle, params }) => {
      if (params.order === "publishedAt") params.period = "all";
      const [result, err] = await fetchStatuses(handle, params);
      if (err) throw err;
      return result;
    }
  );

  async function loadMore() {
    if (loading()) return;
    setLoading(true);
    const [result, err] = await fetchStatuses(props.handle, {
      ...((data()?.params ?? {}) as getStatusesParams),
      skip: data()?.statuses.length,
      limit: 50,
    });
    if (err) throw err;
    mutate((data) => ({ ...data, ...result, statuses: [...(data?.statuses ?? []), ...result.statuses] }));
    setLoading(false);
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
      <div class="mb-0 mt-8 flex items-center gap-4 px-4 sm:mt-12 sm:px-0">
        <Tabbar
          class="flex-auto"
          tabs={tabs}
          active={ordering()}
          onChange={({ key }) => setOrdering(key as orderKeys)}
        />
        <Popover
          title="Filters"
          triggerEl={
            <PopoverTrigger class="rounded p-2 text-mastodon-purple-500 focus:outline-none focus-visible:bg-mastodon-purple-600 focus-visible:text-white dark:text-white/80">
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
          onChange={setPeriod}
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
            <div class="p-6 text-mastodon-purple-600 dark:text-mastodon-purple-100">No posts found</div>
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

const orderingOptions: { [key in orderKeys]?: string } = {
  engagements: "Top posts",
  publishedAt: "Latest posts",
};
