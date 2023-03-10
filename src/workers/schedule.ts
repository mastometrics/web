import { CronJob } from "cron";
import { logger } from "~/lib/logger";
import { SYNC_CRON_SCHEDULE } from "./config";
import { updateOutdatedUsers } from "./sync-outdated-users";

const jobs: CronJob[] = [];
export function startScheduledWorkers() {
  jobs.forEach((task) => task.stop());
  jobs.length = 0;

  jobs.push(new CronJob(SYNC_CRON_SCHEDULE, () => updateOutdatedUsers()));
  logger.info(`🕒 Starting updated outdated users worker with schedule ${SYNC_CRON_SCHEDULE}`);

  jobs.forEach((task) => task.start());
  logger.info(`🕒 Started ${jobs.length} scheduled workers`);
}
