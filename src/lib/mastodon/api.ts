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
      lookup: async (username: string) =>
        (await http.fetch<MastodonAccount>(`accounts/lookup?acct=${username}`, api)).data,
      followers: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonAccount>(`accounts/${params.id}/followers?${limit(80, opts)}`, api, opts),
      following: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonAccount>(`accounts/${params.id}/following?${limit(80, opts)}`, api, opts),
      statuses: (params: { id: string }, opts?: paginateOpts) =>
        http.paginate<MastodonStatus>(`accounts/${params.id}/statuses?${limit(40, opts)}`, api, opts),
    },
    notifications: {
      list: ({ types }: { types: MastodonNotification["type"][] } = { types: [] }, opts?: paginateOpts) =>
        http.paginate<MastodonNotification>(
          `notifications?types[]=${types.join("&types[]=")}&${limit(30, opts)}`,
          api,
          opts
        ),
    },
  };
}

function limit(max: number, { limit }: paginateOpts = {}) {
  return limit ? `limit=${Math.min(limit, max)}` : `limit=${max}`;
}

async function fetchInstance(api: ApiOptions) {
  try {
    const { data } = await fetchApi<MastodonInstance>(`instance`, api);
    if (!data.uri || !data.title) throw new Error("This domain is not a valid Mastodon instance");
    return data;
  } catch (e) {
    throw new Error(`Could not fetch instance '${api.instance}'`, { cause: e });
  }
}
