import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import { type Component, createSignal, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import logo from "~/assets/logo.svg?url";
import { cls } from "~/lib/css";
import { startSupport } from "~/lib/support";
import { applyTheme, getStoredTheme, setStoredTheme, type Theme } from "~/lib/theme";
import { Icons } from "./Icon";

export type NavAccount = { username: string; displayName: string | null; avatar: string | null; instance: string };

export const NavBar: Component<{ account?: NavAccount | null; pathname?: string; isAdmin?: boolean }> = (props) => {
  const [theme, setTheme] = createSignal<Theme>("system");
  onMount(() => {
    setTheme(getStoredTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(getStoredTheme());
    media.addEventListener("change", onChange);
  });

  function selectTheme(value: Theme) {
    setTheme(value);
    setStoredTheme(value);
    applyTheme(value);
  }

  const themeOptions: { label: string; value: Theme; icon: (typeof Icons)[keyof typeof Icons] }[] = [
    { label: "Light", value: "light", icon: Icons.Sun },
    { label: "Dark", value: "dark", icon: Icons.Moon },
    { label: "System", value: "system", icon: Icons.SunMoon },
  ];

  const tabs = (): { label: string; href: string }[] =>
    props.account
      ? [
          { label: "Overview", href: `/dashboard/${props.account.username}` },
          { label: "People", href: `/dashboard/${props.account.username}/people` },
        ]
      : [];

  const isActive = (href: string) => props.pathname?.replace(/\/+$/, "") === href;

  return (
    <div class="bg-mastodon-purple-700 dark:bg-mastodon-purple-900">
      <div class="container mx-auto flex max-w-4xl items-center px-2 py-4 sm:px-6">
        <DropdownMenu placement="top" gutter={8} overflowPadding={0} fitViewport>
          <DropdownMenu.Trigger
            class="focus-visible:bg-mastodon-purple-900/50 active:bg-mastodon-purple-700 mr-2 rounded-lg p-4 outline-hidden sm:hidden"
            style={{ "-webkit-tap-highlight-color": "transparent" }}
            aria-label="Menu"
          >
            <Icons.Menu class="text-mastodon-purple-100 h-5 w-5" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="bg-mastodon-purple-700 animate-in fade-in zoom-in-50 dark:bg-mastodon-purple-900 z-20 max-w-[100vw] origin-top space-y-4 rounded-b-lg p-2 shadow-xl outline-hidden duration-100"
              style={{
                width: "var(--kb-popper-content-available-width)",
                left: 0,
              }}
            >
              {tabs().map(({ label, href }) => (
                <DropDownMenuLink href={href} label={label} />
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>

        <a href="/">
          <img src={logo} alt="MastoMetrics logo" />
        </a>
        <div class="flex-auto">
          <div class="ml-8 hidden items-center gap-x-4 sm:flex">
            {tabs().map(({ label, href }) => (
              <a
                href={href}
                class={cls(
                  "text-mastodon-purple-200 hover:bg-mastodon-purple-900/20 rounded-md px-3 py-2 text-sm font-medium hover:text-white dark:hover:bg-[#080822]",
                  isActive(href) &&
                    "bg-mastodon-purple-900/20 dark:text-mastodon-purple-100 text-white dark:bg-[#080822]"
                )}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        <Show when={props.account}>
          {(account) => (
            <DropdownMenu placement="top-end" gutter={4}>
              <DropdownMenu.Trigger class="group focus-visible:bg-mastodon-purple-900/50 block shrink-0 rounded-lg p-2 pl-8 outline-hidden">
                <div class="flex items-center gap-3">
                  <div class="hidden sm:block">
                    <p class="text-mastodon-purple-100/90 text-right text-sm font-medium group-hover:text-white group-focus-visible:text-white">
                      {account().displayName}
                    </p>
                    <p class="text-mastodon-purple-100/70 group-hover:text-mastodon-purple-200 text-right text-xs font-medium group-focus-visible:text-white">
                      {account().username}
                    </p>
                  </div>
                  <div>
                    <img class="inline-block h-9 w-9 rounded-md" src={account().avatar ?? ""} alt="" />
                  </div>
                </div>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content class="bg-mastodon-purple-700 animate-in fade-in zoom-in-50 z-20 min-w-[200px] origin-top-right rounded-lg p-2 shadow-xl outline-hidden duration-100">
                  <DropDownMenuLink href={`/dashboard/${account().username}`} icon={Icons.Home} label="Dashboard" />
                  <DropDownMenuLink href={`/dashboard/settings`} icon={Icons.Settings} label="Settings" />
                  <Show when={props.isAdmin}>
                    <DropDownMenuLink href={`/admin`} icon={Icons.Users} label="Admin" />
                  </Show>
                  <DropDownMenuLink href={`/faq`} icon={Icons.QuestionMark} label="F.A.Q." />
                  <DropDownMenuLink href={`/privacy`} icon={Icons.ShieldLock} label="Privacy Policy" />
                  <DropDownMenuLink onClick={() => startSupport(account())} icon={Icons.At} label="Support" />
                  <DropDownMenuLink href="/auth/logout" icon={Icons.Logout} label="Logout" />

                  <DropdownMenu.Sub overlap gutter={4} shift={-8} fitViewport>
                    <DropdownMenu.SubTrigger class="text-mastodon-purple-100 data-highlighted:bg-mastodon-purple-800 flex cursor-pointer items-center rounded-sm px-4 py-2 outline-hidden data-highlighted:text-white">
                      <Icons.MoonStars class="text-mastodon-purple-200 mr-4 w-4" />
                      <span class="flex-auto">Appearance</span>
                      <Icons.ChevronRight class="ml-2 w-4" />
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent class="bg-mastodon-purple-700 animate-in fade-in zoom-in-50 z-20 min-w-[200px] origin-top rounded-lg p-2 shadow-xl outline-hidden duration-100">
                        <DropdownMenu.Group>
                          <DropdownMenu.GroupLabel class="px-4 py-2 text-sm text-white/50">
                            Color theme
                          </DropdownMenu.GroupLabel>
                          <DropdownMenu.RadioGroup value={theme()}>
                            {themeOptions.map((option) => (
                              <DropdownMenu.RadioItem
                                value={option.value}
                                onSelect={() => selectTheme(option.value)}
                                class="text-mastodon-purple-100 data-highlighted:bg-mastodon-purple-800 flex cursor-pointer items-center rounded-sm px-4 py-2 outline-hidden data-highlighted:text-white"
                              >
                                <Dynamic component={option.icon} class="text-mastodon-purple-200 mr-4 w-4" />
                                <DropdownMenu.ItemLabel class="flex-auto">{option.label}</DropdownMenu.ItemLabel>
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
            </DropdownMenu>
          )}
        </Show>
      </div>
    </div>
  );
};

export const DropDownMenuLink: Component<
  { label: string; icon?: any; class?: string } & ({ href: string } | { onClick: () => void })
> = (props) => {
  return (
    <DropdownMenu.Item
      onSelect={() => ("href" in props ? (window.location.href = props.href) : props.onClick())}
      closeOnSelect
      class={cls(
        "text-mastodon-purple-100 data-highlighted:bg-mastodon-purple-800 flex cursor-pointer items-center rounded-sm px-4 py-2 outline-hidden data-highlighted:text-white",
        props.class
      )}
    >
      {props.icon && <Dynamic component={props.icon} class="text-mastodon-purple-200 mr-4 w-4" />}
      <DropdownMenu.ItemLabel>{props.label}</DropdownMenu.ItemLabel>
    </DropdownMenu.Item>
  );
};
