import { z } from "zod";
import type { Config } from "./config";
import type { Db } from "./db/client";
import { errorResponse, json, readJson } from "./http";
import { noteRoutes } from "./routes/notes";

const MAX_BODY_BYTES = 1024 * 1024;

const EchoBody = z.object({ message: z.string().trim().min(1).max(1000) });

/** Starts the HTTP server. Does no other work at import time, so tests can start their own on port 0. */
export function createServer(config: Config, db: Db) {
  const dev = config.env === "development";

  return Bun.serve({
    port: config.port,
    hostname: config.hostname,
    development: dev,
    maxRequestBodySize: MAX_BODY_BYTES,

    routes: {
      "/health": { GET: () => json({ status: "ok" }) },

      "/api/echo": {
        POST: async (req) => {
          const { message } = await readJson(req, EchoBody);
          return json({ echo: message });
        },
      },

      ...noteRoutes(db),
    },

    // Reached when no route matches, including a known path with the wrong method.
    fetch: () => json({ error: "Not found" }, 404),

    error: (error) => errorResponse(error, dev),
  });
}
