import { Instance, PrismaClient, User } from "@prisma/client";
import { redirect } from "solid-start/server";
import { createCookieSessionStorage } from "solid-start/session";
import { MastodonAccessToken, MastodonAuthenticatedAccount } from "~/lib/mastodon";
import { createOrUpdateAccount } from "~/syncer";
import { runInConnection } from ".";
type AuthenticationData = {
  token: MastodonAccessToken;
  authAccount: MastodonAuthenticatedAccount;
  instance: Instance;
};

export async function authenticate({ authAccount, token, instance }: AuthenticationData) {
  return runInConnection(async (db) => {
    if (!authAccount?.username) throw new Error("Missing username");
    const account = await createOrUpdateAccount(`${authAccount.username}@${instance.host}`, authAccount);
    return db.user.upsert({
      where: { accountId: account.id },
      update: {
        token: token.access_token,
        scopes: token.scope,
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
  if (!userId || typeof userId !== "string") return null;
  return userId;
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

export async function getUser(request: Request) {
  return runInConnection(async (db) => {
    const userId = await getUserId(request);
    if (typeof userId !== "string") return null;

    try {
      const user = await db.user.findUnique({ where: { id: +userId }, include: { Account: true } });
      return {
        // user: user as User, // includes token
        account: user?.Account,
        isAdmin: user?.Account.username === "mastometrics@mas.to",
      };
    } catch {
      throw logout(request);
    }
  });
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
