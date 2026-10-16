/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** The signed in user, resolved by the middleware */
    user: import("./backend/authentication").AuthenticatedUser | null;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    SESSION_SECRET?: string;

    /** Public URL of this deployment, e.g. https://metrics.example.com (used for OAuth redirects) */
    SITE_URL?: string;

    /** Name shown when registering the app on Mastodon instances */
    APP_NAME?: string;

    /** Mastodon handle used for support and contact links */
    CONTACT_HANDLE?: string;

    /** Show the ko-fi donation banner on the dashboard */
    SHOW_DONATION_BANNER?: "true" | "false";

    /** Deployment type for `npm start`: both (default), app only or worker only */
    DEPLOYMENT_TYPE?: "app" | "worker" | "default";

    /** Run the sync operation every N minutes */
    WORKER_SYNC_INTERVAL_MINS?: string;

    /** Cron schedule for the sync operation, defaults to above interval */
    WORKER_SYNC_CRON_SCHEDULE?: string;

    /** Number of minutes after which an account is consider outdated */
    WORKER_SYNC_OUTDATED_MINS?: string;

    /** Sync up to N statuses per account, ideally a multiple of 40 */
    WORKER_SYNC_MAX_STATUS_COUNT?: string;

    /** Max percentage of accounts to sync per job, to spread out load */
    WORKER_SYNC_MAX_SPIKE?: string;

    /** Max number of warnings to store on an account */
    WORKER_MAX_WARNINGS_LOGGED?: string;

    /** Max number of warnings within 24 hours after which to suspend an account */
    WORKER_SUSPEND_IMPORT_AFTER_WARNINGS?: string;

    /** Log level */
    LOG_LEVEL?: "debug" | "info" | "warning" | "error";

    /** Maintenance mode */
    MAINTENANCE_MODE?: "true" | "false";
  }
}
