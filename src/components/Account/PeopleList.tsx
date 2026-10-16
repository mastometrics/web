import { actions } from "astro:actions";
import {
  type Component,
  createResource,
  createSignal,
  For,
  Match,
  onMount,
  type ParentComponent,
  type Resource,
  Suspense,
  Switch,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import type { getTopPeopleOrderKeys, getTopPeopleParams, PersonStats } from "~/backend/people";
import { cls } from "~/lib/css";
import { formatNumber } from "~/lib/format";
import type { MastodonRelationship } from "~/lib/mastodon/types";
import { withInitialData } from "~/lib/resource";
import { startSupport } from "~/lib/support";
import { AccountLink } from "../Account/AccountHoverCard";
import { Box } from "../Box";
import { UIButton } from "../Button";
import { type Icon, Icons } from "../Icon";
import { Tabbar } from "../Tabbar";
import { tooltip } from "../Tooltip";

// Keep the directive import from being tree-shaken
tooltip;

export type PeopleAccount = { id: number; instance: string };

export const PeopleList: Component<{ account: PeopleAccount; initial?: PersonStats[] }> = (props) => {
  const [client, setClient] = createSignal(false);
  const [params, setParams] = createSignal<Required<getTopPeopleParams>>({ order: "reach" });
  const [people] = createResource(
    () => ({ accountId: props.account.id, order: params().order }),
    withInitialData(props.initial, (params: { accountId: number; order: getTopPeopleOrderKeys }) =>
      actions.topPeople.orThrow(params)
    )
  );

  // Relationships are fetched from the instance of the user, only on the client to not delay rendering
  const [relations] = createResource(
    () => [props.account.id, people.latest?.map((p) => p.instanceAccountId) ?? [], client()] as const,
    ([accountId, ids, isClient]) => (isClient && ids.length ? actions.relationships.orThrow({ accountId, ids }) : [])
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
      <div class="mt-8 mb-0 flex items-center gap-4 px-4 sm:mt-12 sm:px-0">
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
            {people.error?.message}
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
      <div class="group hover:bg-mastodon-purple-100/30 dark:hover:bg-mastodon-purple-800/20 flex flex-wrap items-center gap-4 overflow-hidden px-4 py-4 sm:flex-nowrap sm:px-6">
        <div class="flex min-w-0 flex-auto items-center">
          <AccountLink
            username={props.person.username}
            class="bg-mastodon-purple-100/50 dark:bg-mastodon-purple-800/50 relative mr-5 h-12 w-12 flex-none rounded-lg"
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
        <div class="flex shrink-0 basis-full gap-4 sm:basis-1/2">
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
    <div class="dark:bg-mastodon-purple-800/30 dark:outline-mastodon-purple-800/70 mt-6 overflow-hidden bg-white shadow-sm sm:rounded-md dark:shadow-none dark:outline">
      <ul
        role="list"
        class={cls(
          "divide-mastodon-purple-100 dark:divide-mastodon-purple-800 divide-y",
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
  const rel = () => props.relationships.latest?.find((r) => r.id === props.instanceAccountId);
  return (
    <div class="mx-2 inline-block text-xs font-semibold uppercase">
      <Switch fallback={<span class="rounded-sm bg-gray-400/10 px-2 py-1 text-gray-500">Loading</span>}>
        <Match when={props.relationships.error}>
          <span
            class="rounded-sm bg-red-400/10 px-2 py-1 text-red-500"
            use:tooltip={`Could not retrieve your following status at this time (${props.relationships.error?.message})`}
          >
            <Icons.AlertTriangleFilled class="mr-2 inline-block" /> Error
          </span>
        </Match>
        <Match when={rel()?.following && rel()?.followed_by}>
          <span
            class="rounded-sm bg-green-400/10 px-2 py-1 text-green-500"
            use:tooltip="You are both following each other"
          >
            Mutuals
          </span>
        </Match>
        <Match when={rel()?.following}>
          <span
            class="rounded-sm bg-orange-400/10 px-2 py-1 text-orange-500"
            use:tooltip="You are following this person, but they don't follow you"
          >
            Following
          </span>
        </Match>
        <Match when={rel()?.following === false && rel()?.followed_by}>
          <span
            class="rounded-sm bg-yellow-400/10 px-2 py-1 text-yellow-500"
            use:tooltip="This person is following you, but you don't follow them"
          >
            Follows you
          </span>
        </Match>
        <Match when={rel()?.following === false}>
          <span
            class="bg-mastodon-purple-400/10 text-mastodon-purple-500 dark:text-mastodon-purple-300 rounded-sm px-2 py-1"
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
        "text-mastodon-purple-900/70 inline-flex grow-0 basis-1/6 items-center last:basis-1/3 sm:justify-end dark:text-white/90",
        !props.count && "opacity-30"
      )}
    >
      <span use:tooltip={props.label} class="mr-2 inline-block">
        <Dynamic
          component={props.icon}
          class="text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400 w-4"
        />
      </span>
      {formatNumber(props.count)}
    </p>
  );
};

function renderTextWithoutEmojiCode(text: string) {
  return text.replace(/:[^:]+:/g, "");
}
