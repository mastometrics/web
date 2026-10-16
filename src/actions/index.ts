import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro/zod";
import { deleteAccount, restartSync, startTracking, syncAccount } from "~/backend/account";
import { requireUser, throwUnauthorized } from "~/backend/authentication";
import { throwOnError } from "~/backend/db";
import { getAccountMetrics } from "~/backend/metrics";
import { getTopPeople } from "~/backend/people";
import { getRelationships } from "~/backend/relationships";
import { getStatuses } from "~/backend/statuses";
import { getTotalUserCount, listUsers } from "~/backend/users";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";
import { mastodonApi } from "~/lib/mastodon/api";
import { parseHandle } from "~/lib/format";
import { usePermissions } from "~/lib/permissions";
import { syncInteractions } from "~/workers/sync-interactions";

const periods = z.enum(["24h", "7d", "30d", "90d", "1y", "all"]);

const statusCodes: Record<number, ActionError["code"]> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "TOO_MANY_REQUESTS",
};

/** Runs an action handler and converts handled errors into action errors with a user facing message */
async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ActionError) throw error;
    if (error instanceof HandledError)
      throw new ActionError({ code: statusCodes[error.status] ?? "INTERNAL_SERVER_ERROR", message: error.message });
    logger.error(error);
    throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" });
  }
}

function permissions(context: ActionAPIContext) {
  const user = requireUser(context.locals.user);
  return { user, can: usePermissions(user) };
}

function requireAdmin(context: ActionAPIContext) {
  const { user, can } = permissions(context);
  if (!can.manage()) throwUnauthorized();
  return user;
}

function requireAccountAccess(context: ActionAPIContext, handleOrId: string | number, edit = false) {
  const { user, can } = permissions(context);
  if (!(edit ? can.account.edit(handleOrId) : can.account.view(handleOrId))) throwUnauthorized();
  return user;
}

export const server = {
  /** Checks whether a domain hosts a Mastodon instance */
  validateInstance: defineAction({
    input: z.object({ instance: z.string().min(1).max(255) }),
    handler: ({ instance }) =>
      run(async () => {
        const info = await mastodonApi({ instance }).instance.info();
        return { instance, title: info.title };
      }),
  }),

  /** Look up a (remote) account, used as fallback when the browser cannot reach the instance directly */
  lookupAccount: defineAction({
    input: z.object({ handle: z.string().min(1).max(512) }),
    handler: ({ handle }, context) =>
      run(async () => {
        requireUser(context.locals.user);
        const { instance } = parseHandle(handle);
        return mastodonApi({ instance }).accounts.lookup(handle);
      }),
  }),

  metrics: defineAction({
    input: z.object({
      handle: z.string(),
      period: periods,
      utcOffset: z
        .number()
        .int()
        .min(-24 * 60)
        .max(24 * 60),
    }),
    handler: ({ handle, ...params }, context) =>
      run(async () => {
        requireAccountAccess(context, handle);
        return getAccountMetrics(handle, params);
      }),
  }),

  statuses: defineAction({
    input: z.object({
      handle: z.string(),
      period: periods,
      order: z.enum(["engagements", "favorites", "boosts", "replies", "publishedAt"]),
      includeReplies: z.boolean().optional(),
      query: z.string().max(200).optional(),
      skip: z.number().int().min(0).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    handler: ({ handle, ...params }, context) =>
      run(async () => {
        requireAccountAccess(context, handle);
        return throwOnError(await getStatuses(handle, params));
      }),
  }),

  topPeople: defineAction({
    input: z.object({
      accountId: z.number().int(),
      order: z.enum(["interactions", "mentions", "boosts", "favorites", "reach"]),
    }),
    handler: ({ accountId, order }, context) =>
      run(async () => {
        requireAccountAccess(context, accountId);
        return getTopPeople(accountId, { order });
      }),
  }),

  relationships: defineAction({
    input: z.object({ accountId: z.number().int(), ids: z.array(z.string()).max(100) }),
    handler: ({ accountId, ids }, context) =>
      run(async () => {
        requireAccountAccess(context, accountId);
        return getRelationships(accountId, ids);
      }),
  }),

  /** Admin: sync an account right away */
  syncAccount: defineAction({
    input: z.object({ handle: z.string() }),
    handler: ({ handle }, context) =>
      run(async () => {
        requireAdmin(context);
        throwOnError(await syncAccount(handle));
        return true;
      }),
  }),

  /** Admin: sync interactions of an account right away */
  syncInteractions: defineAction({
    input: z.object({ handle: z.string() }),
    handler: ({ handle }, context) =>
      run(async () => {
        requireAdmin(context);
        throwOnError(await syncInteractions(handle));
        return true;
      }),
  }),

  /** Start tracking (importing) an account */
  importAccount: defineAction({
    input: z.object({ handle: z.string() }),
    handler: ({ handle }, context) =>
      run(async () => {
        requireAccountAccess(context, handle, true);
        return startTracking(handle);
      }),
  }),

  /** Resume syncing of a suspended account */
  restartSync: defineAction({
    input: z.object({ handle: z.string() }),
    handler: ({ handle }, context) =>
      run(async () => {
        requireAccountAccess(context, handle, true);
        return restartSync(handle);
      }),
  }),

  deleteAccount: defineAction({
    input: z.object({ handle: z.string() }),
    handler: ({ handle }, context) =>
      run(async () => {
        requireAccountAccess(context, handle, true);
        throwOnError(await deleteAccount(handle));
        return true;
      }),
  }),

  /** Admin: list registered users */
  listUsers: defineAction({
    input: z.object({
      order: z.enum(["lastIndex", "createdAt", "lastLogin", "followerCount", "statusCount"]).optional(),
      dir: z.enum(["asc", "desc"]).optional(),
      filters: z.array(z.enum(["suspended"])).optional(),
      query: z.string().max(200).optional(),
      skip: z.number().int().min(0).optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
    handler: (params, context) =>
      run(async () => {
        requireAdmin(context);
        return throwOnError(await listUsers(params));
      }),
  }),

  /** Admin: total number of registered users */
  userCount: defineAction({
    handler: (_, context) =>
      run(async () => {
        requireAdmin(context);
        return getTotalUserCount();
      }),
  }),
};
