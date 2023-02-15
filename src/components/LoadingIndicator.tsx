import { createEffect, createSignal, JSX, Match, onCleanup, ParentComponent, Show, Switch } from "solid-js";

export const TinyLoadingIndicator = () => (
  <div class="translate-y-.5 inline-flex" aria-hidden>
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
