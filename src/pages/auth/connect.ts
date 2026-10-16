import type { APIRoute } from "astro";
import { setUserSession } from "~/backend/auth-session";
import { getInstanceAppCredentials } from "~/backend/instance";
import { loginErrorUrl } from "~/backend/oauth";
import { authenticate } from "~/backend/session";
import { config } from "~/lib/config";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";
import { fetchAuthenticatedUser, fetchUserAccessToken } from "~/lib/mastodon/auth";

/** OAuth callback */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  const host = url.searchParams.get("instance");
  if (config.maintenanceMode) return redirect(loginErrorUrl("Server is in maintenance mode"));
  if (!code || !host) return redirect(loginErrorUrl("No code or instance provided"));

  try {
    // Use the stored app credentials, the authorization code was issued for that app
    const [credentials, credentialsError] = await getInstanceAppCredentials(host, {});
    if (credentialsError) throw credentialsError;
    const token = await fetchUserAccessToken(host, credentials, { code, scope: credentials.scope });
    const authAccount = await fetchAuthenticatedUser(host, token.access_token);
    if (!authAccount) throw Error("No authenticated user found");
    const [user, error] = await authenticate({ authAccount, token, instance: credentials.instance });
    if (error) throw error;
    setUserSession(cookies, user.id, url);
    return redirect(`/dashboard/${user.Account.username}`);
  } catch (error) {
    if (!(error instanceof HandledError)) logger.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return redirect(loginErrorUrl(`Could not sign you in with ${host}:\n${message}`, host));
  }
};
