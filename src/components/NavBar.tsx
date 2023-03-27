import { DropdownMenu } from "@kobalte/core";
import { Account } from "@prisma/client";
import { Component, createEffect, createSignal, Show } from "solid-js";
import { A, useNavigate } from "solid-start";
import { Icons } from "./Icon";
import logo from "~/assets/logo.svg";
import { startSupport } from "~/lib/support";
import { Dynamic } from "solid-js/web";
import { Theme, useTheme } from "~/root";
import { cls } from "~/lib/css";

export const NavBar: Component<{ account: Account }> = (props) => {
  const themeCtx = useTheme();
  const themeOptions: { label: string; value: Theme; icon: (typeof Icons)[keyof typeof Icons] }[] = [
    { label: "Light", value: "light", icon: Icons.Sun },
    { label: "Dark", value: "dark", icon: Icons.Moon },
    { label: "System", value: "system", icon: Icons.SunMoon },
  ];

  const tabs: { label: string; href: string }[] = [
    { label: "Overview", href: `/dashboard/${props.account?.username}` },
    { label: "People", href: `/dashboard/${props.account?.username}/people` },
  ];

  return (
    <div class="bg-mastodon-purple-700 dark:bg-mastodon-purple-900">
      <div class="container mx-auto flex max-w-4xl items-center py-4  px-2 sm:px-6">
        <DropdownMenu.Root placement="top" gutter={8} overflowPadding={0} fitViewport>
          <DropdownMenu.Trigger
            class="mr-2 rounded-lg p-4 outline-none focus-visible:bg-mastodon-purple-900/50 active:bg-mastodon-purple-700 sm:hidden"
            style={{ "-webkit-tap-highlight-color": "transparent" }}
          >
            <Icons.Menu class="h-5 w-5 text-mastodon-purple-100" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="z-20 max-w-[100vw] origin-top space-y-4 rounded-b-lg bg-mastodon-purple-700 p-2 shadow-xl outline-none animate-in fade-in zoom-in-50 duration-100 dark:bg-mastodon-purple-900"
              style={{
                width: "var(--kb-popper-content-available-width)",
                left: 0,
              }}
            >
              {tabs.map(({ label, href }) => (
                <DropDownMenuLink href={href} label={label} />
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <A href="/">
          <img src={logo} />
        </A>
        <div class="flex-auto">
          <div class="ml-8 hidden items-center  gap-x-4 sm:flex">
            {tabs.map(({ label, href }) => (
              <A
                href={href}
                class="rounded-md px-3 py-2 text-sm font-medium text-mastodon-purple-200 hover:bg-mastodon-purple-900/20 hover:text-white dark:hover:bg-[#080822]"
                activeClass="bg-mastodon-purple-900/20 text-white dark:bg-[#080822] dark:text-mastodon-purple-100"
                end
              >
                {label}
              </A>
            ))}
          </div>
        </div>
        <Show when={props.account}>
          {/* <a href="#" class="flex-shrink-0 group block"> */}
          <DropdownMenu.Root placement="top-end" gutter={4}>
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
  { label: string; icon?: any; class?: string } & ({ href: string } | { onClick: () => void })
> = (props) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu.Item
      onSelect={() => ("href" in props ? navigate(props.href) : props.onClick())}
      closeOnSelect
      class={cls(
        "flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white",
        props.class
      )}
    >
      {props.icon && <Dynamic component={props.icon} class="mr-4 w-4 text-mastodon-purple-200" />}
      <DropdownMenu.ItemLabel>{props.label}</DropdownMenu.ItemLabel>
    </DropdownMenu.Item>
  );
};
