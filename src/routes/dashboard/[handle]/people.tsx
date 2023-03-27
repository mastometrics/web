import { useParams } from "@solidjs/router";
import {
  Component,
  createEffect,
  createResource,
  createSignal,
  For,
  Match,
  onMount,
  ParentComponent,
  Resource,
  Suspense,
  Switch,
} from "solid-js";
import { RouteDataArgs, Title, useRouteData } from "solid-start";
import server$, { createServerData$, redirect } from "solid-start/server";
import { TinyLoadingIndicator } from "~/components/LoadingIndicator";
import { getFullAccount } from "~/backend/account";
import { formatNumber } from "~/lib/format";
import { requireAuth, throwUnauthorized, useAuthentication } from "~/backend/authentication";
import { usePermissions } from "~/lib/permissions";
import { Account } from "@prisma/client";
import { getTopPeople, getTopPeopleOrderKeys, getTopPeopleParams, PersonStats } from "~/backend/people";
import { Icon, Icons } from "~/components/Icon";
import { cls } from "~/lib/css";
import { Dynamic } from "solid-js/web";
import { MastodonRelationship } from "~/lib/mastodon/api";
import { getRelationships } from "~/backend/relationships";
import { Tabbar } from "~/components/Tabbar";
import { tooltip } from "~/components/Tooltip";
import { AccountLink } from "~/components/Account/AccountHoverCard";
import { UIButton } from "~/components/Button";
import { startSupport } from "~/lib/support";
import { Box } from "~/components/Box";

tooltip;

export function routeData({ params }: RouteDataArgs) {
  const user = createServerData$(async (_, { request }) => useAuthentication(request));
  const account = createServerData$(
    async (handle, { request }) => {
      const user = await useAuthentication(request);
      if (!usePermissions(user).account.view(handle)) throw redirect(`/dashboard/${user?.account?.username}`);
      const [data, err] = await getFullAccount(handle);
      if (err) throw err;
      return data?.account;
    },
    {
      key: () => params.handle,
    }
  );

  return {
    user,
    account,
  };
}

export default function AccountHandleRoute() {
  const { user, account } = useRouteData<typeof routeData>();

  return (
    <>
      <Title>{account()?.displayName} - People - MastoMetrics</Title>
      <div class="bg-mastodon-purple-100/90 dark:bg-mastodon-purple-800/10">
        <div class="container mx-auto max-w-4xl py-8 px-6">
          <div class="flex flex-col items-center gap-8 sm:flex-row">
            <Icons.TestPipe class=" h-12 w-12 text-mastodon-purple-500 dark:text-mastodon-purple-700" />
            <div class="flex-auto">
              <h2 class="text-base font-medium text-mastodon-purple-500">Experimental feature</h2>
              <p class="my-2 max-w-prose text-sm text-mastodon-purple-900 dark:text-mastodon-purple-200">
                This feature helps you learn more about the people you interact with often. We use your notifications to
                gather data for this view, in order to not overload your instance server. As a downside, data may not be
                100% accurate, especially if you often clear your notifications. Make sure to let us know if you like
                the feature or have any suggestions.
              </p>
              <UIButton
                onClick={() => startSupport(account(), "Feedback on 'People' page:")}
                class="mt-4 !py-1 !px-2 text-sm"
              >
                Leave feedback
              </UIButton>
            </div>
          </div>
        </div>
      </div>
      <div class="container mx-auto max-w-4xl px-4 py-2 sm:py-4 sm:px-6"></div>
      {user()?.account && (
        <div class="container mx-auto max-w-4xl sm:mb-12 sm:px-6">
          <PeopleComponent account={user()?.account!} />
        </div>
      )}
    </>
  );
}

const fetchTopPeople = server$(async (accountId: number, params: getTopPeopleParams) => {
  const user = await requireAuth(server$.request);
  if (!usePermissions(user).account.view(accountId)) throwUnauthorized();
  return getTopPeople(accountId, params);
});

