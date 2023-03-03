import { Account } from "@prisma/client";
import { isServer } from "solid-js/web";
import { redirect, ServerError } from "solid-start/server";
import { getUser } from "~/backend/session";
import { HandledError } from "~/lib/error";
import { Roles } from "~/lib/permissions";

export type AuthenticatedUser = { account: Account; roles: Roles[] };

export async function useAuthentication(request: Request) {
  if (!isServer) throw new HandledError("useAuthentication can only be used on the server");
  const user = getUser(request);
  if (!user) throw redirect("/auth/login");
  return user;
}

export async function requireAuth(request: Request) {
  const user = useAuthentication(request);
  if (!user) throwUnauthorized();
  return user;
}

export function throwUnauthorized() {
  throw new ServerError("Not authorized", { status: 403 });
}
