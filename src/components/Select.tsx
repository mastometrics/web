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
        <label for={id} class={cls("block text-sm font-medium text-gray-700 mb-1", props.hideLabel && "sr-only")}>
          {props.label}
        </label>
      )}
      <select
        id={id}
        class="block pl-3 pr-10 py-2 text-base border-2 border-mastodon-purple-200/50 text-mastodon-purple-600 bg-mastodon-purple-100 focus:outline-none  focus:border-mastodon-purple-500 sm:text-sm rounded-md "
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
