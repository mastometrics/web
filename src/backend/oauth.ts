import { HandledError } from "~/lib/error";
import { mastodonApi } from "~/lib/mastodon/api";
import { throwOnError } from "./db";
import { findOrCreateInstance, getInstanceAppCredentials } from "./instance";

/** Validates the instance and returns the url of its OAuth authorization page */
export async function getAuthUrl(inputInstance: string, origin: string, opts: { state: string; forceLogin?: boolean }) {
  try {
    await mastodonApi({ instance: inputInstance }).instance.info();
  } catch (error) {
    if (error instanceof HandledError) throw error;
    throw new HandledError("Not a valid mastodon instance");
  }

  const instance = throwOnError(await findOrCreateInstance(inputInstance));
  const credentials = throwOnError(
    await getInstanceAppCredentials(instance, {
      // Note: keep this format stable, apps registered on instances are tied to this exact redirect uri
      redirectUri: `${origin}/auth/connect?instance=${instance.host}`,
    })
  );
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: "code",
    scope: "read",
    state: opts.state,
  });
  if (opts.forceLogin) params.set("force_login", "true");
  return `https://${instance.host}/oauth/authorize?${params}`;
}

export function loginErrorUrl(error: string, instance?: string | null) {
  const params = new URLSearchParams({ error });
  if (instance) params.set("instance", instance);
  return `/auth/login?${params}`;
}
