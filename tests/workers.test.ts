import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, throwOnError } from "~/backend/db";
import { getAuthUrl } from "~/backend/oauth";
import { restartSync } from "~/backend/account";
import { authenticate } from "~/backend/session";
import { type AccountMetadata, readMetadata } from "~/lib/metadata";
import { importAccount } from "~/workers/import-account";
import { purgeRevokedAccounts } from "~/workers/purge-revoked-accounts";
import { requeueStuckSyncs } from "~/workers/requeue-stuck-syncs";
import { syncAccount } from "~/workers/sync-account";
import { syncInteractions } from "~/workers/sync-interactions";
import { updateOutdatedUsers } from "~/workers/sync-outdated-users";
import { mastodonAccount, mastodonStatus, mockMastodon } from "./mastodon-mock";
import { resetDatabase, seedDatabase } from "./seed";

let seeded: Awaited<ReturnType<typeof seedDatabase>>;
beforeEach(async () => {
  await resetDatabase();
  seeded = await seedDatabase();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const notification = (
  id: number,
  type: string,
  account: Record<string, unknown>,
  status?: Record<string, unknown>
) => ({
  id: `${id}`,
  type,
  created_at: new Date().toISOString(),
  account: mastodonAccount(account),
  status,
});

function mockDemoInstance(overrides: Record<string, (url: URL) => unknown> = {}) {
  return mockMastodon({
    "mas.to/api/v1/instance": () => ({ uri: "mas.to", title: "Mastodon" }),
    "mas.to/api/v1/accounts/lookup": () => mastodonAccount(),
    "mas.to/api/v1/accounts/1": () => mastodonAccount(),
    "mas.to/api/v1/accounts/1/statuses": () => [
      mastodonStatus(1, { favourites_count: 100 }),
      mastodonStatus(2),
      mastodonStatus(3, { visibility: "direct", content: "<p>secret</p>" }),
    ],
    "mas.to/api/v1/notifications": (url) =>
      url.searchParams.getAll("types[]").includes("follow")
        ? [notification(50, "follow", { id: "20", acct: "newfan" })]
        : [
            notification(101, "favourite", { id: "20", acct: "newfan", followers_count: 50 }, mastodonStatus(1)),
            notification(
              102,
              "reblog",
              { id: "21", acct: "loud@big.social", followers_count: 9000 },
              mastodonStatus(1)
            ),
            notification(103, "favourite", { id: "22", acct: "hidden", noindex: true }, mastodonStatus(1)),
            notification(
              104,
              "mention",
              { id: "20", acct: "newfan", followers_count: 50 },
              mastodonStatus(9, { visibility: "direct" })
            ),
          ],
    ...overrides,
  });
}

describe("syncAccount", () => {
  it("updates the profile, statuses and metrics using the user token", async () => {
    const { calls } = mockDemoInstance();
    throwOnError(await syncAccount("demo@mas.to"));

    const account = await db.account.findUniqueOrThrow({ where: { username: "demo@mas.to" } });
    expect(account.followersCount).toBe(1300);
    expect(readMetadata<AccountMetadata>(account.metadata).pendingSync).toBeNull();

    const status = await db.status.findUniqueOrThrow({ where: { statusUri: "https://mas.to/users/demo/statuses/1" } });
    expect(status).toMatchObject({ favoritesCount: 100, engagementsCount: 103, content: "Status 1" });
    expect(await db.status.count({ where: { content: "secret" } })).toBe(0);

    const metric = await db.metric.findFirstOrThrow({
      where: { accountId: account.id },
      orderBy: { timestamp: "desc" },
    });
    expect(metric.followers).toBe(1300);

    const authenticated = calls.filter((c) => (c.init?.headers as Record<string, string>)?.Authorization);
    expect(authenticated.length).toBeGreaterThan(0);
    expect((authenticated[0].init!.headers as Record<string, string>).Authorization).toBe("Bearer secret-user-token");
  });

  it("does not sync suspended accounts", async () => {
    mockDemoInstance();
    const [, error] = await syncAccount("other@mas.to", { instance: "mas.to" });
    expect(error?.message).toContain("suspended");
  });

  it("suspends the account when the token is revoked", async () => {
    mockDemoInstance({
      "mas.to/api/v1/accounts/1/statuses": () => new Response("{}", { status: 401, statusText: "Unauthorized" }),
    });
    await syncAccount("demo@mas.to");
    const account = await db.account.findUniqueOrThrow({ where: { username: "demo@mas.to" } });
    expect(readMetadata<AccountMetadata>(account.metadata).suspendedSync).toBeTruthy();
  });
});

describe("syncInteractions", () => {
  it("stores interactions and caches accounts, skipping noindex and direct messages", async () => {
    mockDemoInstance();
    throwOnError(await syncInteractions("demo@mas.to"));

    const interactions = await db.interaction.findMany({
      where: { accountId: seeded.demo.id, statusUri: { not: null } },
    });
    expect(interactions.map((i) => [i.username, i.type, i.reach]).sort()).toEqual([
      ["loud@big.social", "boost", 9000],
      ["newfan@mas.to", "favorite", 0],
    ]);
    expect(await db.cachedAccount.count({ where: { username: "hidden@mas.to" } })).toBe(0);
    expect(
      await db.cachedAccount.findFirst({ where: { username: "loud@big.social", hostInstance: "mas.to" } })
    ).toMatchObject({
      instance: "big.social",
    });

    const account = await db.account.findUniqueOrThrow({ where: { id: seeded.demo.id } });
    expect(readMetadata<AccountMetadata>(account.metadata).maxImportedNotificationId).toBe(104);
  });
});

describe("importAccount", () => {
  it("imports statuses, metrics and interactions for a new account", async () => {
    mockDemoInstance();
    await db.account.update({ where: { id: seeded.demo.id }, data: { tracking: false } });
    await db.metric.deleteMany({});

    expect(throwOnError(await importAccount("demo@mas.to", { instance: "mas.to", token: "secret-user-token" }))).toBe(
      true
    );

    const account = await db.account.findUniqueOrThrow({ where: { id: seeded.demo.id } });
    expect(account.tracking).toBe(true);
    expect(readMetadata<AccountMetadata>(account.metadata).pendingImport).toBeUndefined();
    expect(await db.metric.count({ where: { accountId: account.id } })).toBeGreaterThan(1);
  });

  it("does not start a second import while one is running", async () => {
    mockDemoInstance();
    await db.account.update({
      where: { id: seeded.demo.id },
      data: { metadata: { pendingImport: new Date().toISOString() } },
    });
    expect(throwOnError(await importAccount("demo@mas.to", { instance: "mas.to" }))).toBe(false);
  });
});

describe("scheduled jobs", () => {
  it("syncs outdated accounts only", async () => {
    mockDemoInstance();
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await db.$executeRaw`UPDATE accounts SET "lastIndex" = ${old}`;
    await db.metric.deleteMany({});

    await updateOutdatedUsers();

    const [demo, other] = await Promise.all([
      db.account.findUniqueOrThrow({ where: { username: "demo@mas.to" } }),
      db.account.findUniqueOrThrow({ where: { username: "other@mas.to" } }),
    ]);
    expect(demo.lastIndex.getTime()).toBeGreaterThan(old.getTime());
    // suspended accounts are skipped
    expect(other.lastIndex.getTime()).toBe(old.getTime());
  });

  it("requeues syncs that are stuck", async () => {
    const stuck = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await db.account.update({ where: { id: seeded.demo.id }, data: { metadata: { pendingSync: stuck } } });
    await requeueStuckSyncs();
    const account = await db.account.findUniqueOrThrow({ where: { id: seeded.demo.id } });
    expect(readMetadata<AccountMetadata>(account.metadata).pendingSync).toBeNull();
  });
});

describe("sign in", () => {
  it("registers an app on new instances and builds the authorize url", async () => {
    const { calls } = mockMastodon({
      "fosstodon.org/api/v1/instance": () => ({ uri: "fosstodon.org", title: "Fosstodon" }),
      "fosstodon.org/api/v1/apps": (_, init) => ({
        client_id: "cid",
        client_secret: "csecret",
        redirect_uri: JSON.parse(init!.body as string).redirect_uris,
      }),
      "fosstodon.org/oauth/token": () => ({ access_token: "app-token", scope: "read" }),
    });
    const url = new URL(await getAuthUrl("fosstodon.org", "https://metrics.example.com", { state: "s" }));
    expect(url.origin).toBe("https://fosstodon.org");
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://metrics.example.com/auth/connect?instance=fosstodon.org"
    );
    expect(url.searchParams.get("scope")).toBe("read");
    expect(url.searchParams.get("state")).toBe("s");

    const appRegistration = JSON.parse(calls.find((c) => c.url.endsWith("/api/v1/apps"))!.init!.body as string);
    expect(appRegistration).toMatchObject({ client_name: "MastoMetrics", scopes: "read" });

    // The app is reused for the same redirect uri
    await getAuthUrl("fosstodon.org", "https://metrics.example.com", { state: "s" });
    expect(calls.filter((c) => c.url.endsWith("/api/v1/apps"))).toHaveLength(1);
  });

  it("rejects domains that are not mastodon instances", async () => {
    mockMastodon({});
    await expect(getAuthUrl("example.com", "https://metrics.example.com", { state: "s" })).rejects.toThrow(
      /Could not fetch instance/
    );
  });

  it("creates new users and refreshes tokens of existing users", async () => {
    const instance = await db.instance.findUniqueOrThrow({ where: { host: "mas.to" } });
    const token = { access_token: "new-token", scope: "read", token_type: "Bearer", created_at: 0 };

    const existing = throwOnError(await authenticate({ authAccount: mastodonAccount() as any, token, instance }));
    expect(existing.id).toBe(seeded.admin.id);
    expect((await db.user.findUniqueOrThrow({ where: { id: existing.id } })).token).toBe("new-token");

    const created = throwOnError(
      await authenticate({ authAccount: mastodonAccount({ id: "99", username: "newbie" }) as any, token, instance })
    );
    expect(created.Account.username).toBe("newbie@mas.to");
    expect(await db.user.count()).toBe(3);
  });
});

describe("restartSync", () => {
  const suspendDemo = () =>
    db.account.update({
      where: { username: "demo@mas.to" },
      data: {
        metadata: {
          suspendedSync: new Date().toISOString(),
          warnings: Array.from({ length: 12 }, () => ({ timestamp: new Date().toISOString(), message: "Bad Gateway" })),
        },
      },
    });
  const demoMetadata = async () =>
    readMetadata<AccountMetadata>(
      (await db.account.findUniqueOrThrow({ where: { username: "demo@mas.to" } })).metadata
    );

  it("resumes and syncs a suspended account", async () => {
    await suspendDemo();
    mockDemoInstance();
    expect(await restartSync("demo@mas.to")).toEqual({});
    const metadata = await demoMetadata();
    expect(metadata.suspendedSync).toBeUndefined();
    expect(metadata.warnings).toEqual([]);
    expect(await db.status.count({ where: { content: "Status 1" } })).toBe(1);
  });

  it("keeps retrying in the background when the instance has trouble", async () => {
    await suspendDemo();
    mockDemoInstance({
      "mas.to/api/v1/accounts/1/statuses": () => new Response("{}", { status: 502, statusText: "Bad Gateway" }),
    });
    expect((await restartSync("demo@mas.to")).error).toContain("Bad Gateway");
    const metadata = await demoMetadata();
    expect(metadata.suspendedSync).toBeUndefined();
    expect(metadata.warnings).toHaveLength(1);
  });

  it("asks to sign in again when the token is rejected", async () => {
    await suspendDemo();
    mockDemoInstance({
      "mas.to/api/v1/accounts/1/statuses": () => new Response("{}", { status: 401, statusText: "Unauthorized" }),
    });
    await expect(restartSync("demo@mas.to")).rejects.toThrow(/Sign out and in again/);
    expect((await demoMetadata()).suspendedSync).toBeTruthy();
  });
});

describe("syncAccount warnings", () => {
  it("records exactly one warning per failed sync and none for skipped accounts", async () => {
    mockDemoInstance({
      "mas.to/api/v1/accounts/1/statuses": () => new Response("{}", { status: 500, statusText: "Server Error" }),
    });
    await syncAccount("demo@mas.to");
    let account = await db.account.findUniqueOrThrow({ where: { username: "demo@mas.to" } });
    expect(readMetadata<AccountMetadata>(account.metadata).warnings).toHaveLength(1);
    expect(readMetadata<AccountMetadata>(account.metadata).pendingSync).toBeNull();

    await db.account.update({
      where: { id: account.id },
      data: { metadata: { pendingImport: new Date().toISOString() } },
    });
    const [, error] = await syncAccount("demo@mas.to");
    expect(error?.message).toContain("pending import");
    account = await db.account.findUniqueOrThrow({ where: { username: "demo@mas.to" } });
    expect(readMetadata<AccountMetadata>(account.metadata).warnings).toBeUndefined();
  });
});

describe("purgeRevokedAccounts", () => {
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
  /** Suspend the demo account with the given newest warning, like handleAccountSyncingError does */
  async function suspendDemo(message: string, warnedDaysAgo: number, seenDaysAgo: number) {
    await db.account.update({
      where: { username: "demo@mas.to" },
      data: {
        metadata: {
          suspendedSync: daysAgo(warnedDaysAgo).toISOString(),
          warnings: [{ timestamp: daysAgo(warnedDaysAgo).toISOString(), message }],
        },
      },
    });
    await db.user.update({ where: { id: seeded.admin.id }, data: { lastSeen: daysAgo(seenDaysAgo) } });
  }
  const revoked = "Unable to sync account, authentication token rejected (Unauthorized request to mas.to)";
  const verifyResponds = (status: number) =>
    mockDemoInstance({
      "mas.to/api/v1/accounts/verify_credentials": () =>
        status === 200 ? mastodonAccount() : new Response("{}", { status, statusText: "Error" }),
    });
  const demoExists = async () => (await db.account.count({ where: { username: "demo@mas.to" } })) === 1;

  it("only reports without --apply", async () => {
    await suspendDemo(revoked, 40, 60);
    verifyResponds(401);
    const results = await purgeRevokedAccounts();
    expect(results.map((r) => [r.username, r.status, r.deleted])).toEqual([["demo@mas.to", "revoked", false]]);
    expect(await demoExists()).toBe(true);
  });

  it("deletes accounts whose token is still rejected after 30 days", async () => {
    await suspendDemo(revoked, 40, 60);
    verifyResponds(401);
    await purgeRevokedAccounts({ apply: true });
    expect(await demoExists()).toBe(false);
    expect(await db.interaction.count()).toBe(0);
    // Other accounts are untouched, the seeded other@mas.to was only revoked just now
    expect(await db.account.count({ where: { username: "other@mas.to" } })).toBe(1);
  });

  it("keeps accounts that were revoked recently, signed in since, or failed for other reasons", async () => {
    verifyResponds(401);
    await suspendDemo(revoked, 10, 60);
    expect(await purgeRevokedAccounts({ apply: true })).toEqual([]);
    await suspendDemo(revoked, 40, 5);
    expect(await purgeRevokedAccounts({ apply: true })).toEqual([]);
    await suspendDemo("Suspending after too many import warnings, Bad Gateway", 40, 60);
    expect(await purgeRevokedAccounts({ apply: true })).toEqual([]);
    expect(await demoExists()).toBe(true);
  });

  it("keeps accounts when the instance doesn't confirm the revocation", async () => {
    await suspendDemo(revoked, 40, 60);
    verifyResponds(200);
    expect((await purgeRevokedAccounts({ apply: true }))[0]).toMatchObject({ status: "valid", deleted: false });
    verifyResponds(503);
    expect((await purgeRevokedAccounts({ apply: true }))[0]).toMatchObject({ status: "unknown", deleted: false });
    expect(await demoExists()).toBe(true);
  });
});
