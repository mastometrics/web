import { Status } from "@prisma/client";
import { stat } from "fs";
import { type } from "os";
import { ParentComponent, Suspense, Component, createSignal } from "solid-js";
import { Dynamic, NoHydration } from "solid-js/web";
import { cls } from "~/lib/css";
import { simpleMastodonSanitzer } from "~/lib/mastodon/utils";
import { StarIcon, ReblogIcon, ReplyIcon, Icons, Icon } from "./Icon";
import { ShowDelayed, TinyLoadingIndicator } from "./LoadingIndicator";

const Wrapper: ParentComponent = (props) => {
  return (
    <Suspense>
      <div class="mt-6 overflow-hidden bg-white shadow dark:bg-mastodon-purple-800/30 dark:shadow-none dark:outline dark:outline-mastodon-purple-800/70 sm:rounded-md">
        <ul role="list" class="divide-y divide-mastodon-purple-100  dark:divide-mastodon-purple-800">
          {props.children}
        </ul>
      </div>
    </Suspense>
  );
};

const StatusContent: Component<{ status: Status }> = ({ status }) => {
  const content = simpleMastodonSanitzer((status.raw as any).content, undefined, {
    a: ["text-mastodon-purple-600", "dark:text-mastodon-purple-300", "hover:underline"],
    p: ["text-gray-700", "dark:text-mastodon-purple-100", "my-2"],
  });
  return (
    <NoHydration>
      <p class="text-mastodon-purple-600 dark:text-white/90" innerHTML={content} />
    </NoHydration>
  );
};

const StatusItem: Component<{ status: Status }> = ({ status }) => {
  const avatar = (status.raw as any).account.avatar_static;
  return (
    <li>
      <div class="group flex flex-wrap gap-4 px-4 py-4 hover:bg-mastodon-purple-100/30 dark:hover:bg-mastodon-purple-800/20 sm:flex-nowrap sm:px-6">
        <div class="flex sm:basis-2/3">
          <img class="mr-4 mt-3 h-8 w-8 flex-none rounded-sm object-cover" src={avatar} />
          <div>
            <StatusContent status={status} />
            <a
              href={status.url!}
              class="text-sm text-mastodon-purple-900/70 hover:text-mastodon-purple-900 dark:text-mastodon-purple-300 dark:hover:text-mastodon-purple-100"
              target="_blank"
              rel="noopener"
            >
              {(typeof status.publishedAt == "string"
                ? new Date(status.publishedAt)
                : status.publishedAt
              ).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </a>
          </div>
        </div>

        <div class="mt-2 ml-12 flex h-7 basis-full gap-4 pr-4 text-sm sm:ml-0 sm:basis-1/3">
          <EngagementLink count={status.favoritesCount} href={`${status.url!}/favourites`} icon={StarIcon} />
          <EngagementLink count={status.boostsCount} href={`${status.url!}/reblogs`} icon={ReblogIcon} />
          <EngagementLink count={status.repliesCount} href={status.url!} icon={ReplyIcon} />
        </div>
      </div>
    </li>
  );
};

const EngagementLink: Component<{ count: number | null; href: string; icon: Icon }> = (props) => {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener"
      class={cls(
        "inline-flex grow-0 basis-1/3 items-center text-mastodon-purple-900/70 dark:text-white/70 sm:justify-end",
        !props.count && "opacity-30"
      )}
    >
      <Dynamic
        component={props.icon}
        class="mr-2 inline-block w-4 text-mastodon-purple-900/30  group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400 "
      />{" "}
      {props.count}
    </a>
  );
};

const LoadMoreButton: Component<{ action: () => void; loading?: boolean }> = (props) => {
  return (
    <button
      class="flex h-20 w-full items-center justify-center gap-4 bg-mastodon-purple-100 px-4 py-4 text-mastodon-purple-600 hover:bg-mastodon-purple-200/50 dark:bg-mastodon-purple-800/30 dark:text-mastodon-purple-200 dark:hover:bg-mastodon-purple-800/40 sm:px-6 "
      onClick={props.action}
    >
      <ShowDelayed when={props.loading!} fallback={"Load more"}>
        <TinyLoadingIndicator />
      </ShowDelayed>
    </button>
  );
};

export const StatusList = {
  Wrapper: Wrapper,
  Item: StatusItem,
  LoadMoreButton: LoadMoreButton,
};
