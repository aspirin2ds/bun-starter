## Database (PostgreSQL + Drizzle)

- **Stack:** Drizzle ORM on Bun's built-in Postgres client (`drizzle-orm/bun-sql`). Don't add `pg` or `postgres.js`.
- **Layout:** tables live in `src/db/schema.ts`, `connect()` in `src/db/client.ts`, and one routes file per resource in `src/routes/<resource>.ts` (`notes.ts` is the example to copy). Generated migrations live in `drizzle/`.
- **Schema changes:** edit `src/db/schema.ts`, run `bun run db:generate`, and commit the new migration file with the change. Never edit a migration that has been committed; add a new one.
- **Access:** route code takes the `Db` type as a parameter and never imports a connection. Only `src/index.ts` and `scripts/migrate.ts` call `connect()`.
- **Tests** run against PGlite, an in-memory Postgres with all migrations applied, so they don't need Docker. Use `startApp()` from `test/support/app.ts` for e2e tests, and `testDb()` from `test/support/db.ts` for tests that only touch the database.
- **Local database:** `bun run db:up` starts Postgres from `compose.yaml` (`podman compose` works too), then `bun run db:migrate` applies the migrations.
- **Deploy:** run `bun run db:migrate` before starting a new version.
