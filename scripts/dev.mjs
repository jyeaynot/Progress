import { spawn } from "node:child_process";

function start(command, args, label) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
      process.exitCode = code;
    }
  });

  return child;
}

const npmCliPath = process.env.npm_execpath;

if (!npmCliPath) {
  throw new Error("npm_execpath is not set. Run this script through npm.");
}

const client = start(process.execPath, [npmCliPath, "run", "dev:client"], "client");
const server = start(process.execPath, [npmCliPath, "run", "dev:server"], "server");

function shutdown(signal) {
  client.kill(signal);
  server.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
