// Astro specific session helpers
import type { AstroCookies } from "astro";
import { createSessionValue, SESSION_COOKIE, SESSION_MAX_AGE } from "./session";

export function setUserSession(cookies: AstroCookies, userId: string | number, url: URL) {
  cookies.set(SESSION_COOKIE, createSessionValue(userId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // Browsers refuse secure cookies over plain http (except on localhost for most browsers)
    secure: url.protocol === "https:" || process.env.SITE_URL?.startsWith("https:") === true,
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearUserSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

/** The public origin of this deployment, used to build OAuth redirect urls */
export function getOrigin(url: URL) {
  return process.env.SITE_URL?.replace(/\/+$/, "") || url.origin;
}
