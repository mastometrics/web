import { Status } from "@prisma/client";
import { stat } from "fs";
import { type } from "os";
import { ParentComponent, Suspense, Component } from "solid-js";
import { Dynamic, NoHydration } from "solid-js/web";
import { cls } from "~/lib/css";
import { simpleMastodonSanitzer } from "~/lib/mastodon/utils";
import { StarIcon, ReblogIcon, ReplyIcon, Icons, Icon } from "./Icon";
import { TinyLoadingIndicator } from "./LoadingIndicator";

const Wrapper: ParentComponent = (props) => {
  return (
    <Suspense>
      <div class="bg-white shadow overflow-hidden sm:rounded-md mt-6">
        <ul role="list" class="divide-y divide-mastodon-purple-100">
          {props.children}
        </ul>
      </div>
    </Suspense>
  );
};

const StatusContent: Component<{ status: Status }> = ({ status }) => {
  const content = simpleMastodonSanitzer((status.raw as any).content);
  return (
    <NoHydration>
      <p class="text-gray-600" innerHTML={content} />
    </NoHydration>
  );
};

const StatusItem: Component<{ status: Status }> = ({ status }) => {
  const avatar = (status.raw as any).account.avatar_static;
  return (
    <li>
      <div class="px-4 py-4 sm:px-6 flex flex-wrap sm:flex-nowrap hover:bg-mastodon-purple-100/30 gap-4 group">
        <div class="sm:basis-2/3 flex">
          <img class="h-8 w-8 rounded-sm mr-4 mt-3 object-cover flex-none" src={avatar} />
          <div>
            <StatusContent status={status} />
            <a
              href={status.url!}
              class="text-mastodon-purple-900/70 text-sm hover:text-mastodon-purple-900"
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

        <div class="flex basis-full sm:basis-1/3 gap-4 pr-4 mt-2 text-sm h-7 ml-12 sm:ml-0">
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
        "inline-flex basis-1/3 grow-0 items-center text-mastodon-purple-900/70 sm:justify-end",
        !props.count && "opacity-30"
      )}
    >
      <Dynamic
        component={props.icon}
        class="w-4 mr-2 text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600  inline-block  "
      />{" "}
      {props.count}
    </a>
  );
};

const LoadMoreButton: Component<{ action: () => void; loading?: boolean }> = (props) => {
  return (
    <button
      class="px-4 py-4 sm:px-6 w-full flex  items-center justify-center text-mastodon-purple-600 bg-mastodon-purple-100 hover:bg-mastodon-purple-200/50 gap-4 "
      onClick={props.action}
    >
      {props.loading ? (
        <>
          <TinyLoadingIndicator /> Loading
        </>
      ) : (
        "Load more"
      )}
    </button>
  );
};

export const StatusList = {
  Wrapper: Wrapper,
  Item: StatusItem,
  LoadMoreButton: LoadMoreButton,
};
