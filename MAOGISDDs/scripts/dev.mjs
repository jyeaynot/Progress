import { spawn } from "node:child_process";

function start(command, args, label) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
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

const client = start("npm", ["run", "dev:client"], "client");
const server = start("npm", ["run", "dev:server"], "server");

function shutdown(signal) {
  client.kill(signal);
  server.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

