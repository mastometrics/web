import { CronJob } from "cron";
import { updateOutdatedUsers } from "./sync-outdated-users";

const jobs: CronJob[] = [];
export function startScheduledWorkers() {
  jobs.forEach((task) => task.stop());
  jobs.length = 0;

  // Check for outdated users every 5 minutes, and sync them
  jobs.push(new CronJob("*/5 * * * *", () => updateOutdatedUsers()));

  jobs.forEach((task) => task.start());
  console.log(`🕒 Started ${jobs.length} scheduled workers`);
}
