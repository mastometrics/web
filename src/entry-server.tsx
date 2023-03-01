import { StartServer, createHandler, renderAsync } from "solid-start/entry-server";
import { startScheduledWorkers } from "./workers/schedule";

startScheduledWorkers();

export default createHandler(renderAsync((event) => <StartServer event={event} />));
