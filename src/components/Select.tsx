import { Component, createEffect, createMemo, createSignal, createUniqueId, For } from "solid-js";
import { cls } from "~/lib/css";

type SelectOption = string | { value: string; label: string };
export const Select: Component<{
  options: SelectOption[];
  label?: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
}> = (props) => {
  const id = createUniqueId();
  const options = createMemo(() =>
    props.options.map((option) => (typeof option === "string" ? { label: option, value: option } : option))
  );
  const [value, setValue] = createSignal(props.value);
  createEffect(() => props.onChange(value()));

  return (
    <>
      {props.label && (
        <label for={id} class={cls("mb-1 block text-sm font-medium text-gray-700", props.hideLabel && "sr-only")}>
          {props.label}
        </label>
      )}
      <select
        id={id}
        class="block rounded-md border-2 border-mastodon-purple-200/50 bg-mastodon-purple-100 py-2 pl-3 pr-10 text-base text-mastodon-purple-600  focus:border-mastodon-purple-500 focus:outline-none dark:border-mastodon-purple-700  dark:bg-mastodon-purple-800 dark:text-mastodon-purple-100 sm:text-sm"
        value={value()}
        onChange={(e) => setValue(e.currentTarget.value)}
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
