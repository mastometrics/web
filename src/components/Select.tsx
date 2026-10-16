import { type Component, createEffect, createMemo, createSignal, createUniqueId, For, on } from "solid-js";
import { cls } from "~/lib/css";

type SelectOption = string | { value: string; label: string };
export const Select: Component<{
  options: SelectOption[];
  label?: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  class?: string;
}> = (props) => {
  const id = createUniqueId();
  const options = createMemo(() =>
    props.options.map((option) => (typeof option === "string" ? { label: option, value: option } : option))
  );
  const [value, setValue] = createSignal(props.value);
  createEffect(on(value, (v) => props.onChange(v), { defer: true }));
  createEffect(() => setValue(props.value));

  return (
    <>
      {props.label && (
        <label for={id} class={cls("mb-1 block text-sm font-medium text-gray-700", props.hideLabel && "sr-only")}>
          {props.label}
        </label>
      )}
      <select
        id={id}
        class={cls(
          "border-mastodon-purple-200/50 bg-mastodon-purple-100 text-mastodon-purple-600 focus:border-mastodon-purple-500 dark:border-mastodon-purple-700 dark:bg-mastodon-purple-800 dark:text-mastodon-purple-100 block rounded-md border-2 py-2 pr-10 pl-3 text-base focus:outline-hidden disabled:opacity-25 sm:text-sm",
          props.class
        )}
        value={value()}
        onChange={(e) => setValue(e.currentTarget.value)}
        disabled={props.disabled}
      >
        <For each={options()}>
          {(option) => (
            <option selected={value() == option.value} value={option.value}>
              {option.label}
            </option>
          )}
        </For>
      </select>
    </>
  );
};
