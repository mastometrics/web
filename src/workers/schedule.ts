import { CronJob } from "cron";
import { logger } from "~/lib/logger";
import { SYNC_CRON_SCHEDULE } from "./config";
import { updateOutdatedUsers } from "./sync-outdated-users";
import { requeueStuckSyncs } from "./requeue-stuck-syncs";

const jobs: CronJob[] = [];
export function startScheduledWorkers() {
  jobs.forEach((task) => task.stop());
  jobs.length = 0;

  jobs.push(new CronJob(SYNC_CRON_SCHEDULE, () => updateOutdatedUsers()));
  logger.info(`🕒 Starting updated outdated users worker with schedule ${SYNC_CRON_SCHEDULE}`);

  jobs.push(new CronJob("0 * * * *", () => requeueStuckSyncs()));

  jobs.forEach((task) => task.start());
  logger.info(`🕒 Started ${jobs.length} scheduled workers`);
}
