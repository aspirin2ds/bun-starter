import { loadConfig } from "./config";
import { connect } from "./db/client";
import { createServer } from "./server";

const config = loadConfig();
const database = connect(config.databaseUrl);
const server = createServer(config, database.db);
console.log(`Listening on ${server.url} (${config.env})`);

// Graceful shutdown: stop accepting connections, let in-flight requests finish,
// close the database pool, then exit.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    console.log(`${signal} received, shutting down`);
    await server.stop();
    await database.close();
    process.exit(0);
  });
}
