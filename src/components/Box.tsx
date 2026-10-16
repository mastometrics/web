import type { JSX, ParentComponent } from "solid-js";
import { cls } from "~/lib/css";

export const Box: ParentComponent<{
  class?: string;
  title?: string | JSX.Element;
  isSecondary?: boolean;
  isError?: boolean;
}> = (props) => {
  return (
    <div
      class={cls(
        "text-mastodon-purple-800 my-8 rounded-lg bg-white px-5 py-6 shadow-sm sm:rounded-md sm:px-6",
        "dark:bg-mastodon-purple-800/40 dark:outline-mastodon-purple-800/70 dark:text-white dark:shadow-none dark:outline",
        props.isSecondary && "bg-mastodon-purple-100 dark:bg-mastodon-purple-800/60 shadow-none",
        props.isError &&
          "bg-red-100/50 text-red-900 shadow-none outline outline-red-500/30 dark:bg-red-900/20 dark:text-white dark:outline-red-500/30",
        props.class
      )}
      role={props.isError ? "alert" : undefined}
    >
      {props.title && (
        <h3
          class={cls(
            "text-mastodon-purple-600 dark:text-mastodon-purple-400 mb-4 text-xl font-semibold",
            props.isSecondary && "dark:text-mastodon-purple-400",
            props.isError && "!text-red-600 dark:text-red-400"
          )}
        >
          {props.title}
        </h3>
      )}
      {props.children}
    </div>
  );
};
