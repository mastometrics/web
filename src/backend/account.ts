import { Account, PrismaClient } from "@prisma/client";
import { HandledError } from "~/lib/error";
import { logNewUser } from "~/lib/logsnag/logsnag";
import { AccountMetadata, setMetadata } from "~/lib/metadata";
import { importAccount } from "~/workers/import-account";
import { db, runInConnection, throwOnError } from "./db";
export { syncAccount } from "../workers/sync-account";

export const getFullAccount = async (handle: string) =>
  runInConnection(async (db) => {
    const account = await db.account.findUnique({
      where: { username: handle },
      // include: {
      //   Followers: {
      //     select: { Account: { select: { username: true, avatar: true, displayName: true } } },
      //     orderBy: { createdAt: "desc" },
      //     take: 5,
      //   },
      //   Following: {
      //     select: { Account: { select: { username: true, avatar: true, displayName: true } } },
      //     orderBy: { createdAt: "desc" },
      //     take: 5,
      //   },
      // },
    });

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

export async function handleAccountSyncingError(
  account: Account,
  error: unknown | Error | HandledError,
  db: PrismaClient
) {
  let metadata = setMetadata<AccountMetadata>(account.metadata, { pendingImport: undefined });
  metadata.warnings ??= [];

  if (error instanceof HandledError && error.status === 401) {
    metadata.suspendedSync ??= new Date().toISOString();
    metadata.warnings.unshift({
      timestamp: new Date().toISOString(),
      message: `Unable to sync account, authentication token rejected (${error.message})`,
    });
  } else
    metadata.warnings.unshift({
      timestamp: new Date().toISOString(),
      message: `Import failed, ${error instanceof HandledError ? error.message : "Unhandled error"}`,
    });

  return await db.account.update({ where: { id: account.id }, data: { metadata } });
}
