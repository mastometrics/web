import { Account } from "@prisma/client";
import { Component, createSignal, createResource, createEffect, Switch, Match, For, Show } from "solid-js";
import server$ from "solid-start/server";
import { requireAuth, throwUnauthorized } from "~/backend/authentication";
import { getStatusesParams, getStatuses, orderKeys } from "~/backend/statuses";
import { periodKeys } from "~/lib/period";
import { usePermissions } from "~/lib/permissions";
import { Select } from "../Select";
import { StatusList } from "../Status";
import { Tabbar } from "../Tabbar";
import { Checkbox, Popover } from "@kobalte/core";
import { UIButton } from "../Button";
import { Icons } from "../Icon";

const fetchStatuses = server$(async (handle, params: getStatusesParams) => {
  const user = await requireAuth(server$.request);
  if (!usePermissions(user).account.view(handle)) throwUnauthorized();
  return getStatuses(handle, params);
});

export const AccountStatuses: Component<{ handle: string; account: () => Account | null | undefined }> = (props) => {
  const [period, setPeriod] = createSignal<periodKeys>("30d");
  const [ordering, setOrdering] = createSignal<orderKeys>("engagements");
  const [loading, setLoading] = createSignal(false);
  const [includeReplies, setIncludeReplies] = createSignal(false);

  const [data, { mutate }] = createResource(
    () => ({
      handle: props.handle,
      params: { period: period(), order: ordering(), includeReplies: includeReplies() },
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
        <Popover.Root>
          <Popover.Trigger class="rounded p-2 text-mastodon-purple-500 focus:outline-none focus-visible:bg-mastodon-purple-600 focus-visible:text-white dark:text-white/80">
            <Icons.Adjustments />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content class="origin-top rounded-md bg-white p-4 shadow-lg  animate-in fade-in zoom-in-50 duration-100 dark:bg-mastodon-purple-700 ">
              <Popover.Arrow />
              {/* <Popover.CloseButton>
                <Icons.Close />
              </Popover.CloseButton> */}
              <Popover.Title class="mb-2 text-xs font-bold uppercase  text-mastodon-purple-400 dark:text-mastodon-purple-200">
                Options
              </Popover.Title>
              <Checkbox.Root
                isChecked={includeReplies()}
                onCheckedChange={setIncludeReplies}
                class="flex flex-wrap items-center gap-2"
              >
                <Checkbox.Input class="peer" />
                <Checkbox.Control class="grid h-5 w-5 place-items-center items-center rounded-sm  border border-black/20 bg-white shadow-sm ring-white  peer-focus-visible:ring ui-checked:bg-mastodon-purple-500 ui-checked:text-white">
                  <Checkbox.Indicator>
                    <Icons.Check class="h-4 w-4" />
                  </Checkbox.Indicator>
                </Checkbox.Control>
                <Checkbox.Label>Include replies</Checkbox.Label>
              </Checkbox.Root>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
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
