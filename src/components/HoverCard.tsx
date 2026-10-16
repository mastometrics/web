import { HoverCard as KBHoverCard } from "@kobalte/core/hover-card";
import type { JSX, ParentComponent } from "solid-js";

export const HoverCard: ParentComponent<{ triggerEl: JSX.Element }> = (props) => {
  return (
    <KBHoverCard>
      <KBHoverCard.Trigger as="span">{props.triggerEl}</KBHoverCard.Trigger>
      <KBHoverCard.Portal>
        <KBHoverCard.Content class="bg-mastodon-purple-50 shadow-mastodon-purple-900/10 animate-in fade-in zoom-in max-w-[90vw] rounded-lg p-6 whitespace-normal shadow-lg sm:max-w-lg dark:bg-black">
          <KBHoverCard.Arrow />
          {props.children}
        </KBHoverCard.Content>
      </KBHoverCard.Portal>
    </KBHoverCard>
  );
};
