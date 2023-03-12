import { A } from "@solidjs/router";
import { Component, createResource, createSignal, For, Match, ParentComponent, Switch } from "solid-js";
import { useRouteData } from "solid-start";
import server$, { createServerData$ } from "solid-start/server";
import { requireAuth, throwUnauthorized } from "~/backend/authentication";
import { throwOnError } from "~/backend/db";
import {
  getTotalUserCount,
  listUsers,
  listUsersParams,
  listUsersResponse,
  UserFilters,
  UserOrderKeys,
} from "~/backend/users";
import { Checkbox } from "~/components/Checkbox";
import { HoverCard } from "~/components/HoverCard";
import { Icons } from "~/components/Icon";
import { TinyLoadingIndicator } from "~/components/LoadingIndicator";
import { Popover, PopoverTrigger } from "~/components/Popover";
import { cls } from "~/lib/css";
import { formatRelativeTime } from "~/lib/format";
import { AccountMetadata, readMetadata } from "~/lib/metadata";
import { Roles } from "~/lib/permissions";
import { debounce } from "~/lib/utils";

const fetchUsers = server$(async (params: listUsersParams) => {
  const user = await requireAuth(server$.request);
  if (!user?.roles.includes(Roles.Admin)) throwUnauthorized();
  return listUsers(params);
});

export function routeData() {
  const [order, setOrder] = createSignal<UserOrderKeys>("lastLogin");
  const [dir, setDir] = createSignal<"asc" | "desc">("desc");
  const [loading, setLoading] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [isSuspended, setIsSuspended] = createSignal(false);
  const userCount = createServerData$(getTotalUserCount);

  const [data, { mutate }] = createResource(
    () => ({
      order: order(),
      dir: dir(),
      query: query(),
      filters: isSuspended() ? (["suspended"] as UserFilters[]) : [],
    }),
    async (params) => throwOnError(await fetchUsers(params))
  );

  async function loadMore() {
    if (loading()) return;
    setLoading(true);
    const result = throwOnError(
      await fetchUsers({
        ...((data()?.params ?? {}) as listUsersParams),
        skip: data()?.users.length,
        limit: 50,
      })
    );
    mutate((data) => ({ ...data, ...result, users: [...(data?.users ?? []), ...result.users] }));
    setLoading(false);
  }

  const isOrderActive = (key: UserOrderKeys) => order() === key;
  const toggleDir = (dir?: "asc" | "desc") => setDir((d) => dir ?? (d === "asc" ? "desc" : "asc"));
  return {
    userCount,
    data,
    order: {
      set: setOrder,
      active: order,
      is: isOrderActive,
      dir,
      toggleDir,
    },
    loading,
    query: {
      value: query,
      set: setQuery,
    },
    suspended: {
      value: isSuspended,
      set: setIsSuspended,
    },
    loadMore,
  };
}

