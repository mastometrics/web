import { APIEvent } from "solid-start";
import { redirect } from "solid-start/server";
import { getInstanceAppCredentials } from "~/db/instance";
import { authenticate, createUserSession } from "~/db/session";
import { fetchAuthenticatedUser, fetchUserAccessToken } from "~/lib/mastodon";

export async function GET({ params, request }: APIEvent) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const host = url.searchParams.get("instance");

  if (!code || !host) return redirect(`/login?error=${encodeURIComponent("No code or instance provided")}`);
  const [credentials, error] = await getInstanceAppCredentials(host, {});
  if (error) throw error;
  try {
    const token = await fetchUserAccessToken(host, credentials, { code, scope: credentials.scope });
    const authAccount = await fetchAuthenticatedUser(host, token.access_token);
    if (!authAccount) throw Error("No authenticated user found");
    const [user, error] = await authenticate({ authAccount, token, instance: credentials.instance });
    if (error) throw error;
    if (user) return await createUserSession(`${user.id}`, `/dashboard/${user?.Account?.username}`);
  } catch (error) {
    console.error(error);
    return redirect(
      `/auth/login?error=${encodeURIComponent(error as string)}` +
        (host ? `&instance=${encodeURIComponent(host!)}` : "")
    );
  }
}
