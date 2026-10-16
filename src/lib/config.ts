/**
 * Runtime configuration, read from environment variables so a single build/image
 * can be configured per deployment. Values are read lazily on access.
 */
const num = (value: string | undefined, fallback: number) =>
  value !== undefined && value !== "" && !isNaN(+value) ? +value : fallback;

export const config = {
  get siteUrl() {
    return process.env.SITE_URL?.replace(/\/+$/, "") || undefined;
  },
  get appName() {
    return process.env.APP_NAME || "MastoMetrics";
  },
  get contactHandle() {
    return (process.env.CONTACT_HANDLE || "MastoMetrics@mas.to").replace(/^@/, "");
  },
  get showDonationBanner() {
    return process.env.SHOW_DONATION_BANNER === "true";
  },
  get maintenanceMode() {
    return process.env.MAINTENANCE_MODE === "true";
  },
  get logLevel() {
    return process.env.LOG_LEVEL || "info";
  },
  get sessionSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET environment variable is required");
    return secret;
  },
};

/** Run the sync operation every N minutes */
export const SYNC_INTERVAL_MINS = num(process.env.WORKER_SYNC_INTERVAL_MINS, 2);

/** Cron schedule for the sync operation */
export const SYNC_CRON_SCHEDULE = process.env.WORKER_SYNC_CRON_SCHEDULE || `*/${SYNC_INTERVAL_MINS} * * * *`;

/** Number of minutes after which an account is consider outdated */
export const SYNC_OUTDATED_MINS = num(process.env.WORKER_SYNC_OUTDATED_MINS, 45);

/** Sync up to N statuses per account, ideally a multiple of 40 */
export const SYNC_MAX_STATUS_COUNT = num(process.env.WORKER_SYNC_MAX_STATUS_COUNT, 120);

/** Max percentage of accounts to sync per job, to spread out load
 * Defaults to 1.5x the interval / outdated minutes. I.e. if job runs every 2 minutes and accounts are outdated after 45, max ~7% of accounts will be synced per job.
 */
export const SYNC_MAX_SPIKE = num(process.env.WORKER_SYNC_MAX_SPIKE, (1.5 * SYNC_INTERVAL_MINS) / SYNC_OUTDATED_MINS);

/** Max number of warnings to store on an account */
export const MAX_WARNINGS_LOGGED = num(process.env.WORKER_MAX_WARNINGS_LOGGED, 15);

/** Max number of warnings within 24 hours after which to suspend an account */
export const SUSPEND_IMPORT_AFTER_WARNINGS = num(process.env.WORKER_SUSPEND_IMPORT_AFTER_WARNINGS, 10);

/** Daily delete the data of accounts that revoked access more than 30 days ago, as promised in the privacy policy */
export const PURGE_REVOKED_ACCOUNTS = process.env.WORKER_PURGE_REVOKED_ACCOUNTS !== "false";
