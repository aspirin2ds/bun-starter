# bun-starter

A minimal, strict [Bun](https://bun.sh) HTTP server to copy when starting a new app. It has no runtime dependencies.

## Start a new app from it

One-time setup: register this folder as a local `bun create` template. The symlink means edits here reach every new app.

```sh
mkdir -p ~/.bun-create && ln -s "$PWD" ~/.bun-create/bun-starter
```

Then, for each new app:

```sh
bun create bun-starter my-app
cd my-app && bun run dev
```

`bun create` copies everything except `node_modules` and sets `name` in `package.json`. It also starts a fresh git repo with an initial commit, creates `.env` from `.env.example`, and runs `bun install`, which turns on the pre-commit hook. It copies untracked files too, so keep secrets and scratch files out of this folder.

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
- `POST /api/echo` with a JSON object → `{ "echo": <body> }`

Anything else returns `404 { "error": "Not found" }`. Bodies over 1 MB get a 413.

## Configuration

| Variable   | Default       | Notes                                   |
| ---------- | ------------- | --------------------------------------- |
| `PORT`     | `3000`        | `0` lets the OS pick a free port        |
| `HOST`     | `0.0.0.0`     |                                         |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |

## Docker

```sh
docker build -t my-app .
docker run --rm -p 3000:3000 my-app
```

Conventions for contributors and coding agents are in [AGENTS.md](./AGENTS.md).
