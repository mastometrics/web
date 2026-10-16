import { actions } from "astro:actions";
import { type Component, createResource, createSignal, For, Match, type ParentComponent, Switch } from "solid-js";
import type { listUsersParams, listUsersResponse, UserFilters, UserOrderKeys } from "~/backend/users";
import { Checkbox } from "~/components/Checkbox";
import { HoverCard } from "~/components/HoverCard";
import { Icons } from "~/components/Icon";
import { TinyLoadingIndicator } from "~/components/LoadingIndicator";
import { Popover, PopoverTrigger } from "~/components/Popover";
import { cls } from "~/lib/css";
import { formatRelativeTime } from "~/lib/format";
import { type AccountMetadata, readMetadata } from "~/lib/metadata";
import { withInitialData } from "~/lib/resource";
import { debounce } from "~/lib/utils";

const fetchUsers = (params: listUsersParams) => actions.listUsers.orThrow(params);

function createUsersState(initial?: listUsersResponse) {
  const [order, setOrder] = createSignal<UserOrderKeys>("lastLogin");
  const [dir, setDir] = createSignal<"asc" | "desc">("desc");
  const [loading, setLoading] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [isSuspended, setIsSuspended] = createSignal(false);

  const [data, { mutate }] = createResource(
    () => ({
      order: order(),
      dir: dir(),
      query: query(),
      filters: isSuspended() ? (["suspended"] as UserFilters[]) : [],
    }),
    withInitialData(initial, (params: listUsersParams) => fetchUsers(params))
  );

  async function loadMore() {
    if (loading()) return;
    setLoading(true);
    try {
      const result = await fetchUsers({
        ...((data()?.params ?? {}) as listUsersParams),
        skip: data()?.users.length,
        limit: 50,
      });
      mutate((data) => ({ ...data, ...result, users: [...(data?.users ?? []), ...result.users] }));
    } finally {
      setLoading(false);
    }
  }

  const isOrderActive = (key: UserOrderKeys) => order() === key;
  const toggleDir = (dir?: "asc" | "desc") => setDir((d) => dir ?? (d === "asc" ? "desc" : "asc"));
  return {
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

export const AdminUsers: Component<{ userCount: number; initial?: listUsersResponse }> = (props) => {
  const { data, order, loading, loadMore, query, suspended } = createUsersState(props.initial);
  const userCount = () => props.userCount;

  const search = debounce((q: string) => query.set(q.trim()), 300);

  return (
    <div class="mt-6 px-0 py-2 sm:py-4 lg:px-6">
      <div class="mb-4 flex items-center px-6 lg:px-0">
        <p class="text-mastodon-purple-500 flex-auto">{userCount()} registered users</p>
        <Popover
          title="Options"
          triggerEl={
            <PopoverTrigger class="text-mastodon-purple-500 focus-visible:bg-mastodon-purple-600 rounded-sm p-2 focus:outline-hidden focus-visible:text-white dark:text-white/80">
              <Icons.Adjustments />
            </PopoverTrigger>
          }
        >
          <Checkbox checked={suspended.value()} onChange={suspended.set}>
            Suspended
          </Checkbox>
        </Popover>
        <div class="relative ml-4">
          <Icons.Search class="pointer-events-none absolute top-1/2 left-2 w-4 -translate-y-1/2 transform" />
          <input
            type="text"
            class="border-mastodon-purple-200 text-mastodon-purple-900 focus:ring-mastodon-purple-500 dark:border-mastodon-purple-700 rounded-lg bg-white px-2 py-2 pl-8 text-sm focus:outline-hidden dark:bg-black/90 dark:text-white"
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
            "dark:bg-mastodon-purple-800/30 dark:outline-mastodon-purple-800/70 table min-w-full table-fixed bg-white whitespace-nowrap shadow-sm sm:rounded-md dark:shadow-none dark:outline",
            data.loading && "opacity-60"
          )}
        >
          <thead>
            <tr class="bg-mastodon-purple-100 dark:bg-mastodon-purple-700/20 text-left">
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
          <Switch
            fallback={
              <tbody>
                <tr>
                  <td colspan={6} class="p-4">
                    Loading...
                  </td>
                </tr>
              </tbody>
            }
          >
            <Match when={data.error}>
              <tbody>
                <tr>
                  <td colspan={6} class="p-4 text-red-400">
                    {data.error?.message}
                  </td>
                </tr>
              </tbody>
            </Match>
            <Match when={data.latest?.users}>
              <tbody>
                <For each={data.latest?.users}>{(user) => <UserRow user={user} />}</For>
                {data.latest?.hasMore && (
                  <tr>
                    <td class="p-2" colspan={6}>
                      <button
                        class="bg-mastodon-purple-100/30 text-mastodon-purple-600 hover:bg-mastodon-purple-100/50 dark:bg-mastodon-purple-800/20 dark:hover:bg-mastodon-purple-800/30 w-full rounded-md py-2 text-sm"
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
};

const ColumnHeader: ParentComponent<{
  orderKey?: UserOrderKeys;
  order: ReturnType<typeof createUsersState>["order"];
  class?: string;
}> = (props) => {
  const active = () => props.orderKey && props.order.is(props.orderKey);
  return (
    <th
      class={cls(
        "text-mastodon-purple-600 dark:text-mastodon-purple-500 p-2 font-normal",
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
    <tr class="group border-mastodon-purple-100 hover:bg-mastodon-purple-100/30 dark:border-mastodon-purple-800 dark:hover:bg-mastodon-purple-800/20 border-b">
      <td class="px-2">
        <div class="relative flex min-w-0 items-center">
          <img class="m-3 ml-0 h-6 w-6 flex-none rounded-xs object-cover" src={account().avatar!} alt="" />
          <p class="flex-auto py-1">
            <a href={`/dashboard/${account().username}`} class="text-sm whitespace-normal sm:text-base">
              <span class="mr-2 block lg:inline">{account().displayName}</span>
              <span class="text-mastodon-purple-900/50 dark:text-mastodon-purple-300 whitespace-nowrap">
                {account().username}
              </span>
            </a>
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
              <div class="max-h-40 max-w-xl space-y-2 overflow-auto font-mono text-xs whitespace-normal">
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
      <td class="text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400 px-2 text-right">
        {account().followersCount}
      </td>
      <td class="text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400 px-2 pr-6 text-right">
        {account().statusesCount}
      </td>
      <td class="px-2 text-sm">{formatRelativeTime(account().lastIndex)}</td>
      <td class="px-2 text-sm">{formatRelativeTime(props.user.lastSeen)}</td>
      <td class="px-2 text-sm">{formatRelativeTime(props.user.createdAt)}</td>
    </tr>
  );
};
