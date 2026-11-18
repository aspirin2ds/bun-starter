import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../../src/db/schema";

/**
 * A fresh in-memory Postgres (PGlite) with every migration applied. Real Postgres
 * semantics, no Docker, and nothing shared between test files.
 */
export async function testDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return { db, close: () => client.close() };
}
