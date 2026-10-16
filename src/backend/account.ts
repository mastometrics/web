import type { Account } from "~/generated/prisma/client";
import { PrismaClient } from "~/generated/prisma/client";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";
import { mastodonApi } from "~/lib/mastodon/api";
import { type AccountMetadata, readMetadata, setMetadata } from "~/lib/metadata";
import { MAX_WARNINGS_LOGGED, SUSPEND_IMPORT_AFTER_WARNINGS } from "~/lib/config";
import { importAccount } from "~/workers/import-account";
import { db, isDatabaseError, useDatabase, throwOnError } from "./db";
import { syncAccount } from "../workers/sync-account";
export { syncAccount };

export const getFullAccount = async (handle: string) =>
  useDatabase(async (db) => {
    const account = await db.account.findUnique({ where: { username: handle } });

    return {
      id: account?.id,
      account,
    };
  });

export const startTracking = async (handle: string) => {
  const account = await db.account.findUnique({ where: { username: handle } });
  if (!account) throw new HandledError("Account not found", { status: 404 });
  throwOnError(await importAccount(handle, { instance: account.instance }));
  return true;
};

/**
 * Resume syncing a suspended account and sync it right away, so the user knows whether it works again. When the sync
 * fails for another reason than a rejected token, the worker keeps retrying it.
 */
export async function restartSync(handle: string): Promise<{ error?: string }> {
  const account = await db.account.findUnique({ where: { username: handle } });
  if (!account) throw new HandledError("Account not found", { status: 404 });
  // Clear the warnings as well, otherwise the next failure suspends the account straight away
  const metadata = setMetadata<AccountMetadata>(account.metadata, { suspendedSync: undefined, warnings: [] });
  await db.account.update({ where: { id: account.id }, data: { metadata } });

  const [, error] = await syncAccount(handle);
  if (!error) return {};

  const current = await db.account.findUniqueOrThrow({ where: { id: account.id } });
  if (readMetadata<AccountMetadata>(current.metadata).suspendedSync)
    throw new HandledError(
      `${account.instance} didn't accept MastoMetrics' access to your account. Sign out and in again, then restart syncing.`,
      { status: 401 }
    );
  return { error: error.message };
}

export async function handleAccountSyncingError(
  account: Account,
  error: unknown | Error | HandledError,
  db: PrismaClient
) {
  let metadata = setMetadata<AccountMetadata>(account.metadata, { pendingImport: undefined });
  metadata.warnings ??= [];

  // Database trouble is not the account's fault, it's retried with the next sync instead of counting towards suspension
  if (isDatabaseError(error)) logger.warn(`💾 Database error while syncing ${account.username}, retrying later`);
  else if (error instanceof HandledError && error.status === 401) {
    metadata.suspendedSync ??= new Date().toISOString();
    metadata.warnings.unshift({
      timestamp: new Date().toISOString(),
      message: `Unable to sync account, authentication token rejected (${error.message})`,
    });
  } else if (
    metadata.warnings.length > SUSPEND_IMPORT_AFTER_WARNINGS &&
    new Date(metadata.warnings.at(SUSPEND_IMPORT_AFTER_WARNINGS - 1)!.timestamp).valueOf() + 1000 * 60 * 60 * 24 >
      new Date().valueOf()
  ) {
    metadata.suspendedSync ??= new Date().toISOString();
    metadata.warnings.unshift({
      timestamp: new Date().toISOString(),
      message: `Suspending after too many import warnings, ${
        error instanceof HandledError ? error.message : "Unhandled error"
      }`,
    });
  } else
    metadata.warnings.unshift({
      timestamp: new Date().toISOString(),
      message: `Import failed, ${error instanceof HandledError ? error.message : "Unhandled error"}`,
    });

  if (metadata.warnings.length > MAX_WARNINGS_LOGGED)
    metadata.warnings = metadata.warnings.slice(0, MAX_WARNINGS_LOGGED);

  return await db.account.update({ where: { id: account.id }, data: { metadata } });
}

export async function accountExists(handle: string) {
  return throwOnError(
    await useDatabase(async (db) => {
      const account = await db.account.findUnique({ where: { username: handle } });
      return !!account;
    })
  );
}

export async function deleteAccount(handle: string) {
  return useDatabase(async (db) => {
    const account = await db.account.findUnique({ where: { username: handle } });
    if (!account) throw new HandledError("Account not found", { status: 404 });
    let deleted = false;
    try {
      await db.account.delete({ where: { id: account.id } });
      deleted = true;
    } catch (error) {
      throw new HandledError("Unable to delete account", { status: 500 });
    } finally {
      if (deleted) logger.info(`💔 Deleted account ${handle}`);
    }
  });
}

export async function getApiInstanceForAccount(accountId: number) {
  return throwOnError(
    await useDatabase(async (db) => {
      const user = await db.user.findFirst({ where: { Account: { id: accountId } }, include: { Account: true } });
      if (!user) throw new Error("User not found");
      return mastodonApi({ token: user.token, instance: user.Account.instance });
    })
  );
}
