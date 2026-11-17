import type { Config } from "./config";
import { errorResponse, json, readJson } from "./http";

const MAX_BODY_BYTES = 1024 * 1024;

/** Starts the HTTP server. Does no other work at import time, so tests can start their own on port 0. */
export function createServer(config: Config) {
  const dev = config.env === "development";

  return Bun.serve({
    port: config.port,
    hostname: config.hostname,
    development: dev,
    maxRequestBodySize: MAX_BODY_BYTES,

    routes: {
      "/health": { GET: () => json({ status: "ok" }) },

      "/api/echo": {
        POST: async (req) => json({ echo: await readJson(req) }),
      },
    },

    // Reached when no route matches, including a known path with the wrong method.
    fetch: () => json({ error: "Not found" }, 404),

    error: (error) => errorResponse(error, dev),
  });
}
