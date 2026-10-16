import type { APIRoute } from "astro";
import { clearUserSession } from "~/backend/auth-session";

export const GET: APIRoute = ({ cookies, redirect }) => {
  clearUserSession(cookies);
  return redirect("/");
};
