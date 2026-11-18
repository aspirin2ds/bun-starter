# Agent rules

<!-- template-only:start -->

> **This repo is a `bun create` template.** Read "Changing the template" in README.md first. Any change to `src/config.ts`, `src/server.ts`, `src/index.ts` or their tests must also be made in the copies under `variants/*/overlay/`. `bun run ci:variants` must pass as well as `bun run ci`.

<!-- template-only:end -->

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

A task is done when `bun run ci` passes. Run it yourself and read the output; never report success without having run it. The pre-commit hook runs it too: fix the failure instead of bypassing the hook with `--no-verify`.

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

Unsure of a Bun API? Look it up instead of guessing from Node habits. Use the docs index at https://bun.com/docs/llms.txt, or the type definitions in `node_modules/bun-types/`.

## Code rules

- **Config:** read `Bun.env`/`process.env` only in `src/config.ts`. Add a new setting to `EnvSchema` (Zod) and document it in `.env.example`. Never read env elsewhere.
- **Responses:** every response is JSON via `json()`, including errors: `{ "error": "message" }`.
- **Errors:** for client errors, `throw new HttpError(status, message)`; do not build error responses by hand in handlers. Let unexpected errors throw, because the `error` handler logs them and returns a 500 that hides the message outside development.
- **Input:** every request body, query string and path parameter goes through a Zod schema before use. For bodies, use `readJson(req, Schema)`, which returns typed data or throws a 400 that lists the invalid fields. Define the schema next to its route and get types from it with `z.infer`; don't write a matching interface by hand. Never cast unchecked input with `as`.
- **No import-time side effects** outside `src/index.ts`. Modules export functions; nothing listens, connects or reads env on import.
- **Types:** strict TS with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`, no `@ts-ignore`, and no non-null `!` unless a comment says why it is safe.
- **Dependencies:** the only runtime dependency is `zod` (v4, `import { z } from "zod"`). Before adding another, check whether Bun already provides it. Add with `bun add` (or `bun add -d`) and commit `bun.lock`.
- **Style:** Biome owns formatting and import order, so don't hand-format. Write comments for _why_, not _what_.

## Tests

- **Test first:** for a new behavior or a bug fix, write or update the test, see it fail, then change the code until it passes.
- **Never weaken a test to make it pass.** Don't delete or skip a test, loosen an assertion, or add `.only`/`.skip` to get to green. If a test is wrong, say why and change it in its own step.
- Each new route gets an e2e test in `test/e2e/` (status and body). Logic outside a route gets a unit test.
- Start servers with `PORT: "0"` and stop them in `afterAll(() => server.stop(true))`.
- Pass config objects into code instead of mutating `process.env` in tests.
- Silence expected `console.error` with `spyOn(...).mockImplementation`, and restore it afterwards.

## Commits

- Make small commits, one change each, as save points that are easy to review and revert.
- Use Conventional Commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

## Docker

`Dockerfile` builds a production image that runs as the non-root `bun` user and has a `/health` check. If you add files the server needs at runtime (for example `public/`), add a `COPY` line for them. The `.dockerignore` keeps tests, docs and `.env` out of the image.
