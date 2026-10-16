import type { JSX, ParentComponent } from "solid-js";
import { Popover as KBPopover } from "@kobalte/core/popover";

export const Popover: ParentComponent<{ triggerEl: JSX.Element; title?: string }> = (props) => {
  return (
    <KBPopover>
      {props.triggerEl}
      <KBPopover.Portal>
        <KBPopover.Content class="animate-in fade-in zoom-in-50 dark:bg-mastodon-purple-700 origin-top rounded-md bg-white p-4 shadow-lg duration-100">
          <KBPopover.Arrow />
          <KBPopover.Title class="text-mastodon-purple-400 dark:text-mastodon-purple-200 mb-2 text-xs font-bold uppercase">
            {props.title}
          </KBPopover.Title>
          {props.children}
        </KBPopover.Content>
      </KBPopover.Portal>
    </KBPopover>
  );
};

export const PopoverTrigger = KBPopover.Trigger;