const fetchRelations = server$(async (accountId: number, instanceAccountIds: string[]) => {
  const user = await requireAuth(server$.request);
  if (!usePermissions(user).account.view(accountId)) throwUnauthorized();
  return getRelationships(accountId, instanceAccountIds);
});

const PeopleComponent: Component<{ account: Account }> = (props) => {
  const [client, setClient] = createSignal(false);
  const [params, setParams] = createSignal<getTopPeopleParams>({ order: "reach" });
  const [people] = createResource(
    () => ({ id: props.account.id, params: params() }),
    ({ id, params }) => fetchTopPeople(id, params)
  );

  const [relations] = createResource(
    () => [props.account.id, people.latest?.map((p) => p.instanceAccountId) ?? [], client()] as const,
    ([accountId, instanceAccountIds, isClient]) => {
      return isClient ? fetchRelations(accountId, instanceAccountIds) : [];
    }
  );

  onMount(() => setClient(true));

  const tabs: Array<{ key: getTopPeopleOrderKeys; title: string }> = [
    { key: "reach", title: "Most reach" },
    { key: "interactions", title: "Most interactions" },
    { key: "mentions", title: "Most mentions" },
    { key: "favorites", title: "Most favorites" },
    { key: "boosts", title: "Top boosters" },
  ];

  const setOrder = (order: getTopPeopleOrderKeys) => params().order != order && setParams({ ...params(), order });

  return (
    <div>
      <div class="mb-0 mt-8 flex items-center gap-4 px-4 sm:mt-12 sm:px-0">
        <Tabbar
          class="flex-auto"
          tabs={tabs}
          active={params().order}
          onChange={({ key }) => setOrder(key as getTopPeopleOrderKeys)}
        />
      </div>
      <Switch fallback={<>Loading</>}>
        <Match when={people.error}>
          <Box title="Something went wrong" isError>
            {people.error.message}
          </Box>
        </Match>
        <Match when={people.latest?.length == 0}>
          <Box title="No data to display">
            <p class="max-w-prose">
              We don't have any data gathered for your account yet. Either we still have to fetch it (check back later),
              or you don't have any interactions yet. If you think this is an error, please let us know.
            </p>
            <UIButton onClick={() => startSupport(props.account, "No data on my people page")} class="mt-4">
              <Icons.At class="mr-2" /> Support
            </UIButton>
          </Box>
        </Match>
        <Match when={people.latest}>
          <Wrapper loading={people.loading}>
            <For each={people.latest}>{(person) => <Person person={person} relations={relations} />}</For>
          </Wrapper>
        </Match>
      </Switch>
    </div>
  );
};

const Person: Component<{ person: PersonStats; relations?: Resource<MastodonRelationship[]> }> = (props) => {
  return (
    <li>
      <div class="group flex flex-wrap items-center gap-4 overflow-hidden px-4 py-4 hover:bg-mastodon-purple-100/30 dark:hover:bg-mastodon-purple-800/20 sm:flex-nowrap sm:px-6">
        <div class="flex min-w-0 flex-auto items-center">
          <AccountLink
            username={props.person.username}
            class="relative mr-5 h-12 w-12 flex-none rounded-lg bg-mastodon-purple-100/50 dark:bg-mastodon-purple-800/50"
          >
            {props.person.avatar && (
              <img
                src={props.person.avatar}
                alt={props.person.displayName}
                class="h-full w-full rounded-lg object-cover"
              />
            )}
          </AccountLink>
          <div class="min-w-0 flex-auto">
            <AccountLink username={props.person.username} class="font-medium">
              {props.person.displayName
                ? renderTextWithoutEmojiCode(props.person.displayName ?? "")
                : props.person.username}
            </AccountLink>
            <Suspense>
              {props.relations && (
                <FollowStatus relationships={props.relations} instanceAccountId={props.person.instanceAccountId} />
              )}
            </Suspense>
            {props.person.displayName && (
              <AccountLink username={props.person.username} class="truncate opacity-60">
                {props.person.username}
              </AccountLink>
            )}
          </div>
        </div>
        <div class="flex shrink-0 basis-full  gap-4 sm:basis-1/2">
          <Count
            count={props.person.interactions}
            icon={Icons.Activity}
            label="Total times this person has interacted with your posts"
          />
          <Count count={props.person.boosts} icon={Icons.Reblog} label="Total times this person boosted your posts" />
          <Count
            count={props.person.favorites}
            icon={Icons.Star}
            label="Total times this person favorited your posts"
          />
          <Count
            count={props.person.mentions}
            icon={Icons.At}
            label="Total times this person mentioned you, excludes private messages"
          />
          <Count
            count={props.person.reach}
            icon={Icons.Affiliate}
            label="Total reach, every time this person boosts or gives a shoutout their followers are counted"
          />
        </div>
      </div>
    </li>
  );
};

