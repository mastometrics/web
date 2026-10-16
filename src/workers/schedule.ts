import { CronJob } from "cron";
import { logger } from "~/lib/logger";
import { PURGE_REVOKED_ACCOUNTS, SYNC_CRON_SCHEDULE } from "~/lib/config";
import { updateOutdatedUsers } from "./sync-outdated-users";
import { requeueStuckSyncs } from "./requeue-stuck-syncs";
import { purgeRevokedAccounts } from "./purge-revoked-accounts";

const jobs: CronJob[] = [];

export function stopScheduledWorkers() {
  jobs.forEach((task) => task.stop());
  jobs.length = 0;
}

export function startScheduledWorkers() {
  stopScheduledWorkers();

  jobs.push(
    CronJob.from({
      cronTime: SYNC_CRON_SCHEDULE,
      onTick: async () => void (await updateOutdatedUsers()),
      waitForCompletion: true,
    })
  );
  logger.info(`🕒 Starting updated outdated users worker with schedule ${SYNC_CRON_SCHEDULE}`);

  jobs.push(CronJob.from({ cronTime: "0 * * * *", onTick: async () => void (await requeueStuckSyncs()) }));

  if (PURGE_REVOKED_ACCOUNTS) {
    jobs.push(
      CronJob.from({
        cronTime: "17 4 * * *",
        onTick: async () => {
          try {
            await purgeRevokedAccounts({ apply: true });
          } catch (error) {
            logger.error("🧹 Failed to delete revoked accounts", error);
          }
        },
        waitForCompletion: true,
      })
    );
    logger.info("🕒 Deleting the data of accounts that revoked access daily at 04:17");
  }

  jobs.forEach((task) => task.start());
  logger.info(`🕒 Started ${jobs.length} scheduled workers`);
}
