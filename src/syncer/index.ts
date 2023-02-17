import { DOMParser } from "linkedom";
import { Prisma, Account } from "@prisma/client";
import { fetchFollowers, fetchFollowing, fetchStatuses, lookupAccount, MastodonAccount } from "../lib/mastodon";
import { db as prisma, Result, runInConnection } from "../db";
import { ApiOptions } from "~/lib/mastodon/api";
import { parseHandle, formatHandle } from "~/lib/format";

export async function importAccount(handle: string, api?: ApiOptions) {
  return runInConnection(async () => {
    const account = await createOrUpdateAccount(handle, undefined, api);
    const tasks = [];
    if (account.discoverable && !account.noindex) {
      tasks.push(syncStatusus(account, api));
      if (account.followersCount) tasks.push(syncFollowers(account, api));
      if (account.followingCount) tasks.push(syncFollowing(account, api));
      tasks.push(updateUserStats(account));
    }
    await Promise.all(tasks);
    console.log(`Imported ${handle}`);
  });
}

export async function updateOutdatedUsers() {
  return runInConnection(async () => {
    const sinceOneDay = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const sinceOneHour = new Date(Date.now() - 1000 * 60 * 60);
    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { tracking: true, lastIndex: { lt: sinceOneHour } },
          {
            tracking: true,
            Metrics: { none: { date: { gt: sinceOneDay } } },
          },
        ],
      },
      include: { User: true },
    });
    for (const account of accounts) {
      importAccount(account.username, { token: account.User[0]?.token, instance: account.instance, throttle: true });
    }
  });
}

export async function syncAccount(handle: string) {
  return runInConnection(async () => {
    const account = await createOrUpdateAccount(handle);
    const tasks = [];
    if (account.discoverable && !account.noindex) {
      tasks.push(syncStatusus(account));
      if (account.followersCount) tasks.push(syncFollowers(account));
      if (account.followingCount) tasks.push(syncFollowing(account));
      tasks.push(updateUserStats(account));
    }
    await Promise.all(tasks);
    console.log(`Synced ${handle}`);
  });
}

export async function updateUserStats(handle: string): Result<void>;
export async function updateUserStats(account: Account): Result<void>;
export async function updateUserStats(user: Account | string) {
  return runInConnection(async () => {
    const account = typeof user === "string" ? await createOrUpdateAccount(user) : user;
    const aggregates = await prisma.status.aggregate({
      where: { Account: { id: account.id } },
      _sum: { favoritesCount: true, boostsCount: true, repliesCount: true },
    });
    const counts: Prisma.MetricUpdateInput = {
      followers: account.followersCount,
      following: account.followingCount,
      statuses: account.statusesCount,
      favorites: aggregates._sum.favoritesCount,
      boosts: aggregates._sum.boostsCount,
      replies: aggregates._sum.repliesCount,
      engagements: sum(aggregates._sum.favoritesCount, aggregates._sum.boostsCount, aggregates._sum.repliesCount),
    };
    // truncate date to day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`Updating stats for ${account.username} on ${today}`);

    await prisma.metric.upsert({
      where: { accountId_date: { accountId: account.id, date: today }, date: today },
      update: counts,
      create: {
        ...(counts as Prisma.MetricCreateInput),
        Account: { connect: { id: account.id } },
        date: today,
      },
    });
  });
}

export async function createOrUpdateAccount(handle: string, user?: MastodonAccount, api?: ApiOptions) {
  const { username, acct, instance } = parseHandle(handle);

  user ??= await lookupAccount(api ?? { instance }, acct);
  const accountData: Prisma.AccountCreateInput = {
    displayName: user.display_name,
    avatar: user.avatar,
    raw: user as unknown as Prisma.JsonObject,
    statusesCount: user.statuses_count,
    followersCount: user.followers_count,
    followingCount: user.following_count,
    instanceAccountId: user.id,
    bot: user.bot,
    discoverable: user.discoverable,
    noindex: user.noindex,
    locked: user.locked,
    instance,
    username,
  };

  return await prisma.account.upsert({
    where: { username },
    update: accountData,
    create: accountData,
  });
}

async function syncStatusus(account: Account, api?: ApiOptions) {
  const statuses = await fetchStatuses(api ?? { instance: account.instance }, account.instanceAccountId);

  for (const status of statuses) {
    const statusData: Prisma.StatusUpdateInput = {
      boostsCount: status.reblogs_count,
      favoritesCount: status.favourites_count,
      repliesCount: status.replies_count,
      engagementsCount: status.replies_count + status.reblogs_count + status.favourites_count,
      raw: status as unknown as Prisma.JsonObject,
      content: getTextContent(status.content),
      url: status.url,
      publishedAt: new Date(status.created_at),
      isReblog: !!status.reblog,
    };

    await prisma.status.upsert({
      where: { statusUri: status.uri },
      update: statusData,
      create: {
        ...(statusData as Prisma.StatusCreateInput),
        statusUri: status.uri,
        Account: { connect: { id: account.id } },
      },
    });
  }
}

async function syncFollowers(account: Account, api?: ApiOptions) {
  const followers = await fetchFollowers(api ?? { instance: account.instance }, account.instanceAccountId);

  for (const follower of followers)
    await addFollower(account, await createOrUpdateAccount(formatHandle(follower.acct, account.instance), follower));
}

async function syncFollowing(account: Account, api?: ApiOptions) {
  const following = await fetchFollowing(api ?? { instance: account.instance }, account.instanceAccountId);
  for (const follow of following)
    await addFollower(await createOrUpdateAccount(formatHandle(follow.acct, account.instance), follow), account);
}

async function addFollower(account: Account, follower: Account) {
  await prisma.follow.upsert({
    where: { accountId_followingId: { accountId: follower.id, followingId: account.id } },
    update: {},
    create: {
      Account: { connect: { id: follower.id } },
      Following: { connect: { id: account.id } },
    },
  });
}

function getTextContent(content: string) {
  return (
    new DOMParser().parseFromString(`<!doctype html><html lang="en"><body>${content}</body></html>`, "text/html").body
      .textContent || ""
  );
}

function sum(...values: (number | null)[]) {
  return values.reduce((a, b) => ((a as number) + (b || 0)) as number, 0);
}
