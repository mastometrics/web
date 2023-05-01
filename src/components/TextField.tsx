import { Component, createEffect, createSignal } from "solid-js";
import { TextField as KBTextField } from "@kobalte/core";
import { Icon, Icons } from "./Icon";
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

  createEffect(() => onChange(value()));

  return (
    <KBTextField.Root
      value={value()}
      onValueChange={setValue}
      class={cls(
        "relative my-2 flex h-10 w-full min-w-[28ch] items-center rounded-md border border-black/20  bg-mastodon-purple-50 p-2 text-base text-mastodon-purple-900 focus-within:border-mastodon-purple-500 focus-within:outline-none disabled:opacity-25  dark:border-mastodon-purple-600   dark:bg-mastodon-purple-800 dark:text-mastodon-purple-100 dark:focus-within:border-mastodon-purple-400 sm:text-sm",
        props.class
      )}
    >
      {props.icon && <Icons.Search class="text-mastodon-purple-500" />}
      <KBTextField.Label class="sr-only">{props.label}</KBTextField.Label>
      <KBTextField.Input
        class={cls(
          "form-input absolute inset-0 h-full w-full border-none bg-transparent p-2 outline-none  placeholder:text-mastodon-purple-800/20 focus:outline-none focus:ring-0 dark:placeholder:text-white/30",
          props.icon && "pl-8"
        )}
        placeholder={props.label}
      />
    </KBTextField.Root>
  );
};
