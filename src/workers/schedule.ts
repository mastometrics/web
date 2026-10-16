import { CronJob } from "cron";
import { logger } from "~/lib/logger";
import { SYNC_CRON_SCHEDULE } from "~/lib/config";
import { updateOutdatedUsers } from "./sync-outdated-users";
import { requeueStuckSyncs } from "./requeue-stuck-syncs";

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

  jobs.forEach((task) => task.start());
  logger.info(`🕒 Started ${jobs.length} scheduled workers`);
}
