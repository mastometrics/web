import { deleteAccount } from "~/backend/account";
import { db, Prisma, throwOnError } from "~/backend/db";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";
import { mastodonApi } from "~/lib/mastodon/api";
import { type AccountMetadata, readMetadata } from "~/lib/metadata";

/** Data of accounts that revoked access is deleted after this many days, as promised in the privacy policy */
export const PURGE_REVOKED_AFTER_DAYS = 30;

const REJECTED_TOKEN = "authentication token rejected";

export type RevokedAccount = {
  id: number;
  username: string;
  instance: string;
  token: string;
  revokedAt: Date;
  lastSeen: Date;
};

/**
 * Accounts whose instance rejected the token (HTTP 401) more than `days` ago, without a sign in since. Accounts
 * suspended for any other reason (instance down, server errors, ...) are never included.
 */
export async function findRevokedAccounts({ days = PURGE_REVOKED_AFTER_DAYS } = {}) {
  const revokedBefore = new Date(Date.now() - days * 86_400_000);
  const accounts = await db.account.findMany({
    where: { metadata: { path: ["suspendedSync"], not: Prisma.AnyNull } },
    select: {
      id: true,
      username: true,
      instance: true,
      metadata: true,
      User: { select: { token: true, lastSeen: true } },
    },
  });

  const revoked = accounts.flatMap((account): RevokedAccount[] => {
    // The newest warning explains why the account was suspended
    const warning = readMetadata<AccountMetadata>(account.metadata).warnings?.[0];
    const user = account.User[0];
    if (!user || !warning?.message.includes(REJECTED_TOKEN)) return [];
    const revokedAt = new Date(warning.timestamp);
    if (isNaN(revokedAt.valueOf()) || revokedAt > revokedBefore || user.lastSeen > revokedAt) return [];
    return [{ ...account, token: user.token, revokedAt, lastSeen: user.lastSeen }];
  });
  return revoked.sort((a, b) => a.revokedAt.valueOf() - b.revokedAt.valueOf());
}

export type VerifyResult = "revoked" | "valid" | "unknown";

/** Ask the instance whether the token is still rejected. Anything but a 401 means we can't be sure */
export async function verifyRevoked(account: RevokedAccount): Promise<VerifyResult> {
  try {
    await mastodonApi({ instance: account.instance, token: account.token }).accounts.verifyCredentials();
    return "valid";
  } catch (error) {
    return error instanceof HandledError && error.status === 401 ? "revoked" : "unknown";
  }
}

export type PurgeOptions = {
  days?: number;
  /** Check with the instance that the token is still rejected before deleting (default true) */
  verify?: boolean;
  /** At most this many accounts, oldest revocations first */
  limit?: number;
  /** Without this, only report what would be deleted */
  apply?: boolean;
  /** Number of instances checked at the same time */
  concurrency?: number;
};

export type PurgeResult = RevokedAccount & { status: VerifyResult | "unverified"; deleted: boolean };

/** Delete all data of accounts that revoked access to MastoMetrics and didn't sign in again */
export async function purgeRevokedAccounts({
  days,
  verify = true,
  limit,
  apply = false,
  concurrency = 10,
}: PurgeOptions = {}) {
  const accounts = (await findRevokedAccounts({ days })).slice(0, limit);
  const results: PurgeResult[] = [];

  const queue = [...accounts];
  async function next(): Promise<void> {
    const account = queue.shift();
    if (!account) return;
    const status = verify ? await verifyRevoked(account) : "unverified";
    let deleted = false;
    if (apply && (status === "revoked" || status === "unverified")) {
      throwOnError(await deleteAccount(account.username));
      deleted = true;
    }
    results.push({ ...account, status, deleted });
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, accounts.length) }, next));

  if (apply) logger.info(`🧹 Deleted ${results.filter((r) => r.deleted).length} accounts that revoked access`);
  // Checked concurrently, so restore the order
  return results.sort((a, b) => a.revokedAt.valueOf() - b.revokedAt.valueOf());
}
