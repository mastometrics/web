// Minimal fake Mastodon API, installed by replacing global fetch
import { vi } from "vitest";

type Route = (url: URL, init?: RequestInit) => unknown | Response;

export function mockMastodon(routes: Record<string, Route>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    calls.push({ url: url.href, init });
    const key = Object.keys(routes).find((pattern) => `${url.host}${url.pathname}`.match(new RegExp(`^${pattern}$`)));
    if (!key) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    const result = routes[key](url, init);
    if (result instanceof Response) return result;
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

export function mastodonAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    username: "demo",
    acct: "demo",
    display_name: "Demo Account",
    locked: false,
    bot: false,
    discoverable: true,
    noindex: false,
    avatar: "https://mas.to/avatar.png",
    avatar_static: "https://mas.to/avatar.png",
    header: "",
    note: "",
    url: "https://mas.to/@demo",
    followers_count: 1300,
    following_count: 330,
    statuses_count: 31,
    emojis: [],
    fields: [],
    ...overrides,
  };
}

export function mastodonStatus(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `${id}`,
    uri: `https://mas.to/users/demo/statuses/${id}`,
    url: `https://mas.to/@demo/${id}`,
    created_at: new Date(Date.now() - id * 60_000).toISOString(),
    visibility: "public",
    content: `<p>Status ${id}</p>`,
    replies_count: 1,
    reblogs_count: 2,
    favourites_count: 3,
    account: mastodonAccount(),
    media_attachments: [],
    mentions: [],
    tags: [],
    emojis: [],
    ...overrides,
  };
}
