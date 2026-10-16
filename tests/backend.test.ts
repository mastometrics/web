import { beforeEach, describe, expect, it } from "vitest";
import { accountExists, deleteAccount, handleAccountSyncingError } from "~/backend/account";
import { db, isDatabaseError, poolOptions, Prisma, throwOnError } from "~/backend/db";
import { getAccountMetrics } from "~/backend/metrics";
import { getTopPeople } from "~/backend/people";
import { getUserById } from "~/backend/session";
import { getStatuses } from "~/backend/statuses";
import { getTotalUserCount, listUsers } from "~/backend/users";
import { HandledError } from "~/lib/error";
import { type AccountMetadata, readMetadata } from "~/lib/metadata";
import { resetDatabase, seedDatabase } from "./seed";

let seeded: Awaited<ReturnType<typeof seedDatabase>>;
beforeEach(async () => {
  await resetDatabase();
  seeded = await seedDatabase();
});

describe("statuses", () => {
  it("returns top posts without replies and boosts, paginated", async () => {
    const result = throwOnError(await getStatuses("demo@mas.to", { period: "all", order: "engagements" }));
    expect(result.statuses).toHaveLength(10);
    expect(result.hasMore).toBe(true);
    const engagements = result.statuses.map((s) => s.favoritesCount! + s.boostsCount! + s.repliesCount!);
    expect([...engagements].sort((a, b) => b - a)).toEqual(engagements);
    expect(result.statuses.some((s) => s.html.includes("reply number"))).toBe(false);
    expect(result.statuses.some((s) => s.html.includes("A boost"))).toBe(false);
  });

  it("sanitizes status html and exposes media", async () => {
    const result = throwOnError(
      await getStatuses("demo@mas.to", { period: "all", order: "publishedAt", query: "Post number 1 " })
    );
    const status = result.statuses[0];
    expect(status.html).toContain("Post number 1 about");
    expect(status.html).not.toContain("<script>");
    expect(status.images).toEqual([
      { url: "https://example.com/a.png", previewUrl: "https://example.com/a-small.png", description: "An image" },
    ]);
  });

  it("includes replies, searches, filters by period and skips", async () => {
    const all = throwOnError(
      await getStatuses("demo@mas.to", { period: "all", order: "publishedAt", includeReplies: true, limit: 100 })
    );
    expect(all.statuses).toHaveLength(30);
    expect(all.hasMore).toBe(false);

    const search = throwOnError(
      await getStatuses("demo@mas.to", { period: "all", order: "publishedAt", includeReplies: true, query: "REPLY" })
    );
    expect(search.statuses).toHaveLength(7);

    const week = throwOnError(await getStatuses("demo@mas.to", { period: "7d", order: "publishedAt", limit: 100 }));
    expect(week.statuses.every((s) => s.publishedAt.getTime() > Date.now() - 7 * 24 * 3600 * 1000)).toBe(true);

    const page2 = throwOnError(await getStatuses("demo@mas.to", { period: "all", order: "publishedAt", skip: 20 }));
    expect(page2.statuses).toHaveLength(3);
  });

  it("returns nothing for other accounts", async () => {
    const result = throwOnError(await getStatuses("other@mas.to", { period: "all", order: "engagements" }));
    expect(result.statuses).toEqual([]);
  });
});

describe("metrics", () => {
  it("aggregates metrics per day", async () => {
    const { metrics } = await getAccountMetrics("demo@mas.to", { period: "30d", utcOffset: 0 });
    expect(metrics).toHaveLength(14);
    expect(metrics.at(-1)!.followers).toBe(1230);
    expect(metrics[0].followers).toBe(1100);
    expect(metrics[0].date < metrics.at(-1)!.date).toBe(true);
  });

  it("respects the period", async () => {
    const { metrics } = await getAccountMetrics("demo@mas.to", { period: "7d", utcOffset: 0 });
    expect(metrics.length).toBeLessThanOrEqual(8);
    expect(metrics.length).toBeGreaterThanOrEqual(6);
  });
});

describe("people", () => {
  it("ranks people by reach and joins cached accounts", async () => {
    const people = await getTopPeople(seeded.demo.id, { order: "reach" });
    expect(people.map((p) => p.username)).toEqual(["fan@mas.to", "booster@other.social"]);
    expect(people[0]).toMatchObject({
      interactions: 3,
      favorites: 2,
      mentions: 1,
      reach: 5000,
      displayName: "Big Fan",
    });
    expect(people[1]).toMatchObject({ boosts: 3, reach: 900 });
  });

  it("orders by boosts and ignores unknown order keys", async () => {
    expect((await getTopPeople(seeded.demo.id, { order: "boosts" }))[0].username).toBe("booster@other.social");
    const injected = await getTopPeople(seeded.demo.id, { order: "reach; DROP TABLE users" as any });
    expect(injected).toHaveLength(2);
    expect(await db.user.count()).toBe(2);
  });
});

