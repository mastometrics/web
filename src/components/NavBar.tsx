import { DropdownMenu } from "@kobalte/core";
import { Account } from "@prisma/client";
import { Component, createEffect, createSignal, Show } from "solid-js";
import { A, useNavigate } from "solid-start";
import { Icons } from "./Icon";
import logo from "~/assets/logo.svg";
import { startSupport } from "~/lib/support";
import { Dynamic } from "solid-js/web";
import { Theme, useTheme } from "~/root";

export const NavBar: Component<{ account: Account }> = (props) => {
  const [open, setOpen] = createSignal(false);
  const themeCtx = useTheme();
  const themeOptions: { label: string; value: Theme; icon: (typeof Icons)[keyof typeof Icons] }[] = [
    { label: "Light", value: "light", icon: Icons.Sun },
    { label: "Dark", value: "dark", icon: Icons.Moon },
    { label: "System", value: "system", icon: Icons.SunMoon },
  ];
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
              <DropdownMenu.Content class="z-20 min-w-[200px] origin-top-right rounded-lg bg-mastodon-purple-700 p-2 shadow-xl outline-none animate-in fade-in zoom-in-50 duration-100">
                <DropDownMenuLink href={`/dashboard/${props.account.username}`} icon={Icons.Home} label="Dashboard" />
                <DropDownMenuLink href={`/dashboard/settings`} icon={Icons.Settings} label="Settings" />
                <DropDownMenuLink href={`/faq`} icon={Icons.QuestionMark} label="F.A.Q." />
                <DropDownMenuLink href={`/privacy/`} icon={Icons.ShieldLock} label="Privacy Policy" />
                <DropDownMenuLink onClick={() => startSupport(props.account)} icon={Icons.At} label="Support" />
                <DropDownMenuLink onClick={() => (location.href = "/auth/logout")} icon={Icons.Logout} label="Logout" />

                <DropdownMenu.Sub overlap gutter={4} shift={-8} fitViewport>
                  <DropdownMenu.SubTrigger class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white ">
                    <Icons.MoonStars class="mr-4 w-4 text-mastodon-purple-200" />
                    <span class="flex-auto">Appearance</span>
                    <Icons.ChevronRight class="ml-2 w-4" />
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent class="z-20 min-w-[200px] origin-top rounded-lg bg-mastodon-purple-700 p-2 shadow-xl outline-none animate-in fade-in zoom-in-50 duration-100">
                      <DropdownMenu.Group>
                        <DropdownMenu.GroupLabel class="px-4 py-2 text-sm text-white/50">
                          Color theme
                        </DropdownMenu.GroupLabel>
                        <DropdownMenu.RadioGroup value={themeCtx?.theme()!}>
                          {themeOptions.map((theme) => (
                            <DropdownMenu.RadioItem
                              value={theme.value}
                              onSelect={() => themeCtx?.setTheme(theme.value)}
                              class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
                            >
                              <Dynamic component={theme.icon} class="mr-4 w-4 text-mastodon-purple-200" />
                              <DropdownMenu.ItemLabel class="flex-auto">{theme.label}</DropdownMenu.ItemLabel>
                              <DropdownMenu.ItemIndicator>
                                <Icons.Check />
                              </DropdownMenu.ItemIndicator>
                            </DropdownMenu.RadioItem>
                          ))}
                        </DropdownMenu.RadioGroup>
                      </DropdownMenu.Group>
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Show>
      </div>
    </div>
  );
};

export const DropDownMenuLink: Component<
  { label: string; icon: any } & ({ href: string } | { onClick: () => void })
> = (props) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu.Item
      onSelect={() => ("href" in props ? navigate(props.href) : props.onClick())}
      closeOnSelect
      class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
    >
      <Dynamic component={props.icon} class="mr-4 w-4 text-mastodon-purple-200" />
      <DropdownMenu.ItemLabel>{props.label}</DropdownMenu.ItemLabel>
    </DropdownMenu.Item>
  );
};
