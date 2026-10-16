import { createHmac, timingSafeEqual } from "node:crypto";
import type { Instance } from "~/generated/prisma/client";
import type { MastodonAccessToken, MastodonAuthenticatedAccount } from "~/lib/mastodon/api";
import type { AuthenticatedUser } from "~/backend/authentication";
import { createOrUpdateAccount } from "~/workers/upsert-account";
import { db, useDatabase } from "./db";
import type { Roles } from "~/lib/permissions";
import { logger } from "~/lib/logger";
import { config } from "~/lib/config";

export const SESSION_COOKIE = "mm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type AuthenticationData = {
  token: MastodonAccessToken;
  authAccount: MastodonAuthenticatedAccount;
  instance: Instance;
};

export async function authenticate({ authAccount, token, instance }: AuthenticationData) {
  return useDatabase(async (db) => {
    if (!authAccount?.username) throw new Error("Missing username");
    const username = `${authAccount.username}@${instance.host}`;
    let account = await db.account.findUnique({ where: { username } });
    if (!account) {
      account = await createOrUpdateAccount(username, authAccount, { instance: instance.host }, db);
      logger.info(`🔥 New signup: ${username}`);
    }

    return db.user.upsert({
      where: { accountId: account.id },
      update: {
        token: token.access_token,
        scopes: token.scope,
        lastSeen: new Date(),
      },
      create: {
        token: token.access_token,
        scopes: token.scope,
        Account: { connect: { id: account.id } },
        instance: { connect: { id: instance.id } },
      },
      include: { Account: true },
    });
  });
}

function sign(value: string, secret = config.sessionSecret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

/** Create a signed session cookie value for the given user id */
export function createSessionValue(userId: string | number, secret?: string) {
  const payload = Buffer.from(JSON.stringify({ userId: `${userId}` })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the user id from a signed session cookie value, or null when missing or tampered with */
export function readSessionValue(value: string | undefined | null, secret?: string): string | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const { userId } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof userId === "string" && userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}

/** Resolve a user from a session user id. Returns null if the user no longer exists */
export async function getUserById(userId: string | null): Promise<AuthenticatedUser | null> {
  if (!userId || isNaN(+userId)) return null;
  const user = await db.user.findUnique({ where: { id: +userId }, include: { Account: true } });
  if (!user) return null;
  return {
    id: user.id,
    account: user.Account,
    roles: (user.roles as Roles[]) || [],
  };
}
