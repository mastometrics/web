import { ClientError } from "../error";
import { ApiOptions, fetchApi, http } from "./http";
import { MastodonAccount, MastodonInstance, MastodonNotification, MastodonStatus } from "./types";
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
      /** Get account followers, max 80 per request */
      followers: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonAccount>(`accounts/${params.id}/followers?${limit(FOLLOW_LIMIT, opts)}`, api, opts),
      /** Get account following, max 80 per request */
      following: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonAccount>(`accounts/${params.id}/following?${limit(FOLLOW_LIMIT, opts)}`, api, opts),
      /** Get account statuses, max 40 per request */
      statuses: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonStatus>(`accounts/${params.id}/statuses?${limit(STATUS_LIMIT, opts)}`, api, opts),
    },
    notifications: {
      /** Get notifications, max 30 per request */
      list: ({ types }: { types: MastodonNotification["type"][] } = { types: [] }, opts?: paginateOpts) =>
        http.paginate<MastodonNotification>(
          `notifications?types[]=${types.join("&types[]=")}&${limit(30, opts)}`,
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
    if (!data.uri || !data.title) throw new ClientError("This domain is not a valid Mastodon instance");
    return data;
  } catch (e) {
    console.error(e);
    throw new ClientError(`Could not fetch instance '${api.instance}'`, { cause: e });
  }
}
