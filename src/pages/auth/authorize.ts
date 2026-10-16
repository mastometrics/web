import type { APIRoute } from "astro";
import { getOrigin } from "~/backend/auth-session";
import { getAuthUrl, loginErrorUrl } from "~/backend/oauth";
import { HandledError } from "~/lib/error";
import { config } from "~/lib/config";
import { parseInstance } from "~/lib/format";
import { logger } from "~/lib/logger";

/** Start of the sign in flow, redirects to the OAuth page of the given instance */
export const GET: APIRoute = async ({ url, redirect }) => {
  const input = url.searchParams.get("instance");
  if (config.maintenanceMode) return redirect(loginErrorUrl("Server is in maintenance mode"));

  const instance = parseInstance(input)?.toLowerCase();
  if (!instance) return redirect(loginErrorUrl("Please enter an instance"));

  try {
    return redirect(await getAuthUrl(instance, getOrigin(url)));
  } catch (error) {
    if (!(error instanceof HandledError)) logger.error(error);
    const message = error instanceof HandledError ? error.message : "Something went wrong while trying to log you in.";
    return redirect(loginErrorUrl(message, instance));
  }
};
