import { Account } from "@prisma/client";
import { Component, createSignal, Show, Suspense } from "solid-js";
import { Outlet, redirect, useNavigate } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { getUser } from "~/db/session";
import { useAuthentication } from "~/lib/useAuthentication";
import logo from "~/assets/logo.svg";
import { DropdownMenu } from "@kobalte/core";
import { AtIcon, Icons, SignOutIcon } from "~/components/Icon";
const Header: Component<{ account: Account }> = (props) => {
  const [open, setOpen] = createSignal(false);
  const navigate = useNavigate();

  function startSupport() {
    const url = `https://${props.account.instance}/share?text=@MastoMetrics@mas.to+help!`;
    window.open(url, "_blank");
  }

  return (
    <div class="bg-mastodon-purple-700 dark:bg-mastodon-purple-900">
      <div class="container mx-auto flex max-w-4xl items-center py-4 px-6">
        <img src={logo} />
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
                  onSelect={startSupport}
                  closeOnSelect
                  class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
                >
                  <AtIcon class="mr-2 w-4" /> <DropdownMenu.ItemLabel>Support</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={() => (window.location.pathname = "/auth/logout/")}
                  closeOnSelect
                  class="flex cursor-pointer items-center rounded px-4 py-2 text-mastodon-purple-100 outline-none ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white "
                >
                  <SignOutIcon class="mr-2 w-4" /> <DropdownMenu.ItemLabel>Sign out</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Show>
      </div>
    </div>
  );
};

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const [user, error] = await getUser(request);
    if (!user) throw redirect("/auth/login");
    if (error) throw redirect("/auth/login?error=" + encodeURIComponent(error));
    return user;
  });
}

export default function DashboardRoute() {
  const user = useAuthentication();
  return (
    <div>
      <Suspense>
        <Header account={user()?.account!} />
        {/* <div class="bg-mastodon-purple-100/90 h-20"></div> */}
      </Suspense>

      <Outlet />
    </div>
  );
}
