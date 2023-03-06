import { Component, createEffect, createSignal, JSX, Match, onCleanup, ParentComponent, Show, Switch } from "solid-js";
import { cls } from "~/lib/css";

export const TinyLoadingIndicator: Component<{ class?: string }> = (props) => (
  <div class={cls("translate-y-.5 inline-flex", props.class)} aria-hidden>
    <span class="animate-bounce text-lg">•</span>
    <span class="animate-bounce text-lg delay-75">•</span>
    <span class="animate-bounce text-lg delay-200">•</span>
  </div>
);

export const ShowDelayed: ParentComponent<{ when: boolean; delay?: number; fallback?: JSX.Element }> = (props) => {
  let timeout: globalThis.NodeJS.Timeout;
  const [show, setShow] = createSignal(false);
  createEffect(() => {
    clearTimeout(timeout);
    if (props.when) timeout = setTimeout(() => setShow(true), props.delay ?? 100);
    else setShow(false);
  });

  onCleanup(() => clearTimeout(timeout));

  return <Show when={show()} fallback={props.fallback} children={props.children} />;
};
