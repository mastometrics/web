import type { Account } from "~/generated/prisma/client";
import { HandledError } from "~/lib/error";
import type { Roles } from "~/lib/permissions";

export type AuthenticatedUser = { id: number; account: Account; roles: Roles[] };

/** Throws when there is no authenticated user */
export function requireUser(user: AuthenticatedUser | null | undefined): AuthenticatedUser {
  if (!user) throw new HandledError("Not authenticated", { status: 401 });
  return user;
}

export function throwUnauthorized(): never {
  throw new HandledError("Not authorized", { status: 403 });
}
