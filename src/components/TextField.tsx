import { type Component, createEffect, createSignal, on } from "solid-js";
import { TextField as KBTextField } from "@kobalte/core/text-field";
import { type Icon, Icons } from "./Icon";
import { cls } from "~/lib/css";
import { debounce } from "~/lib/utils";

export const TextField: Component<{
  value?: string;
  label: string;
  debounce?: number;
  onChange: (value: string) => void;
  icon?: Icon;
  class?: string;
}> = (props) => {
  const [value, setValue] = createSignal(props.value ?? "");
  const onChange = props.debounce ? debounce(props.onChange, props.debounce) : props.onChange;

  createEffect(on(value, (v) => onChange(v), { defer: true }));

  return (
    <KBTextField
      value={value()}
      onChange={setValue}
      class={cls(
        "bg-mastodon-purple-50 text-mastodon-purple-900 focus-within:border-mastodon-purple-500 dark:border-mastodon-purple-600 dark:bg-mastodon-purple-800 dark:text-mastodon-purple-100 dark:focus-within:border-mastodon-purple-400 relative my-2 flex h-10 w-full min-w-[28ch] items-center rounded-md border border-black/20 p-2 text-base focus-within:outline-hidden disabled:opacity-25 sm:text-sm",
        props.class
      )}
    >
      {props.icon && <Icons.Search class="text-mastodon-purple-500" />}
      <KBTextField.Label class="sr-only">{props.label}</KBTextField.Label>
      <KBTextField.Input
        class={cls(
          "form-input placeholder:text-mastodon-purple-800/20 absolute inset-0 h-full w-full border-none bg-transparent p-2 outline-hidden focus:ring-0 focus:outline-hidden dark:placeholder:text-white/30",
          props.icon && "pl-8"
        )}
        placeholder={props.label}
      />
    </KBTextField>
  );
};
