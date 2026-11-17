import { loadConfig } from "./config";
import { createServer } from "./server";

const config = loadConfig();
const server = createServer(config);
console.log(`Listening on ${server.url} (${config.env})`);

// Graceful shutdown: stop accepting connections, let in-flight requests finish, then exit.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    console.log(`${signal} received, shutting down`);
    await server.stop();
    process.exit(0);
  });
}
