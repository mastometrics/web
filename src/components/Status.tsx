import { type Component, For, type ParentComponent, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { StatusView } from "~/backend/statuses";
import { cls } from "~/lib/css";
import { type Icon, Icons } from "./Icon";
import { ShowDelayed, TinyLoadingIndicator } from "./LoadingIndicator";

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

const StatusContent: Component<{ status: StatusView }> = (props) => {
  return (
    <div>
      {/* html is sanitized on the server, see toStatusView */}
      <div class="text-mastodon-purple-600 dark:text-white/90" innerHTML={props.status.html} />
      <StatusMedia images={props.status.images} />
    </div>
  );
};

const StatusMedia: Component<{ images: StatusView["images"] }> = (props) => {
  return (
    <Show when={props.images.length}>
      <div class="my-4 grid auto-rows-max grid-cols-2 gap-2">
        <For each={props.images}>
          {(image) => (
            <a
              href={image.url}
              target="_blank"
              rel="noopener"
              class={cls("block", props.images.length == 1 && "col-span-2")}
            >
              <img
                class={cls(
                  "max-h-[300px] rounded-md object-cover",
                  props.images.length == 1 ? "w-auto" : "h-full w-full"
                )}
                src={image.previewUrl}
                alt={image.description}
              />
            </a>
          )}
        </For>
      </div>
    </Show>
  );
};

const StatusItem: Component<{ status: StatusView }> = (props) => {
  return (
    <li>
      <div class="group hover:bg-mastodon-purple-100/30 dark:hover:bg-mastodon-purple-800/20 flex flex-wrap gap-4 px-4 py-4 sm:flex-nowrap sm:px-6">
        <div class="flex sm:basis-2/3">
          <img class="mt-3 mr-4 h-8 w-8 flex-none rounded-xs object-cover" src={props.status.avatar} alt="" />
          <div>
            <StatusContent status={props.status} />
            <a
              href={props.status.url!}
              class="text-mastodon-purple-900/70 hover:text-mastodon-purple-900 dark:text-mastodon-purple-300 dark:hover:text-mastodon-purple-100 text-sm"
              target="_blank"
              rel="noopener"
            >
              {new Date(props.status.publishedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </a>
          </div>
        </div>

        <div class="mt-2 ml-12 flex h-7 basis-full gap-4 pr-4 text-sm sm:ml-0 sm:basis-1/3">
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
        "text-mastodon-purple-900/70 inline-flex grow-0 basis-1/3 items-center sm:justify-end dark:text-white/70",
        !props.count && "opacity-30"
      )}
    >
      <Dynamic
        component={props.icon}
        class="text-mastodon-purple-900/30 group-hover:text-mastodon-purple-600 dark:text-mastodon-purple-300 dark:group-hover:text-mastodon-purple-400 mr-2 inline-block w-4"
      />{" "}
      {props.count}
    </a>
  );
};

const LoadMoreButton: Component<{ action: () => void; loading?: boolean }> = (props) => {
  return (
    <button
      class="bg-mastodon-purple-100 text-mastodon-purple-600 hover:bg-mastodon-purple-200/50 dark:bg-mastodon-purple-800/30 dark:text-mastodon-purple-200 dark:hover:bg-mastodon-purple-800/40 flex h-20 w-full items-center justify-center gap-4 px-4 py-4 sm:px-6"
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
