import { Status } from "@prisma/client";
import { ParentComponent, Component, For, Show } from "solid-js";
import { Dynamic, NoHydration } from "solid-js/web";
import { cls } from "~/lib/css";
import { simpleMastodonSanitzer } from "~/lib/mastodon/utils";
import { Icons, Icon } from "./Icon";
import { ShowDelayed, TinyLoadingIndicator } from "./LoadingIndicator";
import { MastodonStatus } from "~/lib/mastodon/types";

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

const StatusContent: Component<{ status: Status }> = ({ status }) => {
  const statusData = () => status.raw as unknown as MastodonStatus;
  const content = simpleMastodonSanitzer(statusData().content, undefined, {
    a: ["text-mastodon-purple-600", "dark:text-mastodon-purple-300", "hover:underline"],
    p: ["text-gray-700", "dark:text-mastodon-purple-100", "my-2"],
  });

  return (
    <div>
      <NoHydration>
        <p class="text-mastodon-purple-600 dark:text-white/90" innerHTML={content} />
      </NoHydration>
      <StatusMedia status={statusData()} />
    </div>
  );
};

const StatusMedia: Component<{ status: MastodonStatus }> = (props) => {
  return (
    <Show when={props.status.media_attachments?.filter((x) => x.type == "image")}>
      {(images) => (
        <div class="my-4 grid auto-rows-max grid-cols-2 gap-2">
          <For each={images()}>
            {(image) => (
              <a
                href={image.url}
                target="_blank"
                rel="noopener"
                class={cls("block", images().length == 1 && "col-span-2")}
              >
                <img
                  class={cls(
                    "max-h-[300px] rounded-md object-cover",
                    images().length == 1 ? "w-auto" : "h-full w-full"
                  )}
                  src={image.preview_url}
                  alt={image.description}
                />
              </a>
            )}
          </For>
        </div>
      )}
    </Show>
  );
};

const StatusItem: Component<{ status: Status }> = (props) => {
  const avatar = (props.status.raw as any).account.avatar_static;
  return (
    <li>
      <div class="group flex flex-wrap gap-4 px-4 py-4 hover:bg-mastodon-purple-100/30 dark:hover:bg-mastodon-purple-800/20 sm:flex-nowrap sm:px-6">
        <div class="flex sm:basis-2/3">
          <img class="mr-4 mt-3 h-8 w-8 flex-none rounded-sm object-cover" src={avatar} />
          <div>
            <StatusContent status={props.status} />
            <a
              href={props.status.url!}
              class="text-sm text-mastodon-purple-900/70 hover:text-mastodon-purple-900 dark:text-mastodon-purple-300 dark:hover:text-mastodon-purple-100"
              target="_blank"
              rel="noopener"
            >
              {(typeof props.status.publishedAt == "string"
                ? new Date(props.status.publishedAt)
                : props.status.publishedAt
              ).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </a>
          </div>
        </div>

        <div class="ml-12 mt-2 flex h-7 basis-full gap-4 pr-4 text-sm sm:ml-0 sm:basis-1/3">
          <EngagementLink
            count={props.status.favoritesCount}
            href={`${props.status.url!}/favourites`}
            icon={Icons.Star}
          />
          <EngagementLink count={props.status.boostsCount} href={`${props.status.url!}/reblogs`} icon={Icons.Reblog} />
          <EngagementLink count={props.status.repliesCount} href={props.status.url!} icon={Icons.Reply} />
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