export default function AdminRoute() {
  const { data, order, loading, loadMore, userCount, query, suspended } = useRouteData<typeof routeData>();

  const search = debounce((q: string) => query.set(q.trim()), 300);

  return (
    <div class="mt-6 px-0 py-2 sm:py-4 lg:px-6">
      <div class="mb-4 flex items-center px-6 lg:px-0">
        <p class="flex-auto text-mastodon-purple-500">{userCount()} registered users</p>
        <Popover
          title="Options"
          triggerEl={
            <PopoverTrigger class="rounded p-2 text-mastodon-purple-500 focus:outline-none focus-visible:bg-mastodon-purple-600 focus-visible:text-white dark:text-white/80">
              <Icons.Adjustments />
            </PopoverTrigger>
          }
        >
          <Checkbox checked={suspended.value()} onChange={suspended.set}>
            Suspended
          </Checkbox>
        </Popover>
        <div class="relative ml-4">
          <Icons.Search class="pointer-events-none absolute left-2 top-1/2 w-4 -translate-y-1/2 transform " />
          <input
            type="text"
            class="rounded-lg border-mastodon-purple-200 bg-white px-2 py-2 pl-8 text-sm text-mastodon-purple-900 focus:outline-none focus:ring-mastodon-purple-500 dark:border-mastodon-purple-700 dark:bg-black/90 dark:text-white"
            placeholder="Search"
            value={query.value()}
            onInput={(e) => search((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>
      <div class="mx-auto overflow-auto">
        <table
          role="table"
          class={cls(
            "table min-w-full table-fixed whitespace-nowrap bg-white shadow dark:bg-mastodon-purple-800/30 dark:shadow-none dark:outline dark:outline-mastodon-purple-800/70 sm:rounded-md",
            data.loading && "opacity-60"
          )}
        >
          <thead>
            <tr class="bg-mastodon-purple-100 text-left dark:bg-mastodon-purple-700/20">
              <ColumnHeader order={order}>Account</ColumnHeader>
              <ColumnHeader orderKey="followerCount" order={order} class="text-right">
                <Icons.Users class="inline-block w-4" />
              </ColumnHeader>
              <ColumnHeader orderKey="statusCount" order={order} class="pr-6 text-right">
                <Icons.Notes class="inline-block w-4" />
              </ColumnHeader>

              <ColumnHeader orderKey="lastIndex" order={order}>
                Last Index
              </ColumnHeader>
              <ColumnHeader orderKey="lastLogin" order={order}>
                Last Login
              </ColumnHeader>
              <ColumnHeader orderKey="createdAt" order={order}>
                Signed up
              </ColumnHeader>
            </tr>
          </thead>
          <Switch fallback={<>Loading...</>}>
            <Match when={data.error}>
              <div class="text-red-400">{data.error.message}</div>
            </Match>
            <Match when={data.latest?.users}>
              <tbody>
                <For each={data.latest?.users}>{(user) => <UserRow user={user} />}</For>
                {data.latest?.hasMore && (
                  <tr>
                    <td class="p-2" colspan={6}>
                      <button
                        class="w-full rounded-md bg-mastodon-purple-100/30 py-2 text-sm text-mastodon-purple-600 hover:bg-mastodon-purple-100/50 dark:bg-mastodon-purple-800/20 dark:hover:bg-mastodon-purple-800/30"
                        onClick={() => loadMore()}
                      >
                        {loading() ? <TinyLoadingIndicator /> : "Load more"}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </Match>
          </Switch>
        </table>
      </div>
    </div>
  );
}

const ColumnHeader: ParentComponent<{
  orderKey?: UserOrderKeys;
  order: ReturnType<typeof routeData>["order"];
  class?: string;
}> = (props) => {
  const active = () => props.orderKey && props.order.is(props.orderKey);
  return (
    <th
      class={cls(
        "p-2 font-normal text-mastodon-purple-600 dark:text-mastodon-purple-500",
        active() && "font-bold",
        props.class
      )}
    >
      {props.orderKey ? (
        <button
          onClick={() => {
            props.order.toggleDir(active() ? undefined : "desc");
            props.order.set(props.orderKey!);
          }}
        >
          {props.children}
          {active() && props.order.dir() === "asc" && <Icons.ChevronUp class="inline-block w-4" />}
          {active() && props.order.dir() === "desc" && <Icons.ChevronDown class="inline-block w-4" />}
        </button>
      ) : (
        props.children
      )}
    </th>
  );
};

const UserRow: Component<{ user: listUsersResponse["users"][number] }> = (props) => {
  const account = () => props.user.Account;
  const meta = () => readMetadata<AccountMetadata>(account().metadata);
  const suspended = () => !!meta().suspendedSync;
  const revoked = () => suspended() && meta()?.warnings?.[0]?.message.includes("token rejected");

  const errored = () => {
    const lastWarning = meta()?.warnings?.[0];
    if (
      lastWarning &&
      new Date(lastWarning?.timestamp).valueOf() > new Date(account().lastIndex).valueOf() - 1000 * 60 * 60 * 24
    )
      return true;
    return false;
  };

  return (
    <tr class="group border-b border-mastodon-purple-100 hover:bg-mastodon-purple-100/30 dark:border-mastodon-purple-800 dark:hover:bg-mastodon-purple-800/20">
      <td class="px-2">
        <div class="relative flex min-w-0 items-center">
          <img class="m-3 ml-0 h-6 w-6 flex-none rounded-sm object-cover" src={account().avatar!} />
          <p class="flex-auto py-1">
            <A href={`/dashboard/${account().username}`} class="whitespace-normal text-sm sm:text-base">
              <span class="mr-2 block lg:inline">{account().displayName}</span>
              <span class="whitespace-nowrap text-mastodon-purple-900/50 dark:text-mastodon-purple-300">
                {account().username}
              </span>
            </A>
          </p>
          {(suspended() || meta().warnings) && (
            <HoverCard
              triggerEl={
                <Switch fallback={<Icons.AlertTriangleFilled class="w-5 text-orange-500/20" />}>
                  <Match when={revoked()}>
                    <Icons.KeyOff class="w-5 text-red-500" />
                  </Match>
                  <Match when={suspended()}>
                    <Icons.AlertOctagonFilled class="w-5 text-red-500" />
                  </Match>
                  <Match when={errored()}>
                    <Icons.AlertTriangleFilled class="w-5 text-orange-500" />
                  </Match>
                </Switch>
              }
            >
              <div class="max-h-40 max-w-xl space-y-2 overflow-auto whitespace-normal font-mono text-xs">
                {suspended() && (
                  <p>
                    <strong class="font-bold">Suspended syncing</strong>{" "}
                    <span class="opacity-50">{formatRelativeTime(meta().suspendedSync)}</span>
                  </p>
                )}
                {meta().warnings?.map(({ message, timestamp }) => (
                  <p>
                    {message} <span class="opacity-50">{formatRelativeTime(timestamp)}</span>
                  </p>
                ))}
              </div>
            </HoverCard>
          )}
        </div>
      </td>
      <td class="px-2 text-right text-mastodon-purple-900/30  group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400">
        {account().followersCount}
      </td>
      <td class="px-2 pr-6 text-right text-mastodon-purple-900/30  group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400">
        {account().statusesCount}
      </td>
      <td class="px-2 text-sm">{formatRelativeTime(account().lastIndex)}</td>
      <td class="px-2 text-sm">{formatRelativeTime(props.user.lastSeen)}</td>
      <td class="px-2 text-sm">{formatRelativeTime(props.user.createdAt)}</td>
    </tr>
  );
};
