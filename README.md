# bun-starter

A minimal, strict [Bun](https://bun.sh) HTTP server to copy when starting a new app. Its only runtime dependency is [Zod](https://zod.dev), which validates request bodies and env vars.

<!-- template-only:start -->

## Start a new app from it

```sh
# From GitHub (private repo, so pass a token)
GITHUB_TOKEN=$(gh auth token) bun create aspirin2ds/bun-starter my-app

# Or from this folder, after a one-time link (edits here reach new apps without pushing)
mkdir -p ~/.bun-create && ln -s "$PWD" ~/.bun-create/bun-starter
bun create bun-starter my-app
```

`bun create` asks which variant you want:

| Variant    | Adds                                                                  |
| ---------- | --------------------------------------------------------------------- |
| `basic`    | Nothing; the HTTP API described below                                 |
| `postgres` | Drizzle ORM on `Bun.sql`, migrations, a `notes` example, PGlite tests |

Set `STARTER_VARIANT=postgres` (or `basic`) to skip the question, for example in scripts.

The new app gets a fresh git repo with one initial commit, its own `name`, a `.env` made from `.env.example`, installed dependencies and the pre-commit hook. The setup files (`setup.ts`, `variants/`) are removed. Untracked files in this folder are copied too, so keep secrets and scratch files out of it. Don't pass `--no-install`: it also skips the variant setup.

### Changing the template

- `setup.ts` asks for the variant (the `bun-create` preinstall step) and cleans up afterwards (the postinstall step).
- `variants/<name>/overlay/` is copied over the app. `variants/<name>/package.json` lists dependencies and scripts to add, and `variants/<name>/{AGENTS,README}.md` are appended to the app's docs.
- An overlay replaces whole files. When you change `src/config.ts`, `src/server.ts`, `src/index.ts` or their tests, make the same change in each overlay copy.
- Run `bun run ci:variants` before pushing. It creates an app from every variant with `bun create` and runs that app's CI. Add variant names to check only those.
- Text between `template-only` markers in this README and in `AGENTS.md` is removed from new apps.

<!-- template-only:end -->

## Scripts

| Script                         | What it does             |
| ------------------------------ | ------------------------ |
| `bun run dev`                  | Start with hot reload    |
| `bun run start`                | Start in production mode |
| `bun test`                     | Unit + e2e tests         |
| `bun run typecheck`            | `tsc --noEmit`           |
| `bun run lint` / `bun run fix` | Biome check / auto-fix   |
| `bun run ci`                   | typecheck + lint + test  |

`bun install` points git at `.githooks/`, so every commit runs `bun run ci` first and is blocked if it fails.

## Endpoints

- `GET /health` → `{ "status": "ok" }`
- `POST /api/echo` with `{ "message": "hi" }` → `{ "echo": "hi" }`

An invalid body returns `400 { "error": "Invalid request body", "details": [{ "path", "message" }] }`. Anything else returns `404 { "error": "Not found" }`, and bodies over 1 MB get a 413.

## Configuration

| Variable   | Default       | Notes                                   |
| ---------- | ------------- | --------------------------------------- |
| `PORT`     | `3000`        | `0` lets the OS pick a free port        |
| `HOST`     | `0.0.0.0`     |                                         |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |

An empty value (`PORT=`) counts as unset. An invalid value stops startup with a message naming each bad variable.

## Docker

```sh
docker build -t my-app .
docker run --rm -p 3000:3000 my-app
```

Conventions for contributors and coding agents are in [AGENTS.md](./AGENTS.md).
