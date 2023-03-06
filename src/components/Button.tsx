import { Component, JSX, splitProps } from "solid-js";
import { cls } from "~/lib/css";

export const UIButton: Component<
  JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    label?: string;
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["children", "label", "class"]);

  return (
    <button
      class={cls(
        "relative inline-flex items-center rounded-md border border-mastodon-purple-900/20 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm",
        "hover:bg-gray-50 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-mastodon-purple-200 active:outline-0",
        "dark:border-mastodon-purple-600 dark:bg-mastodon-purple-800 dark:text-white",
        "dark:hover:bg-mastodon-purple-700 dark:focus:ring-mastodon-purple-500 dark:active:bg-mastodon-purple-500 dark:disabled:opacity-50",
        local.class
      )}
      {...rest}
    >
      {local.label && <span>{local.label}</span>}
      {props.children}
    </button>
  );
};
