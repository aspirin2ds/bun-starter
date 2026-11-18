import { loadConfig } from "../../src/config";
import { createServer } from "../../src/server";
import { testDb } from "./db";

/**
 * Starts the real server on a free port (port 0), backed by a fresh PGlite database.
 * Call `stop()` in `afterAll`.
 */
export async function startApp() {
  const database = await testDb();
  // DATABASE_URL must be valid but is never used: the server gets the PGlite handle.
  const config = loadConfig({
    PORT: "0",
    HOST: "127.0.0.1",
    NODE_ENV: "test",
    DATABASE_URL: "postgres://unused@localhost/test",
  });
  const server = createServer(config, database.db);

  return {
    db: database.db,
    call: (path: string, init?: RequestInit) => fetch(new URL(path, server.url), init),
    stop: async () => {
      await server.stop(true);
      await database.close();
    },
  };
}
