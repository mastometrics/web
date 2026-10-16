import { createSignal, onCleanup, onMount, type ParentComponent } from "solid-js";

export const FeatureCard: ParentComponent<{ title: string }> = (props) => {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [pos, setPos] = createSignal({ x: 0, y: 0 });
  const [relativePos, setRelativePos] = createSignal({ x: 0, y: 0 });

  onMount(() => {
    const ctrl = new AbortController();
    const el = container()!;
    el?.addEventListener(
      "mousemove",
      (e) => {
        // calculate the cursor position within the container based on the clientX and clientY
        const rect = el.getBoundingClientRect(),
          x = e.clientX - rect.left,
          y = e.clientY - rect.top;
        setPos({ x, y });
        // set text shadow-sm with y and x offset based on the cursor position within the container
        // where 0,0 is the center of the container and 1,1 is the bottom right corner
        setRelativePos({ x: x / el.offsetWidth - 0.5, y: y / el.offsetHeight - 0.5 });
      },
      { passive: true, signal: ctrl.signal }
    );
    onCleanup(() => ctrl.abort());
  });

  return (
    <div
      ref={setContainer}
      class="group relative rounded-xl border-[#1B1C69] bg-[#080821]/70 p-6 shadow-[0_1px_0_1px_rgba(165,144,255,0.25),inset_0_1px_0_1px_rgba(67,46,160,0.73)] sm:p-8"
    >
      <div
        class="pointer-events-none absolute inset-0 hidden rounded-[inherit] p-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-80 sm:block"
        style={{
          "background-image": `radial-gradient(circle at ${pos().x}px ${
            pos().y
          }px, rgba(94,85,236,0.31) 0%, rgba(14,15,59,0.00) 80%)`,
          "box-shadow": `${relativePos().x * -5}px ${relativePos().y * -5 + 10}px 15px 2px rgba(0,0,0,0.2)`,
        }}
      >
        <div
          class="text-base font-extrabold text-white/0"
          style={{ "text-shadow": `${relativePos().x * -10}px ${relativePos().y * -10}px 4px rgba(0,0,0,0.5)` }}
        >
          {props.title}
        </div>
        <div
          class="text-mastodon-purple-200/0 mt-4 text-base leading-normal font-medium"
          style={{ "text-shadow": `${relativePos().x * -10}px ${relativePos().y * -10}px 4px rgba(0,0,0,0.5)` }}
        >
          {props.children}
        </div>
      </div>
      <div class="relative text-base font-extrabold text-white">{props.title}</div>
      <div class="text-mastodon-purple-200 relative mt-4 text-base leading-normal font-medium">{props.children}</div>
    </div>
  );
};
