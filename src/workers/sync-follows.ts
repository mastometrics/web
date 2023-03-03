import { Account } from "@prisma/client";
import { runInConnection } from "~/backend/db";
import { formatHandle } from "~/lib/format";
import { mastodonApi } from "~/lib/mastodon/api";
import { ApiOptions } from "~/lib/mastodon/http";
import { createOrUpdateAccount } from "./upsert-account";

export async function syncFollowers(account: Account, api: ApiOptions = { instance: account.instance }) {
  const followers = mastodonApi(api).accounts.followers({ id: account.instanceAccountId }, { limit: 80 });
  for await (const follower of followers)
    await addFollower(account, await createOrUpdateAccount(formatHandle(follower.acct, account.instance), follower));
}

export async function syncFollowing(account: Account, api: ApiOptions = { instance: account.instance }) {
  const following = mastodonApi(api).accounts.following({ id: account.instanceAccountId }, { limit: 80 });
  for await (const follow of following)
    await addFollower(await createOrUpdateAccount(formatHandle(follow.acct, account.instance), follow), account);
}

export async function addFollower(account: Account, follower: Account) {
  runInConnection(async (db) => {
    await db.follow.upsert({
      where: { accountId_followingId: { accountId: follower.id, followingId: account.id } },
      update: {},
      create: {
        Account: { connect: { id: follower.id } },
        Following: { connect: { id: account.id } },
      },
    });
  });
}
