import { HandledError } from "../error";
import { MastodonAccessToken, MastodonAppRegistration, MastodonAuthenticatedAccount } from "./types";

export async function registerInstanceApp(
  instance: string,
  config: { clientName: string; redirectUris: string; scopes?: string | string[]; website?: string }
) {
  const scopes = config.scopes
    ? typeof config.scopes == "string"
      ? config.scopes
      : config.scopes?.join(" ")
    : "read write follow";
  const registration = (await (
    await fetch(`https://${instance}/api/v1/apps`, {
      method: "POST",
      body: JSON.stringify({
        client_name: config.clientName,
        redirect_uris: config.redirectUris,
        scopes,
        website: config.website,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
  ).json()) as MastodonAppRegistration;
  return { ...registration, instance, scopes };
}

export async function fetchAccessToken(
  instance: string,
  client: { clientId: string; clientSecret: string; redirectUri: string },
  authorization?: { code: string; scope: string }
) {
  const body = JSON.stringify(
    Object.assign(
      {
        client_id: client.clientId,
        client_secret: client.clientSecret,
        redirect_uri: client.redirectUri,
      },
      authorization
        ? {
            grant_type: "authorization_code",
            code: authorization?.code,
            // scope: authorization?.scope,
          }
        : { grant_type: "client_credentials" }
    )
  );
  const request = fetch(`https://${instance}/oauth/token`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });
  const response = await request;
  if (response.status != 200) {
    const error = (await response.json()) as { error: string; error_description: string };
    if (error?.error == "invalid_grant")
      throw new HandledError("Invalid grant: " + error.error_description, { cause: error, status: response.status });
    else throw new HandledError("Could not fetch access token", { cause: error, status: response.status });
  }
  const token = (await response.json()) as MastodonAccessToken;
  return token;
}

export const fetchUserAccessToken = fetchAccessToken;
export const fetchAppAccessToken = (
  instance: string,
  client: { clientId: string; clientSecret: string; redirectUri: string }
) => fetchAccessToken(instance, client);

export async function fetchAuthenticatedUser(instance: string, accessToken: string) {
  const user = (await (
    await fetch(`https://${instance}/api/v1/accounts/verify_credentials`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  ).json()) as MastodonAuthenticatedAccount;
  if (!user?.username) throw new HandledError("Could not fetch authenticated user");
  return user;
}
