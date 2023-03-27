/** Run the sync operation every N minutes */
export const SYNC_INTERVAL_MINS = +(import.meta.env.WORKER_SYNC_INTERVAL_MINS || 2);

/** Cron schedule for the sync operation */
export const SYNC_CRON_SCHEDULE = import.meta.env.WORKER_SYNC_CRON_SCHEDULE || `*/${SYNC_INTERVAL_MINS} * * * *`;

/** Number of minutes after which an account is consider outdated */
export const SYNC_OUTDATED_MINS = +(import.meta.env.WORKER_SYNC_OUTDATED_MINS || 45);

/** Sync up to N statuses per account, ideally a multiple of 40 */
export const SYNC_MAX_STATUS_COUNT = +(import.meta.env.WORKER_SYNC_MAX_STATUS_COUNT || 120);

/** Max percentage of accounts to sync per job, to spread out load
 * Defaults to 1.5x the interval / 60 minutes. I.e. if job runs every 6 minutes, max 15% (5/10*1.5) of accounts will be synced per job.
 */
export const SYNC_MAX_SPIKE = +(
  import.meta.env.WORKER_SYNC_MAX_SPIKE || (1.5 * SYNC_INTERVAL_MINS) / SYNC_OUTDATED_MINS
);

/** Debug, verbose or warning */
export const LOG_LEVEL = import.meta.env.DEV ? "debug" : import.meta.env.LOG_LEVEL || "info";

/** Max number of warnings to store on an account */
export const MAX_WARNINGS_LOGGED = +(import.meta.env.WORKER_MAX_WARNINGS_LOGGED ?? 15);

/** Max number of warnings within 24 hours after which to suspend an account */
export const SUSPEND_IMPORT_AFTER_WARNINGS = +(import.meta.env.WORKER_SUSPEND_IMPORT_AFTER_WARNINGS ?? 10);
