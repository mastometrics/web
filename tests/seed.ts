// Demo/test data. Only ever runs against a local database.
import { db } from "~/backend/db";
import type { Prisma } from "~/generated/prisma/client";

export function assertLocalDatabase(url = process.env.DATABASE_URL) {
  const host = url ? new URL(url).hostname : undefined;
  if (!host || !["localhost", "127.0.0.1", "::1", "db", "postgres"].includes(host))
    throw new Error(`Refusing to touch non-local database (${host ?? "DATABASE_URL not set"})`);
}

export async function resetDatabase() {
  assertLocalDatabase();
  await db.$executeRawUnsafe(
    `TRUNCATE "interactions", "cached_accounts", "metrics", "statuses", "users", "accounts", "instances" RESTART IDENTITY CASCADE`
  );
}

const DAY = 24 * 60 * 60 * 1000;

function status(i: number, accountId: number, overrides: Partial<Prisma.StatusUncheckedCreateInput> = {}) {
  const favorites = (i * 7) % 23;
  const boosts = (i * 3) % 11;
  const replies = i % 5;
  const publishedAt = new Date(Date.now() - i * DAY * 0.7);
  const content = i % 4 === 0 ? `@friend@mas.to reply number ${i}` : `Post number ${i} about #mastodon`;
  return {
    statusUri: `https://mas.to/users/demo/statuses/${1000 + i}`,
    url: `https://mas.to/@demo/${1000 + i}`,
    content,
    isReblog: false,
    accountId,
    favoritesCount: favorites,
    boostsCount: boosts,
    repliesCount: replies,
    engagementsCount: favorites + boosts + replies,
    publishedAt,
    raw: {
      content: `<p>${content.replace("#mastodon", '<a href="https://mas.to/tags/mastodon" class="mention hashtag">#mastodon</a>')}</p><script>alert(1)</script>`,
      account: { avatar_static: "https://mas.to/avatars/original/missing.png" },
      media_attachments:
        i === 1
          ? [
              {
                type: "image",
                url: "https://example.com/a.png",
                preview_url: "https://example.com/a-small.png",
                description: "An image",
              },
            ]
          : [],
    },
    ...overrides,
  } satisfies Prisma.StatusUncheckedCreateInput;
}

/** Seeds an instance with two users: an admin (demo@mas.to) and a regular user (other@mas.to) */
export async function seedDatabase() {
  assertLocalDatabase();
  const instance = await db.instance.create({
    data: {
      host: "mas.to",
      name: "mas.to",
      clientId: "client-id",
      clientSecret: "client-secret",
      token: "app-token",
      rawClient: { redirect_uri: "http://localhost:4321/auth/connect?instance=mas.to", scopes: "read" },
    },
  });

  const demo = await db.account.create({
    data: {
      instance: "mas.to",
      username: "demo@mas.to",
      displayName: "Demo Account",
      instanceAccountId: "1",
      followersCount: 1234,
      followingCount: 321,
      statusesCount: 30,
      avatar: "https://mas.to/avatars/original/missing.png",
      tracking: true,
      metadata: {},
    },
  });
  const other = await db.account.create({
    data: {
      instance: "mas.to",
      username: "other@mas.to",
      displayName: "Other Account",
      instanceAccountId: "2",
      followersCount: 10,
      followingCount: 5,
      statusesCount: 2,
      tracking: true,
      metadata: {
        suspendedSync: new Date().toISOString(),
        warnings: [
          { timestamp: new Date().toISOString(), message: "Unable to sync account, authentication token rejected" },
        ],
      },
    },
  });

  const admin = await db.user.create({
    data: { instanceId: instance.id, accountId: demo.id, scopes: "read", token: "secret-user-token", roles: ["admin"] },
  });
  const user = await db.user.create({
    data: { instanceId: instance.id, accountId: other.id, scopes: "read", token: "other-user-token" },
  });

  await db.status.createMany({ data: Array.from({ length: 30 }, (_, i) => status(i + 1, demo.id)) });
  await db.status.create({
    data: status(100, demo.id, { statusUri: "https://mas.to/boost/1", isReblog: true, content: "A boost" }),
  });

  // Daily metrics for the last 14 days
  await db.metric.createMany({
    data: Array.from({ length: 14 }, (_, i) => {
      const timestamp = new Date(Date.now() - (13 - i) * DAY);
      timestamp.setUTCHours(12, 0, 0, 0);
      return {
        accountId: demo.id,
        timestamp,
        followers: 1100 + i * 10,
        following: 300 + i,
        statuses: 16 + i,
        engagements: 100 + i * 15,
        favorites: 60 + i * 10,
        boosts: 30 + i * 4,
        replies: 10 + i,
      };
    }),
  });

  await db.cachedAccount.createMany({
    data: [
      {
        instance: "mas.to",
        username: "fan@mas.to",
        hostInstance: "mas.to",
        instanceAccountId: "10",
        displayName: "Big Fan",
        followersCount: 5000,
      },
      {
        instance: "other.social",
        username: "booster@other.social",
        hostInstance: "mas.to",
        instanceAccountId: "11",
        displayName: "Booster",
      },
    ],
  });
  await db.interaction.createMany({
    data: [
      { accountId: demo.id, username: "fan@mas.to", type: "favorite", instanceAccountId: "10", reach: 0 },
      { accountId: demo.id, username: "fan@mas.to", type: "favorite", instanceAccountId: "10", reach: 0 },
      { accountId: demo.id, username: "fan@mas.to", type: "mention", instanceAccountId: "10", reach: 5000 },
      { accountId: demo.id, username: "booster@other.social", type: "boost", instanceAccountId: "11", reach: 300 },
      { accountId: demo.id, username: "booster@other.social", type: "boost", instanceAccountId: "11", reach: 300 },
      { accountId: demo.id, username: "booster@other.social", type: "boost", instanceAccountId: "11", reach: 300 },
    ],
  });

  return { instance, demo, other, admin, user };
}
