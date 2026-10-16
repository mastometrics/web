import { HandledError } from "../error";
import { logger } from "../logger";
import { type ApiOptions, fetchApi, http } from "./http";
import {
  type MastodonAccount,
  type MastodonInstance,
  type MastodonNotification,
  type MastodonRelationship,
  type MastodonStatus,
} from "./types";
export * from "./types";

type paginateOpts = { limit?: number };
export function mastodonApi(api: ApiOptions) {
  return {
    instance: {
      info: () => fetchInstance(api),
    },
    accounts: {
      /** Find an account on the instance by username */
      lookup: async (username: string) =>
        (await http.fetch<MastodonAccount>(`accounts/lookup?acct=${username}`, api)).data,
      get: async (id: string) => (await http.fetch<MastodonAccount>(`accounts/${id}`, api)).data,
      /** The account the token belongs to, fails with a 401 when the token was revoked */
      verifyCredentials: async () => (await http.fetch<MastodonAccount>("accounts/verify_credentials", api)).data,
      /** Get account followers, max 80 per request */
      followers: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonAccount>(`accounts/${params.id}/followers?${limit(FOLLOW_LIMIT, opts)}`, api, opts),
      /** Get account following, max 80 per request */
      following: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonAccount>(`accounts/${params.id}/following?${limit(FOLLOW_LIMIT, opts)}`, api, opts),
      /** Get account statuses, max 40 per request */
      statuses: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonStatus>(`accounts/${params.id}/statuses?${limit(STATUS_LIMIT, opts)}`, api, opts),
      relationships: async (params: { ids: string[] }) =>
        (await http.fetch<MastodonRelationship[]>(`accounts/relationships?${queryArray("id", params.ids)}`, api)).data,
    },
    notifications: {
      /** Get notifications, max 30 per request */
      list: (
        { types, sinceId }: { types: MastodonNotification["type"][]; sinceId?: number } = { types: [] },
        opts?: paginateOpts
      ) =>
        http.paginate<MastodonNotification>(
          `notifications?${queryArray("types", types)}&${limit(30, opts)}${sinceId ? `&since_id=${sinceId}` : ""}`,
          api,
          opts
        ),
    },
  };
}

const FOLLOW_LIMIT = 80;
const STATUS_LIMIT = 40;

export const MASTODON = {
  API: {
    STATUS_PER_PAGE_LIMIT: STATUS_LIMIT,
    FOLLOWERS_PER_PAGE_LIMIT: FOLLOW_LIMIT,
    FOLLOWING_PER_PAGE_LIMIT: FOLLOW_LIMIT,
  },
};

function limit(max: number, { limit }: paginateOpts = {}) {
  return limit ? `limit=${Math.min(limit, max)}` : `limit=${max}`;
}

async function fetchInstance(api: ApiOptions) {
  try {
    const { data } = await fetchApi<MastodonInstance>(`instance`, api);
    if (!data.uri || !data.title) throw new HandledError("This domain is not a valid Mastodon instance");
    return data;
  } catch (e) {
    logger.warn(e);
    throw new HandledError(`Could not fetch instance '${api.instance}'`, { cause: e });
  }
}

function queryArray<T>(key: string, value: T[]) {
  return value.map((v) => `${key}[]=${v}`).join("&");
}
