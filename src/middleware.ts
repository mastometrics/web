import { defineMiddleware } from "astro:middleware";
import { getUserById, readSessionValue, SESSION_COOKIE } from "~/backend/session";
import { logger } from "~/lib/logger";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  if (context.isPrerendered) return next();

  const userId = readSessionValue(context.cookies.get(SESSION_COOKIE)?.value);
  if (userId) {
    try {
      context.locals.user = await getUserById(userId);
    } catch (error) {
      logger.error(error);
    }
    // The session points to a user that no longer exists, sign out
    if (!context.locals.user) context.cookies.delete(SESSION_COOKIE, { path: "/" });
  }

  return next();
});
