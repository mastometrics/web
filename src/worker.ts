// Background worker: periodically syncs tracked accounts with their Mastodon instances.
// Run with `npm run start:worker` (production) or `npm run dev:worker` (development).
import { disconnectDatabase } from "~/backend/db";
import { config } from "~/lib/config";
import { logger } from "~/lib/logger";
import { startScheduledWorkers, stopScheduledWorkers } from "~/workers/schedule";

if (config.maintenanceMode) {
  logger.warn("🚧 Worker started in maintenance mode, not scheduling any jobs");
} else {
  startScheduledWorkers();
}

async function shutdown(signal: string) {
  logger.info(`👋 Received ${signal}, stopping workers`);
  stopScheduledWorkers();
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Keep the process alive while in maintenance mode
if (config.maintenanceMode) setInterval(() => {}, 1 << 30);
