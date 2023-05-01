import { Checkbox as KBCheckbox } from "@kobalte/core";
import { ParentComponent } from "solid-js";
import { Icons } from "./Icon";
export const Checkbox: ParentComponent<{ checked: boolean; onChange: (isChecked: boolean) => void }> = (props) => {
  return (
    <KBCheckbox.Root
      isChecked={props.checked}
      onCheckedChange={props.onChange}
      class="flex flex-wrap items-center gap-2"
    >
      <KBCheckbox.Input class="peer" />
      <KBCheckbox.Control class="grid h-5 w-5 place-items-center items-center rounded-sm border border-black/20 bg-mastodon-purple-50 shadow-sm ring-white  peer-focus-visible:ring ui-checked:bg-mastodon-purple-500 ui-checked:text-white">
        <KBCheckbox.Indicator>
          <Icons.Check class="h-4 w-4" />
        </KBCheckbox.Indicator>
      </KBCheckbox.Control>
      <KBCheckbox.Label>{props.children}</KBCheckbox.Label>
    </KBCheckbox.Root>
  );
};
