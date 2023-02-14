import fetch from "node-fetch";
import { ApiOptions, fetchFromApi } from "./api";

export async function lookupAccount(api: ApiOptions, username: string) {
  return (await fetchFromApi<MastodonAccount>(`accounts/lookup?acct=${username}`, api)).data;
}

export async function fetchStatuses(api: ApiOptions, id: string) {
  return (await fetchFromApi<MastodonStatus[]>(`accounts/${id}/statuses`, api)).data;
}

export async function fetchFollowing(api: ApiOptions, id: string) {
  return (await fetchFromApi<MastodonAccount[]>(`accounts/${id}/following`, api)).data;
}

export async function fetchFollowers(api: ApiOptions, id: string) {
  return (await fetchFromApi<MastodonAccount[]>(`accounts/${id}/followers`, api)).data;
}

export async function fetchInstance(api: ApiOptions) {
  try {
    const { data } = await fetchFromApi<MastodonInstance>(`instance`, api);
    if (!data.uri || !data.title) throw new Error("This domain is not a valid Mastodon instance");
  } catch (e) {
    throw new Error(`Could not fetch instance '${api.instance}'`, { cause: e });
  }
}

export async function fetchProfileFromSourceInstance(instance: string, username: string) {
  const user = (await (
    await fetch(`https://${instance}/api/v1/accounts/lookup?acct=${username}`)
  ).json()) as MastodonAccount;
  return user;
}

export async function fetchStatusesFromSourceInstance(instance: string, id: string) {
  const statuses = (await (
    await fetch(`https://${instance}/api/v1/accounts/${id}/statuses?limit=40`)
  ).json()) as MastodonStatus[];
  return statuses;
}

export async function fetchFollowingFromSourceInstance(instance: string, id: string) {
  const following = (await (
    await fetch(`https://${instance}/api/v1/accounts/${id}/following?limit=40`)
  ).json()) as MastodonAccount[];
  return following;
}

export async function fetchFollowersFromSourceInstance(instance: string, id: string) {
  const followers = (await (
    await fetch(`https://${instance}/api/v1/accounts/${id}/followers?limit=40`)
  ).json()) as MastodonAccount[];
  return followers;
}

export async function fetchMastodonInstance(instance: string) {
  try {
    const config = (await (await fetch(`https://${instance}/api/v1/instance`)).json()) as MastodonInstance;
    if (!config.uri || !config.title) throw new Error("Invalid instance");
    return config;
  } catch (e) {
    throw new Error(`Could not fetch instance ${instance}`);
  }
}

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
    if (error?.error == "invalid_grant") throw new Error("Invalid grant: " + error.error_description, { cause: error });
    else throw new Error("Could not fetch access token", { cause: error });
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
  if (!user?.username) throw new Error("Could not fetch authenticated user");
  return user;
}

export interface MastodonAccount {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  locked: boolean;
  bot: boolean;
  discoverable: boolean;
  group: boolean;
  created_at: string;
  note: string;
  url: string;
  avatar: string;
  avatar_static: string;
  header: string;
  header_static: string;
  followers_count: number;
  following_count: number;
  statuses_count: number;
  last_status_at: string;
  noindex: boolean;
  emojis: any[];
  fields: MastodonAccountField[];
}

interface MastodonAccountField {
  name: string;
  value: string;
  verified_at?: any;
}

export interface MastodonStatus {
  id: string;
  created_at: string;
  in_reply_to_id?: string;
  in_reply_to_account_id?: string;
  sensitive: boolean;
  spoiler_text: string;
  visibility: string;
  language?: string;
  uri: string;
  url: string;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  edited_at?: any;
  content: string;
  reblog?: MastodonReblog;
  application?: MastodonApplication;
  account: MastodonAccount;
  media_attachments: MastodonMediaattachment[];
  mentions: MastodonMention[];
  tags: MastodonTag[];
  emojis: any[];
  card?: MastodonCard;
  poll?: any;
}

interface MastodonReblog {
  id: string;
  created_at: string;
  in_reply_to_id?: any;
  in_reply_to_account_id?: any;
  sensitive: boolean;
  spoiler_text: string;
  visibility: string;
  language: string;
  uri: string;
  url: string;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  edited_at?: any;
  content: string;
  reblog?: any;
  account: MastodonAccount;
  media_attachments: MastodonMediaattachment[];
  mentions: MastodonMention[];
  tags: MastodonTag[];
  emojis: any[];
  card?: MastodonCard;
  poll?: any;
  application?: MastodonApplication;
}

interface MastodonApplication {
  name: string;
  website?: any;
}

interface MastodonCard {
  url: string;
  title: string;
  description: string;
  type: string;
  author_name: string;
  author_url: string;
  provider_name: string;
  provider_url: string;
  html: string;
  width: number;
  height: number;
  image?: any;
  embed_url: string;
  blurhash?: any;
}

interface MastodonTag {
  name: string;
  url: string;
}

interface MastodonMention {
  id: string;
  username: string;
  url: string;
  acct: string;
}

interface MastodonMediaattachment {
  id: string;
  type: string;
  url: string;
  preview_url: string;
  remote_url: string;
  preview_remote_url?: any;
  text_url?: any;
  meta: MastodonMeta;
  description: string;
  blurhash: string;
}

interface MastodonMeta {
  original: MastodonOriginal;
  small: MastodonOriginal;
  focus: MastodonFocus;
}

interface MastodonFocus {
  x: number;
  y: number;
}

interface MastodonOriginal {
  width: number;
  height: number;
  size: string;
  aspect: number;
}

export interface MastodonInstance {
  uri: string;
  title: string;
  short_description: string;
  description: string;
  email: string;
  version: string;
  urls: Urls;
  stats: Stats;
  thumbnail: string;
  languages: string[];
  registrations: boolean;
  approval_required: boolean;
  invites_enabled: boolean;
  configuration: Configuration;
  contact_account: MastodonAccount;
  rules: {
    id: string;
    text: string;
  }[];
}

interface Configuration {
  accounts: Accounts;
  statuses: Statuses;
  media_attachments: Mediaattachments;
  polls: Polls;
}

interface Polls {
  max_options: number;
  max_characters_per_option: number;
  min_expiration: number;
  max_expiration: number;
}

interface Mediaattachments {
  supported_mime_types: string[];
  image_size_limit: number;
  image_matrix_limit: number;
  video_size_limit: number;
  video_frame_rate_limit: number;
  video_matrix_limit: number;
}

interface Statuses {
  max_characters: number;
  max_media_attachments: number;
  characters_reserved_per_url: number;
}

interface Accounts {
  max_featured_tags: number;
}

interface Stats {
  user_count: number;
  status_count: number;
  domain_count: number;
}

interface Urls {
  streaming_api: string;
}

interface MastodonAppRegistration {
  id: string;
  name: string;
  website?: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  vapid_key: string;
}

export interface MastodonAccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

export type MastodonAuthenticatedAccount = MastodonAccount & {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  note: string;
  source: MastodonSource;
  role: MastodonRole;
};

interface MastodonRole {
  id: string;
  name: string;
  permissions: string;
  color: string;
  highlighted: boolean;
}

interface MastodonSource {
  privacy: string;
  sensitive: boolean;
  language: string;
  note: string;
  fields: MastodonAccountField[];
  follow_requests_count: number;
}
