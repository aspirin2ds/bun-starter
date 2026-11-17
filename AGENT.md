# Agent rules

Rules for any agent (or person) changing this project. Keep it small: add a dependency, file or layer only when it is needed now.

## Commands

| Task                                | Command                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Dev server (hot reload)             | `bun run dev`                                               |
| Production                          | `bun run start`                                             |
| Tests                               | `bun test` (single file: `bun test test/unit/http.test.ts`) |
| Type check                          | `bun run typecheck`                                         |
| Lint + format check                 | `bun run lint` (auto-fix: `bun run fix`)                    |
| Everything, before finishing a task | `bun run ci`                                                |

A task is done when `bun run ci` passes.

## Layout

```
src/index.ts    entry only: load config, start server, handle signals. No logic.
src/server.ts   createServer(config): the Bun.serve routes table and error/fallback handlers.
src/config.ts   the only place that reads env vars. Validated, frozen, fails fast.
src/http.ts     shared HTTP helpers: json(), HttpError, readJson(), errorResponse().
test/unit/      pure functions, no network.
test/e2e/       a real server on port 0, called with fetch.
```

When `server.ts` grows past a handful of routes, move handlers into `src/routes/<area>.ts`. Each file exports a routes object, and `server.ts` spreads it into `routes`.

## Bun first

Use Bun built-ins over npm packages:

- HTTP: `Bun.serve({ routes })`, not express, hono or koa.
- SQLite: `bun:sqlite`. Postgres: `Bun.sql`. Redis: `Bun.redis`.
- Files: `Bun.file` / `Bun.write`, not `node:fs` readFile/writeFile.
- Shell: `` Bun.$`cmd` ``, not execa. Tests: `bun:test`, not jest or vitest.
- Env: Bun loads `.env` itself, so never add dotenv. Use `bunx`, never `npx`.
- Frontend (if ever needed): HTML imports in `routes`, not vite or webpack.

## Code rules

- **Config:** read `Bun.env`/`process.env` only in `src/config.ts`. Add new settings to `Config`, validate them in `loadConfig`, and document them in `.env.example`.
- **Responses:** every response is JSON via `json()`, including errors: `{ "error": "message" }`.
- **Errors:** for client errors, `throw new HttpError(status, message)`; do not build error responses by hand in handlers. Let unexpected errors throw, because the `error` handler logs them and returns a 500 that hides the message outside development.
- **Input:** treat bodies as `unknown`. Parse with `readJson()`, then check each field's type before using it. Never cast unchecked input to a domain type.
- **No import-time side effects** outside `src/index.ts`. Modules export functions; nothing listens, connects or reads env on import.
- **Types:** strict TS with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`, no `@ts-ignore`, and no non-null `!` unless a comment says why it is safe.
- **Dependencies:** zero runtime dependencies is the default. Before adding one, check whether Bun already provides it. Add with `bun add` (or `bun add -d`) and commit `bun.lock`.
- **Style:** Biome owns formatting and import order, so don't hand-format. Write comments for _why_, not _what_.

## Tests

- Each new route gets an e2e test in `test/e2e/` (status and body). Logic outside a route gets a unit test.
- Start servers with `PORT: "0"` and stop them in `afterAll(() => server.stop(true))`.
- Pass config objects into code instead of mutating `process.env` in tests.
- Silence expected `console.error` with `spyOn(...).mockImplementation`, and restore it afterwards.

## Docker

`Dockerfle` builds a production image that runs as the non-root `bun` user and has a `/health` check. If you add files the server needs at runtime (for example `public/`), add a `COPY` line for them. The `.dockerignore` keeps tests, docs and `.env` out of the image.
