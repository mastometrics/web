import { Suspense } from "solid-js";
import { Outlet, redirect, useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { useAuthentication } from "~/backend/authentication";
import { NavBar } from "~/components/NavBar";
import { usePermissions } from "~/lib/permissions";

export function routeData() {
  const user = createServerData$(async (_, { request }) => {
    const user = await useAuthentication(request);
    if (usePermissions(user).manage()) return user;
    else throw redirect("/auth/login");
  });
  return { user };
}

export default function DashboardRoute() {
  const { user } = useRouteData<typeof routeData>();

  return (
    <div>
      <Suspense>
        <NavBar account={user()?.account!} />
        {/* <div class="bg-mastodon-purple-100/90 h-20"></div> */}
      </Suspense>

      <Outlet />
    </div>
  );
}
