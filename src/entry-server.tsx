import { StartServer, createHandler, renderAsync } from "solid-start/entry-server";
import { startScheduledWorkers } from "./workers/schedule";
import { logger } from "./lib/logger";

if (import.meta.env.VITE_MAINTENANCE_MODE == "true") logger.warn("🚧 Server started in maintenance mode");
else if (import.meta.env.PROD && import.meta.env.VITE_DEPLOYMENT_TYPE != "app") startScheduledWorkers();
export default createHandler(renderAsync((event) => <StartServer event={event} />));
