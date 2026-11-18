import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * The database handle routes depend on. It's typed by the shared Postgres interface rather than
 * one driver, so production (Bun.sql) and tests (PGlite) can pass in different drivers.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Opens a connection pool with Bun's built-in Postgres client. Call `close()` on shutdown. */
export function connect(url: string) {
  const client = new SQL(url);
  const db = drizzle({ client, schema });
  return { db, close: () => client.close() };
}
