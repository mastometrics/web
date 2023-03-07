import { DropdownMenu } from "@kobalte/core";
import { Account } from "@prisma/client";
import { Component, createSignal, Show } from "solid-js";
import { A, useNavigate } from "solid-start";
import { Icons } from "./Icon";
import logo from "~/assets/logo.svg";
import { startSupport } from "~/lib/support";

export const NavBar: Component<{ account: Account }> = (props) => {
  const [open, setOpen] = createSignal(false);
  const navigate = useNavigate();

  return (
    <div class="bg-mastodon-purple-700 dark:bg-mastodon-purple-900">
      <div class="container mx-auto flex max-w-4xl items-center py-4 px-6">
        <A href="/">
          <img src={logo} />
        </A>
        <div class="flex-auto"></div>
        <Show when={props.account}>
          {/* <a href="#" class="flex-shrink-0 group block"> */}
          <DropdownMenu.Root isOpen={open()} onOpenChange={setOpen} placement="top-end" gutter={4}>
            <DropdownMenu.Trigger class="group block flex-shrink-0 rounded-lg p-2 pl-8 outline-none focus-visible:bg-mastodon-purple-900/50">
              <div class="flex items-center gap-3">
                <div class="hidden sm:block">
                  <p class="text-right text-sm font-medium text-mastodon-purple-100/90 group-hover:text-white group-focus-visible:text-white">
                    {props.account.displayName}
                  </p>
                  <p class="text-right  text-xs font-medium text-mastodon-purple-100/70 group-hover:text-mastodon-purple-200 group-focus-visible:text-white">
                    {props.account.username}
                  </p>
                </div>
                <div>
                  <img class="inline-block h-9 w-9  rounded-md" src={props.account.avatar ?? ""} alt="" />
                </div>
              </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content class="min-w-[200px] origin-top-right rounded-lg bg-mastodon-purple-700 p-2 shadow-xl outline-none animate-in fade-in zoom-in-50 duration-100">
                <DropdownMenu.Item
                  onSelect={() => navigate("/faq")}
                  closeOnSelect
                  class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
                >
                  <Icons.QuestionMark class="mr-2 w-4" /> <DropdownMenu.ItemLabel>F.A.Q.</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={() => navigate("/privacy")}
                  closeOnSelect
                  class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
                >
                  <Icons.ShieldLock class="mr-2 w-4" />
                  <DropdownMenu.ItemLabel>Privacy Policy</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={() => startSupport(props.account)}
                  closeOnSelect
                  class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
                >
                  <Icons.At class="mr-2 w-4" /> <DropdownMenu.ItemLabel>Support</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={() => (window.location.pathname = "/auth/logout/")}
                  closeOnSelect
                  class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
                >
                  <Icons.Logout class="mr-2 w-4" /> <DropdownMenu.ItemLabel>Sign out</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Show>
      </div>
    </div>
  );
};