const Wrapper: ParentComponent<{ loading?: boolean }> = (props) => {
  return (
    <div class="mt-6 overflow-hidden bg-white shadow dark:bg-mastodon-purple-800/30 dark:shadow-none dark:outline dark:outline-mastodon-purple-800/70 sm:rounded-md">
      <ul
        role="list"
        class={cls(
          "divide-y divide-mastodon-purple-100 dark:divide-mastodon-purple-800",
          props.loading && "opacity-60"
        )}
      >
        {props.children}
      </ul>
    </div>
  );
};

const FollowStatus: Component<{ relationships: Resource<MastodonRelationship[]>; instanceAccountId: string }> = (
  props
) => {
  tooltip;
  const rel = () => props.relationships.latest?.find((r) => r.id === props.instanceAccountId);
  return (
    <div class="mx-2 inline-block text-xs font-semibold uppercase ">
      <Switch fallback={<span class="rounded bg-gray-400/10 py-1 px-2 text-gray-500">Loading</span>}>
        <Match when={props.relationships.error}>
          <span
            class="rounded bg-red-400/10 py-1 px-2 text-red-500"
            use:tooltip={`Could not retrieve your following status at this time (${props.relationships.error.message})`}
          >
            <Icons.AlertTriangleFilled class="mr-2 inline-block" /> Error
          </span>
        </Match>
        <Match when={rel()?.following && rel()?.followed_by}>
          <span
            class="rounded bg-green-400/10 py-1 px-2 text-green-500"
            use:tooltip="You are both following each other"
          >
            Mutuals
          </span>
        </Match>
        <Match when={rel()?.following}>
          <span
            class="rounded bg-orange-400/10 py-1 px-2 text-orange-500"
            use:tooltip="You are following this person, but they don't follow you"
          >
            Following
          </span>
        </Match>
        <Match when={rel()?.following === false && rel()?.followed_by}>
          <span
            class="rounded bg-yellow-400/10 py-1 px-2 text-yellow-500"
            use:tooltip="This person is following you, but you don't follow them"
          >
            Follows you
          </span>
        </Match>
        <Match when={rel()?.following === false}>
          <span
            class="rounded bg-mastodon-purple-400/10 py-1 px-2 text-mastodon-purple-500 dark:text-mastodon-purple-300"
            use:tooltip="This person is not following you, and you don't follow them"
          >
            Not following
          </span>
        </Match>
      </Switch>
    </div>
  );
};

const Count: Component<{ count: number | null; icon: Icon; label?: string }> = (props) => {
  return (
    <p
      class={cls(
        "inline-flex grow-0 basis-1/6 items-center text-mastodon-purple-900/70 last:basis-1/3 dark:text-white/90 sm:justify-end",
        !props.count && "opacity-30"
      )}
    >
      <span use:tooltip={props.label} class="mr-2 inline-block">
        <Dynamic
          component={props.icon}
          class="w-4 text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400 "
        />
      </span>
      {formatNumber(props.count)}
    </p>
  );
};

function renderTextWithoutEmojiCode(text: string) {
  return text.replace(/:[^:]+:/g, "");
}
