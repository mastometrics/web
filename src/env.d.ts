interface ImportMetaEnv {
  readonly SESSION_SECRET: string;
  readonly LOGSNAG_TOKEN: string;

  /** Run the sync operation every N minutes */
  readonly WORKER_SYNC_INTERVAL_MINS?: string;

  /** Cron schedule for the sync operation, defaults to above interval */
  readonly WORKER_SYNC_CRON_SCHEDULE?: string;

  /** Number of minutes after which an account is consider outdated */
  readonly WORKER_SYNC_OUTDATED_MINS?: string;

  /** Sync up to N statuses per account, ideally a multiple of 40 */
  readonly WORKER_SYNC_MAX_STATUS_COUNT?: string;

  /** Max percentage of accounts to sync per job, to spread out load
   * Defaults to 1.5x the interval / 60 minutes. I.e. if job runs every 6 minutes, max 15% (5/10*1.5) of accounts will be synced per job.
   */
  readonly WORKER_SYNC_MAX_SPIKE?: string;

  /** Max number of warnings to store on an account */
  readonly WORKER_MAX_WARNINGS_LOGGED?: string;

  /** Max number of warnings within 24 hours after which to suspend an account */
  readonly WORKER_SUSPEND_IMPORT_AFTER_WARNINGS?: string;

  /** Log level */
  readonly LOG_LEVEL?: "debug" | "info" | "warning" | "error";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
