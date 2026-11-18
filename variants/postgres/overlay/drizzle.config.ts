import { defineConfig } from "drizzle-kit";

// Tooling config, so it reads env directly. `db:generate` only diffs the schema and needs no database.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
