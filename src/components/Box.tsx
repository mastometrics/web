import { JSX, ParentComponent } from "solid-js";
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
        "my-8 rounded-lg bg-white px-5 py-6 text-mastodon-purple-800 shadow sm:rounded-md sm:px-6 ",
        "dark:bg-mastodon-purple-800/40 dark:text-white dark:shadow-none dark:outline dark:outline-mastodon-purple-800/70 ",
        props.isSecondary && "bg-mastodon-purple-100 shadow-none dark:bg-mastodon-purple-800/60",
        props.isError &&
          "bg-red-100/50 shadow-none outline outline-red-500/30 dark:bg-red-900/20 dark:outline-red-500/30",
        props.class
      )}
      role={props.isError ? "alert" : undefined}
    >
      {props.title && (
        <h3
          class={cls(
            "text-xl font-semibold text-mastodon-purple-600 dark:text-mastodon-purple-400",
            props.isSecondary && " dark:text-mastodon-purple-400",
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
