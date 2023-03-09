/** Run the sync operation every N minutes */
export const SYNC_INTERVAL_MINS = +(import.meta.env.WORKER_SYNC_INTERVAL_MINS || 2);

/** Cron schedule for the sync operation */
export const SYNC_CRON_SCHEDULE = import.meta.env.WORKER_SYNC_CRON_SCHEDULE || `*/${SYNC_INTERVAL_MINS} * * * *`;

/** Number of minutes after which an account is consider outdated */
export const SYNC_OUTDATED_MINS = +(import.meta.env.WORKER_SYNC_OUTDATED_MINS || 30);

/** Sync up to N statuses per account, ideally a multiple of 40 */
export const SYNC_MAX_STATUS_COUNT = +(import.meta.env.WORKER_SYNC_MAX_STATUS_COUNT || 120);

/** Max percentage of accounts to sync per job, to spread out load
 * Defaults to 2x the interval / 60 minutes. I.e. if job runs every 6 minutes, max 20% of accounts will be synced per job.
 */
export const SYNC_MAX_SPIKE = +(import.meta.env.WORKER_SYNC_MAX_SPIKE || (2 * SYNC_INTERVAL_MINS) / 60);

/** Debug, verbose or warning */
export const LOG_LEVEL = import.meta.env.DEV ? "debug" : import.meta.env.LOG_LEVEL || "info";
