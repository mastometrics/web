import { computePosition, flip, shift } from "@floating-ui/dom";
import { makeEventListener } from "@solid-primitives/event-listener";
import { onMount, onCleanup } from "solid-js";

export function tooltip<T extends Element>(target: T, opts: () => string) {
  let tooltip: HTMLElement | undefined;
  let cleanups: (() => void)[] = [];
  const delay = 50;

  function createTooltipElement(content: string) {
    const el = document.createElement("div");
    el.className =
      "z-30 max-w-sm rounded-sm bg-mastodon-purple-900 px-3 py-2 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 dark:bg-mastodon-purple-800 sm:w-auto";
    el.innerText = content;
    document.body.appendChild(el);
    makeEventListener(target, "mouseleave", () => {
      el.remove();
      makeEventListener(target, "mouseenter", () => (tooltip = createTooltipElement(content)), { once: true });
    });

    Object.assign(el.style, { position: "absolute" });
    function updatePosition() {
      computePosition(target, el, {
        placement: "bottom-start",
        strategy: "absolute",
        middleware: [flip(), shift()],
      }).then(({ x, y }) =>
        Object.assign(el.style, {
          left: `${x}px`,
          top: `${y}px`,
          zIndex: 999,
        })
      );
    }

    window.setTimeout(updatePosition, delay);
    cleanups.push(
      makeEventListener(window, "resize", updatePosition),
      makeEventListener(window, "scroll", updatePosition, { passive: true })
    );
    return el;
  }

  onMount(() => {
    let content = opts();
    if (!target || !content) return;
    makeEventListener(target, "mouseenter", () => (tooltip = createTooltipElement(content)), { once: true });
  });

  onCleanup(() => {
    for (const cleanup of cleanups) cleanup();
    if (tooltip) tooltip.remove();
  });
}

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      tooltip: string;
    }
  }
}
