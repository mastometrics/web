import { Prisma } from "~/generated/prisma/client";
import { type MastodonAccount, mastodonApi, type MastodonNotification } from "../lib/mastodon/api";
import { useDatabase } from "../backend/db";
import { parseHandle } from "~/lib/format";
import { getOrCreateAccount } from "./upsert-account";
import { logger } from "~/lib/logger";
import { getTextContent } from "~/lib/mastodon/html.server";
import { type AccountMetadata, readMetadata, setMetadata } from "~/lib/metadata";
import { type ApiOptions } from "~/lib/mastodon/http";

type InteractionType = "favorite" | "mention" | "boost";
const notificationTypeToInteractionType: Record<string, InteractionType> = {
  favourite: "favorite",
  mention: "mention",
  reblog: "boost",
};

const supportedNotifications: MastodonNotification["type"][] = ["favourite", "mention", "reblog"];

export async function syncInteractions(handle: string, apiConfig?: ApiOptions) {
  return useDatabase(async (db) => {
    logger.debug(`🔔 Parsing interactions from notifications for ${handle}`);
    const account = await getOrCreateAccount(handle, undefined, undefined, db);
    const homeInstance = account.instance;

    if (!apiConfig) {
      const user = await db.user.findFirstOrThrow({ where: { Account: { id: account.id } } });
      apiConfig = { token: user.token, instance: homeInstance, throttle: true };
    }

    const minNotificationId = readMetadata<AccountMetadata>(account.metadata)?.maxImportedNotificationId;
    let maxNotificationId = minNotificationId ?? 0;

    const notifications = mastodonApi(apiConfig).notifications.list(
      { types: supportedNotifications, sinceId: minNotificationId },
      { limit: 30 * 150 }
    );

    let notificationAccounts = new Map<string, MastodonAccount>();
    let interactions: Prisma.InteractionCreateManyInput[] = [];

    for await (const notification of notifications) {
      // Use notification ids to track duplicates and stop importing when we reach the last imported notification
      if (minNotificationId && +notification.id < minNotificationId) break;
      if (+notification.id > maxNotificationId) maxNotificationId = +notification.id;

      if (notification.status?.visibility === "direct") continue;
      if (notification.account.noindex) continue;

      if (!supportedNotifications.includes(notification.type)) continue;

      const { username } = parseHandle(notification.account.acct, homeInstance);

      let reach = 0;
      if (
        notification.type === "reblog" ||
        (notification.type === "mention" && !getTextContent(notification.status?.content ?? "")?.startsWith("@"))
      )
        reach = maxInt4(notification.account.followers_count);

      let interaction: Prisma.InteractionCreateManyInput = {
        accountId: account.id,
        timestamp: new Date(),
        type: notificationTypeToInteractionType[notification.type],
        instanceAccountId: notification.account.id,
        statusUri: notification.status?.uri,
        reach,
        username,
      };
      notificationAccounts.set(username, notification.account);
      interactions.push(interaction);
    }

    const inserted = await db.interaction.createMany({ data: interactions, skipDuplicates: true });

    logger.debug(`🆕 Inserted ${inserted.count} interactions for ${handle}`);

    // Update metadata
    const metadata = setMetadata(account.metadata, { maxImportedNotificationId: maxNotificationId ?? 1 });
    await db.account.update({ where: { id: account.id }, data: { metadata } });

    const notificationAccountUsernames = Array.from(notificationAccounts.keys());
    const existingAccounts = await db.cachedAccount.findMany({
      where: { username: { in: notificationAccountUsernames }, hostInstance: homeInstance },
      select: { username: true, lastIndex: true, id: true },
    });

    let createCachedAccounts: Prisma.CachedAccountCreateManyInput[] = [];
    let updateCachedAccounts: { data: Prisma.CachedAccountUpdateInput; where: Prisma.CachedAccountWhereUniqueInput }[] =
      [];

    const updateAccountsAfter = new Date();
    updateAccountsAfter.setDate(updateAccountsAfter.getDate() - 2);

    for (const [username, notifcationAccount] of notificationAccounts) {
      const existingAccount = existingAccounts.find((a) => a.username === username);

      const data = {
        avatar: notifcationAccount.avatar,
        displayName: notifcationAccount.display_name,
        followersCount: maxInt4(notifcationAccount.followers_count),
        followingCount: maxInt4(notifcationAccount.following_count),
        statusesCount: maxInt4(notifcationAccount.statuses_count),
      };
      if (existingAccount && existingAccount.lastIndex < updateAccountsAfter) {
        updateCachedAccounts.push({
          where: { id: existingAccount.id },
          data,
        });
      } else if (existingAccount) continue;
      else {
        const { instance } = parseHandle(username);
        createCachedAccounts.push({
          instance,
          hostInstance: homeInstance,
          instanceAccountId: notifcationAccount.id,
          username,
          ...data,
        });
      }
    }

    if (createCachedAccounts.length > 0) {
      await db.cachedAccount.createMany({ data: createCachedAccounts, skipDuplicates: true });
      logger.debug(`🔃 Created ${createCachedAccounts.length} cached accounts for ${handle}`);
    }

    if (updateCachedAccounts.length > 0) {
      // One at a time, see syncStatuses
      for (const update of updateCachedAccounts) await db.cachedAccount.update(update);
      logger.debug(`🔃 Updated ${updateCachedAccounts.length} cached accounts for ${handle}`);
    }
  });
}

function maxInt4(number: number) {
  return Math.min(number, 2147483647);
}
