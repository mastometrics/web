// Helpers for authenticated Astro pages
import type { AstroGlobal } from "astro";
import { usePermissions } from "~/lib/permissions";
import { getFullAccount } from "./account";

/** Resolves the account for a dashboard page, or returns a redirect response */
export async function loadDashboardAccount(Astro: AstroGlobal) {
  const user = Astro.locals.user;
  if (!user) return { redirect: Astro.redirect("/auth/login") } as const;
  const handle = Astro.params.handle!;
  if (!usePermissions(user).account.view(handle))
    return { redirect: Astro.redirect(`/dashboard/${user.account.username}`) } as const;

  const [data, error] = await getFullAccount(handle);
  if (error) throw error;
  if (!data.account) return { redirect: await Astro.rewrite("/404") } as const;
  return { user, account: data.account, permissions: usePermissions(user) } as const;
}
