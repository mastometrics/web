import { Checkbox as KBCheckbox } from "@kobalte/core/checkbox";
import type { ParentComponent } from "solid-js";
import { Icons } from "./Icon";
export const Checkbox: ParentComponent<{ checked: boolean; onChange: (isChecked: boolean) => void }> = (props) => {
  return (
    <KBCheckbox checked={props.checked} onChange={props.onChange} class="flex flex-wrap items-center gap-2">
      <KBCheckbox.Input class="peer" />
      <KBCheckbox.Control class="bg-mastodon-purple-50 data-checked:bg-mastodon-purple-500 grid h-5 w-5 place-items-center items-center rounded-xs border border-black/20 shadow-xs ring-white peer-focus-visible:ring-3 data-checked:text-white">
        <KBCheckbox.Indicator>
          <Icons.Check class="h-4 w-4" />
        </KBCheckbox.Indicator>
      </KBCheckbox.Control>
      <KBCheckbox.Label>{props.children}</KBCheckbox.Label>
    </KBCheckbox>
  );
};
