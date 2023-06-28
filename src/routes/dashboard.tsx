import { Suspense } from "solid-js";
import { Outlet, useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { useAuthentication } from "~/backend/authentication";
import { MaintenanceGuard } from "~/components/MaintenanceGuard";
import { NavBar } from "~/components/NavBar";

export function routeData() {
  const user = createServerData$(async (_, { request }) => await useAuthentication(request));
  return { user };
}

export default function DashboardRoute() {
  const { user } = useRouteData<typeof routeData>();
  return (
    <div class="flex min-h-screen flex-col">
      <Suspense>
        <NavBar account={user()?.account!} />
        {/* <div class="bg-mastodon-purple-100/90 h-20"></div> */}
      </Suspense>
      <div class="flex-auto">
        <MaintenanceGuard>
          <Outlet />
        </MaintenanceGuard>
      </div>

      <div class="container mx-auto max-w-4xl p-4 sm:px-6 sm:pb-8 ">
        <div class="flex flex-wrap items-center gap-4 rounded-lg border border-mastodon-purple-500 bg-mastodon-purple-100/90 p-4 dark:bg-mastodon-purple-500/50 sm:p-6">
          <div class="flex flex-auto gap-4">
            <img
              src="https://media.mas.to/masto-public/accounts/avatars/109/540/614/448/945/903/original/4534233dacea0cf7.jpg"
              class="mt-1 h-8 rounded-full border border-mastodon-purple-700 dark:border-white"
            />
            <p class="max-w-prose leading-relaxed text-mastodon-purple-800 dark:text-white">
              MastoMetrics is free to use, but my servers sadly are not.
              <br />
              Please consider a small donation to keep the project running.
              <br />
              ❤️ Thank you!
              <br />– Robert
            </p>
          </div>
          <a href="https://ko-fi.com/robertvh" target="_blank" rel="noopener">
            <img
              src="https://storage.ko-fi.com/cdn/brandasset/kofi_button_red.png"
              class="h-8"
              alt="Buy Me a Coffee at ko-fi.com"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
