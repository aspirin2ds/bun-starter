## Database

PostgreSQL through [Drizzle ORM](https://orm.drizzle.team) on Bun's built-in `Bun.sql` client.

```sh
bun run db:up        # start Postgres from compose.yaml (needs Docker or Podman)
bun run db:migrate   # apply migrations in drizzle/
bun run dev
```

| Script                | What it does                                          |
| --------------------- | ----------------------------------------------------- |
| `bun run db:up`       | Start the local Postgres container                    |
| `bun run db:generate` | Create a migration from changes to `src/db/schema.ts` |
| `bun run db:migrate`  | Apply pending migrations to `DATABASE_URL`            |

Tests use [PGlite](https://pglite.dev), an in-memory Postgres, so `bun test` needs no database running.

Example resource: `GET /api/notes` lists notes, and `POST /api/notes` with `{ "body": "..." }` creates one.
