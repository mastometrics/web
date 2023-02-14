import { Status } from "@prisma/client";
import { type } from "os";
import { ParentComponent, Suspense, Component } from "solid-js";
import { NoHydration } from "solid-js/web";
import { cls } from "~/lib/css";
import { simpleMastodonSanitzer } from "~/lib/mastodon/utils";
import { StarIcon, ReblogIcon, ReplyIcon, Icons } from "./Icon";

const StatusListWrapper: ParentComponent = (props) => {
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
      <div class="px-4 py-4 sm:px-6 flex hover:bg-mastodon-purple-100/30 gap-4 group">
        <div class="basis-2/3 flex">
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

        <div class="flex basis-1/3 gap-4 pr-4 mt-2 text-sm">
          <a
            href={`${status.url!}/favourites`}
            target="_blank"
            rel="noopener"
            class={cls(
              "flex basis-1/3 grow-0 items-center text-slate-600 justify-end",
              !status.favoritesCount && "opacity-30"
            )}
          >
            <Icons.Star class="w-4  mr-2 text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600 inline-block  " />{" "}
            {status.favoritesCount}
          </a>

          <a
            href={`${status.url!}/reblogs`}
            target="_blank"
            rel="noopener"
            class={cls(
              "flex basis-1/3 grow-0 items-center text-slate-600 justify-end",
              !status.boostsCount && "opacity-30"
            )}
          >
            <ReblogIcon class="w-4 mr-2 text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600  inline-block  " />{" "}
            {status.boostsCount}
          </a>

          <a
            href={status.url!}
            target="_blank"
            rel="noopener"
            class={cls(
              "flex basis-1/3 grow-0 items-center text-slate-600 justify-end",
              !status.repliesCount && "opacity-30"
            )}
          >
            <ReplyIcon class="w-4 mr-2 text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600  inline-block  " />{" "}
            {status.repliesCount}
          </a>
        </div>
      </div>
    </li>
  );
};

const StatusListLoadMoreButton: Component<{ action: () => void }> = (props) => {
  return (
    <button class="px-4 py-4 sm:px-6 flex hover:bg-gray-50 gap-4 " onClick={props.action}>
      Load more
    </button>
  );
};

export const StatusList = {
  Wrapper: StatusListWrapper,
  Item: StatusItem,
  LoadMoreButton: StatusListLoadMoreButton,
};
