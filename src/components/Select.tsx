import { Component, createEffect, createMemo, createSignal, createUniqueId, For } from "solid-js";

type SelectOption = string | { value: string; label: string };
export const Select: Component<{
  options: SelectOption[];
  label?: string;
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
        <label for={id} class="block text-sm font-medium text-gray-700">
          {props.label}
        </label>
      )}
      <select
        id={id}
        class="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
