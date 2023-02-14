import { Account } from "@prisma/client";
import { Component, createSignal, Show, Suspense } from "solid-js";
import { Outlet, redirect, useNavigate } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { getUser } from "~/db/session";
import { useAuthentication } from "~/lib/useAuthentication";
import logo from "~/assets/logo.svg";
import { DropdownMenu } from "@kobalte/core";
import { AtIcon, Icons, QuestionCircleIcon, SignOutIcon } from "~/components/Icon";
const Header: Component<{ account: Account }> = (props) => {
  const [open, setOpen] = createSignal(false);
  const navigate = useNavigate();

  function startSupport() {
    const url = `https://${props.account.instance}/share?text=@MastoMetrics@mas.to+help!`;
    window.open(url, "_blank");
  }

  return (
    <div class="bg-mastodon-purple-700">
      <div class="container max-w-4xl mx-auto flex items-center py-4 px-6">
        <img src={logo} />
        <div class="flex-auto"></div>
        <Show when={props.account}>
          {/* <a href="#" class="flex-shrink-0 group block"> */}
          <DropdownMenu.Root isOpen={open()} onOpenChange={setOpen} placement="top-end" gutter={4}>
            <DropdownMenu.Trigger class="flex-shrink-0 group block outline-none focus-visible:bg-mastodon-purple-900/50 rounded-lg p-2 pl-8">
              <div class="flex items-center gap-3">
                <div class="hidden sm:block">
                  <p class="text-sm font-medium text-mastodon-purple-100/90 group-hover:text-white text-right group-focus-visible:text-white">
                    {props.account.displayName}
                  </p>
                  <p class="text-xs  font-medium text-mastodon-purple-100/70 group-hover:text-mastodon-purple-200 text-right group-focus-visible:text-white">
                    {props.account.username}
                  </p>
                </div>
                <div>
                  <img class="inline-block h-9 w-9  rounded-md" src={props.account.avatar ?? ""} alt="" />
                </div>
              </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content class="bg-mastodon-purple-700 p-2 rounded-lg shadow-xl outline-none min-w-[200px] animate-in zoom-in-50 fade-in origin-top-right duration-100">
                <DropdownMenu.Item
                  onSelect={() => navigate("/faq")}
                  closeOnSelect
                  class="flex items-center cursor-pointer px-4 py-2 rounded ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white text-mastodon-purple-100 outline-none "
                >
                  <Icons.QuestionMark class="w-4 mr-2" /> <DropdownMenu.ItemLabel>F.A.Q.</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={startSupport}
                  closeOnSelect
                  class="flex items-center cursor-pointer px-4 py-2 rounded ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white text-mastodon-purple-100 outline-none "
                >
                  <AtIcon class="w-4 mr-2" /> <DropdownMenu.ItemLabel>Support</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={() => (window.location.pathname = "/auth/logout/")}
                  closeOnSelect
                  class="flex items-center cursor-pointer px-4 py-2 rounded ui-highlighted:bg-mastodon-purple-800 ui-highlighted:text-white text-mastodon-purple-100 outline-none "
                >
                  <SignOutIcon class="w-4 mr-2" /> <DropdownMenu.ItemLabel>Sign out</DropdownMenu.ItemLabel>
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
