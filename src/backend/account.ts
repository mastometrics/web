import { HandledError } from "~/lib/error";
import { logNewUser } from "~/lib/logsnag/logsnag";
import { importAccount } from "~/workers/import-account";
import { db, runInConnection } from "./db";
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
  await db.account.update({ where: { id: account.id }, data: { tracking: true } });
  logNewUser(account);
  await importAccount(handle, { instance: account.instance });
  return true;
};
