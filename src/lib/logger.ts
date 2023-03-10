import { LOG_LEVEL } from "~/workers/config";

function debug(...args: any[]) {
  if (["debug"].includes(LOG_LEVEL)) console.debug(...args);
}

function info(...args: any[]) {
  if (["debug", "info"].includes(LOG_LEVEL)) console.info(...args);
}

function warn(...args: any[]) {
  if (["debug", "info", "warning"].includes(LOG_LEVEL)) console.warn(...args);
}

function error(...args: any[]) {
  if (["debug", "info", "warning", "error"]) console.error(...args);
}

export const logger = {
  debug,
  info,
  warn,
  error,
  level: LOG_LEVEL,
};
