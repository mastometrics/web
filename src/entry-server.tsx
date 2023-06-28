import { StartServer, createHandler, renderAsync } from "solid-start/entry-server";
import { startScheduledWorkers } from "./workers/schedule";
import { logger } from "./lib/logger";

if (import.meta.env.PROD && import.meta.env.VITE_MAINTENANCE_MODE != "true") startScheduledWorkers();
if (import.meta.env.VITE_MAINTENANCE_MODE == "true") logger.warn("🚧 Server started in maintenance mode");
export default createHandler(renderAsync((event) => <StartServer event={event} />));
