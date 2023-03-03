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
        "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm",
        "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25",
        local.class
      )}
      {...rest}
    >
      {local.label && <span>{local.label}</span>}
      {props.children}
    </button>
  );
};
