/** Applies pending migrations from drizzle/ to DATABASE_URL. Run on deploy before starting the server. */
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { loadConfig } from "../src/config";
import { connect } from "../src/db/client";

const { db, close } = connect(loadConfig().databaseUrl);
try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations applied");
} finally {
  await close();
}
