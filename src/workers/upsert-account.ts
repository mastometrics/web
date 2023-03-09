import { Prisma } from "@prisma/client";
import { db as prisma } from "~/backend/db";
import { parseHandle } from "~/lib/format";
import { MastodonAccount, mastodonApi } from "~/lib/mastodon/api";
import { ApiOptions } from "~/lib/mastodon/http";

export async function createOrUpdateAccount(handle: string, user?: MastodonAccount, api?: ApiOptions, db = prisma) {
  const { username, acct, instance } = parseHandle(handle);
  user ??= await mastodonApi(api ?? { instance }).accounts.lookup(acct);

  // Sometimes the API returns an authorization error when calling this endpoint
  // authenticated, so we fallback to an unauthenticated call
  user ??= await mastodonApi({ instance }).accounts.get(username);

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

  return await db.account.upsert({
    where: { username },
    update: accountData,
    create: accountData,
  });
}

export async function getOrCreateAccount(handle: string, user?: MastodonAccount, api?: ApiOptions, db = prisma) {
  const { username } = parseHandle(handle);
  const account = await db.account.findUnique({ where: { username } });
  if (account) return account;
  return await createOrUpdateAccount(handle, user, api);
}
