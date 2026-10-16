// Production launcher. Starts the web app and/or the background worker depending on DEPLOYMENT_TYPE:
//   default (unset) - web app and worker in one container
//   app             - only the web app (serve user traffic)
//   worker          - only the background worker (sync accounts)
// A `.env` file in the working directory is loaded when present.
//
// Options (override the environment variables):
//   --port <port>, -p <port>   port of the web app (PORT)
//   --host <host>              host of the web app (HOST)
//   --app, --worker            only start the web app or the worker (DEPLOYMENT_TYPE)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";

// Variables that are already set take precedence over the .env file
if (existsSync(".env")) process.loadEnvFile(".env");

const { values: args } = parseArgs({
  options: {
    port: { type: "string", short: "p" },
    host: { type: "string" },
    app: { type: "boolean" },
    worker: { type: "boolean" },
  },
});
if (args.port) process.env.PORT = args.port;
if (args.host) process.env.HOST = args.host;
if (args.app && !args.worker) process.env.DEPLOYMENT_TYPE = "app";
if (args.worker && !args.app) process.env.DEPLOYMENT_TYPE = "worker";

const type = process.env.DEPLOYMENT_TYPE || "default";

const processes = [];
if (type !== "worker") processes.push(["app", "dist/server/entry.mjs"]);
if (type !== "app") processes.push(["worker", "dist/worker.mjs"]);

const children = processes.map(([name, entry]) => {
  const child = spawn(process.execPath, [entry], { stdio: "inherit", env: process.env });
  child.on("exit", (code, signal) => {
    console.error(`[start] ${name} exited (${signal ?? code}), shutting down`);
    for (const other of children) if (other !== child && other.exitCode === null) other.kill("SIGTERM");
    process.exitCode = code ?? 1;
  });
  return child;
});

for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => children.forEach((child) => child.exitCode === null && child.kill(signal)));
