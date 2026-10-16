import { computePosition, flip, shift } from "@floating-ui/dom";
import { onCleanup, onMount } from "solid-js";

function listen<T extends EventTarget>(target: T, event: string, fn: () => void, opts?: AddEventListenerOptions) {
  target.addEventListener(event, fn, opts);
  return () => target.removeEventListener(event, fn, opts);
}

/** `use:tooltip="text"` directive, shows a tooltip on hover */
export function tooltip<T extends Element>(target: T, opts: () => string | undefined) {
  let el: HTMLElement | undefined;
  let cleanups: (() => void)[] = [];
  const delay = 50;

  function hide() {
    el?.remove();
    el = undefined;
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
  }

  function show() {
    const content = opts();
    if (!content) return;
    hide();
    el = document.createElement("div");
    el.className =
      "z-30 max-w-sm rounded-xs bg-mastodon-purple-900 px-3 py-2 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 dark:bg-mastodon-purple-800 sm:w-auto";
    el.innerText = content;
    Object.assign(el.style, { position: "absolute" });
    document.body.appendChild(el);

    const tooltipEl = el;
    function updatePosition() {
      computePosition(target, tooltipEl, {
        placement: "bottom-start",
        strategy: "absolute",
        middleware: [flip(), shift()],
      }).then(({ x, y }) => Object.assign(tooltipEl.style, { left: `${x}px`, top: `${y}px`, zIndex: 999 }));
    }

    window.setTimeout(updatePosition, delay);
    cleanups.push(
      listen(window, "resize", updatePosition),
      listen(window, "scroll", updatePosition, { passive: true })
    );
  }

  onMount(() => {
    const offEnter = listen(target, "mouseenter", show);
    const offLeave = listen(target, "mouseleave", hide);
    onCleanup(() => {
      offEnter();
      offLeave();
      hide();
    });
  });
}

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      tooltip: string | undefined;
    }
  }
}
