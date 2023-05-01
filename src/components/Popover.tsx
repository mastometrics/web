import { ParentComponent } from "solid-js";
import { Popover as KBPopover } from "@kobalte/core";

export const Popover: ParentComponent<{ triggerEl: ReturnType<typeof PopoverTrigger>; title?: string }> = (props) => {
  return (
    <KBPopover.Root>
      {props.triggerEl}
      <KBPopover.Portal>
        <KBPopover.Content class="origin-top rounded-md bg-white p-4 shadow-lg  animate-in fade-in zoom-in-50 duration-100 dark:bg-mastodon-purple-700 ">
          <KBPopover.Arrow />
          {/* <KBPopover.CloseButton>
                <Icons.Close />
              </KBPopover.CloseButton> */}
          <KBPopover.Title class="mb-2 text-xs font-bold uppercase  text-mastodon-purple-400 dark:text-mastodon-purple-200">
            {props.title}
          </KBPopover.Title>
          {props.children}
        </KBPopover.Content>
      </KBPopover.Portal>
    </KBPopover.Root>
  );
};

export const PopoverTrigger = KBPopover.Trigger;
