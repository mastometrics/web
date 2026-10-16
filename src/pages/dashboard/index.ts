import type { APIRoute } from "astro";

export const GET: APIRoute = ({ locals, redirect }) => {
  if (locals.user?.account) return redirect(`/dashboard/${locals.user.account.username}`);
  return redirect("/auth/login");
};
