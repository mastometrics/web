import { HoverCard as KBHoverCard } from "@kobalte/core";
import { JSX, ParentComponent } from "solid-js";

export const HoverCard: ParentComponent<{ triggerEl: JSX.Element }> = (props) => {
  return (
    <KBHoverCard.Root>
      <KBHoverCard.Trigger>{props.triggerEl}</KBHoverCard.Trigger>
      <KBHoverCard.Portal>
        <KBHoverCard.Content class="max-w-[90vw] whitespace-normal rounded-lg bg-mastodon-purple-50 p-6 shadow-lg shadow-mastodon-purple-900/10 animate-in fade-in zoom-in dark:bg-black sm:max-w-lg">
          <KBHoverCard.Arrow />
          {props.children}
        </KBHoverCard.Content>
      </KBHoverCard.Portal>
    </KBHoverCard.Root>
  );
};
