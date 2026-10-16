import { config } from "./config";

const levels = ["debug", "info", "warning", "error"];
const enabled = (level: string) => levels.indexOf(level) >= Math.max(0, levels.indexOf(config.logLevel));

function debug(...args: any[]) {
  if (enabled("debug")) console.debug(...args);
}

function info(...args: any[]) {
  if (enabled("info")) console.info(...args);
}

function warn(...args: any[]) {
  if (enabled("warning")) console.warn(...args);
}

function error(...args: any[]) {
  console.error(...args);
}

export const logger = {
  debug,
  info,
  warn,
  error,
  get level() {
    return config.logLevel;
  },
};
