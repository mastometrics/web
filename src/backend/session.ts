import { Instance } from "@prisma/client";
import { redirect, useRequest } from "solid-start/server";
import { createCookieSessionStorage } from "solid-start/session";
import { MastodonAccessToken, MastodonAuthenticatedAccount } from "~/lib/mastodon/api";
import { AuthenticatedUser } from "~/backend/authentication";
import { createOrUpdateAccount, getOrCreateAccount } from "~/workers/upsert-account";
import { db, runInConnection } from "./db";
import { HandledError } from "~/lib/error";
import { Roles } from "~/lib/permissions";
import { logNewUser } from "~/lib/logsnag/logsnag";
type AuthenticationData = {
  token: MastodonAccessToken;
  authAccount: MastodonAuthenticatedAccount;
  instance: Instance;
};

export async function authenticate({ authAccount, token, instance }: AuthenticationData) {
  return runInConnection(async (db) => {
    if (!authAccount?.username) throw new Error("Missing username");
    const username = `${authAccount.username}@${instance.host}`;
    let account = await db.account.findUnique({ where: { username } });
    if (!account) {
      account = await createOrUpdateAccount(username, authAccount, { instance: instance.host }, db);
      console.log(`🔥 New signup: ${username}`);
      if (import.meta.env.PROD) logNewUser(account);
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

const sessionSecret = process.env.SESSION_SECRET!;

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: true,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string" || userId.length == 0) return null;
  return userId;
}

export async function hasActiveSession(request: Request) {
  const userId = await getUserId(request);
  return userId != null;
}

export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

// In the future, we may want to store more of this data in the session for performance reasons
export async function getUser(request: Request): Promise<AuthenticatedUser | null> {
  const ctx = useRequest();

  // Store the promise in the request context so that it can be reused on subsequent calls
  if (ctx?.locals?.userPromise) return ctx.locals.userPromise as Promise<AuthenticatedUser | null>;
  const promise = (async () => {
    const userId = await getUserId(request);
    if (typeof userId !== "string") return null;
    try {
      const user = await db.user.findUnique({ where: { id: +userId }, include: { Account: true } });
      if (!user) throw new HandledError("User not found");
      return {
        // user: user as User, // includes token
        account: user?.Account,
        roles: (user?.roles as Roles[]) || [],
      };
    } catch {
      throw logout(request);
    }
  })();
  if (ctx?.locals) ctx.locals.userPromise = promise;
  return promise;
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
