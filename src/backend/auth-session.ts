// Astro specific session helpers
import type { AstroCookies } from "astro";
import { randomBytes, timingSafeEqual } from "node:crypto";
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

const OAUTH_STATE_COOKIE = "mm_oauth_state";

/**
 * Starts a sign in with the given instance: remembers a random `state` for the OAuth callback in a cookie, so a
 * callback that wasn't started from this browser (e.g. to sign someone into an attacker's account) is rejected
 */
export function createOAuthState(cookies: AstroCookies, instance: string, url: URL) {
  const state = randomBytes(24).toString("base64url");
  cookies.set(OAUTH_STATE_COOKIE, `${instance}|${state}`, {
    path: "/auth",
    httpOnly: true,
    // Lax, the callback is a top level navigation coming from the instance
    sameSite: "lax",
    secure: url.protocol === "https:" || process.env.SITE_URL?.startsWith("https:") === true,
    maxAge: 60 * 15,
  });
  return state;
}

/** Whether the OAuth callback belongs to the sign in started in this browser, can only be used once */
export function consumeOAuthState(cookies: AstroCookies, instance: string, state: string | null) {
  const stored = cookies.get(OAUTH_STATE_COOKIE)?.value;
  cookies.delete(OAUTH_STATE_COOKIE, { path: "/auth" });
  if (!stored || !state) return false;
  const expected = Buffer.from(stored);
  const actual = Buffer.from(`${instance.toLowerCase()}|${state}`);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