describe("users", () => {
  it("lists users without exposing tokens or raw api data", async () => {
    const result = throwOnError(await listUsers({}));
    expect(result.users).toHaveLength(2);
    for (const user of result.users) {
      expect(user).not.toHaveProperty("token");
      expect(user.Account).not.toHaveProperty("raw");
    }
    expect(await getTotalUserCount()).toBe(2);
  });

  it("filters suspended users and searches", async () => {
    const suspended = throwOnError(await listUsers({ filters: ["suspended"] }));
    expect(suspended.users.map((u) => u.Account.username)).toEqual(["other@mas.to"]);
    const search = throwOnError(await listUsers({ query: "demo" }));
    expect(search.users.map((u) => u.Account.username)).toEqual(["demo@mas.to"]);
  });

  it("sorts by follower count", async () => {
    const result = throwOnError(await listUsers({ order: "followerCount", dir: "asc" }));
    expect(result.users.map((u) => u.Account.followersCount)).toEqual([10, 1234]);
  });

  it("resolves session users with roles", async () => {
    const admin = await getUserById(`${seeded.admin.id}`);
    expect(admin).toMatchObject({ id: seeded.admin.id, roles: ["admin"], account: { username: "demo@mas.to" } });
    expect(await getUserById("999999")).toBeNull();
    expect(await getUserById("not-a-number")).toBeNull();
  });
});

describe("accounts", () => {
  it("checks existence and deletes accounts with all their data", async () => {
    expect(await accountExists("other@mas.to")).toBe(true);
    throwOnError(await deleteAccount("other@mas.to"));
    expect(await accountExists("other@mas.to")).toBe(false);
    expect(await db.user.count()).toBe(1);
  });

  it("refuses to delete unknown accounts", async () => {
    const [, error] = await deleteAccount("nobody@mas.to");
    expect(error?.status).toBe(404);
  });

  it("suspends syncing when the token is rejected", async () => {
    await handleAccountSyncingError(seeded.demo, new HandledError("Unauthorized", { status: 401 }), db);
    const account = await db.account.findUniqueOrThrow({ where: { id: seeded.demo.id } });
    const metadata = readMetadata<AccountMetadata>(account.metadata);
    expect(metadata.suspendedSync).toBeTruthy();
    expect(metadata.warnings?.[0].message).toContain("token rejected");
  });

  it("logs warnings and caps them", async () => {
    let account = seeded.demo;
    for (let i = 0; i < 20; i++)
      account = await handleAccountSyncingError(account, new HandledError(`Failure ${i}`), db);
    const metadata = readMetadata<AccountMetadata>(account.metadata);
    expect(metadata.warnings!.length).toBeLessThanOrEqual(16);
    // Many failures within 24 hours suspend the account
    expect(metadata.suspendedSync).toBeTruthy();
  });

  it("doesn't count database errors towards suspension", async () => {
    const timeout = new Prisma.PrismaClientKnownRequestError("Unable to start a transaction in the given time", {
      code: "P2028",
      clientVersion: Prisma.prismaVersion.client,
    });
    let account = seeded.demo;
    for (let i = 0; i < 20; i++)
      account = await handleAccountSyncingError(
        account,
        new HandledError("A known database error occurred (P2028)", { cause: timeout }),
        db
      );
    const metadata = readMetadata<AccountMetadata>(account.metadata);
    expect(metadata.warnings ?? []).toHaveLength(0);
    expect(metadata.suspendedSync).toBeFalsy();
  });
});

describe("database", () => {
  it("recognises database errors", () => {
    expect(isDatabaseError(new Error("timeout exceeded when trying to connect"))).toBe(true);
    expect(
      isDatabaseError(new HandledError("Wrapped", { cause: new Error("Connection terminated unexpectedly") }))
    ).toBe(true);
    expect(isDatabaseError(new HandledError("Unauthorized", { status: 401 }))).toBe(false);
    expect(isDatabaseError("nope")).toBe(false);
  });

  it("reads the pool options from the connection string", () => {
    expect(poolOptions("postgresql://u:p@localhost/db")).toEqual({ max: 10, connectionTimeoutMillis: 30_000 });
    expect(poolOptions("postgresql://u:p@localhost/db?connection_limit=25&pool_timeout=0")).toEqual({
      max: 25,
      connectionTimeoutMillis: 0,
    });
    expect(poolOptions("postgresql://u:p@localhost/db?connection_limit=x&pool_timeout=-1")).toEqual({
      max: 10,
      connectionTimeoutMillis: 30_000,
    });
  });

  it("connects with prisma style pool parameters in the connection string", async () => {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("~/generated/prisma/client");
    const connectionString = `${process.env.DATABASE_URL}${process.env.DATABASE_URL!.includes("?") ? "&" : "?"}connection_limit=2&pool_timeout=5`;
    const client = new PrismaClient({ adapter: new PrismaPg({ connectionString, ...poolOptions(connectionString) }) });
    try {
      expect(await client.account.count()).toBeGreaterThan(0);
    } finally {
      await client.$disconnect();
    }
  });
});
