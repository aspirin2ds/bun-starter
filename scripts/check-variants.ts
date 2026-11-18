/**
 * Creates an app from every template variant with `bun create`, the same way users do,
 * then runs that app's `bun run ci`. Run with `bun run ci:variants` before pushing template changes.
 * Pass variant names to check only those: `bun run ci:variants postgres`.
 */
import { existsSync } from "node:fs";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import { VARIANTS, type Variant } from "../setup";

const root = join(import.meta.dir, "..");
const requested = Bun.argv.slice(2);
const variants = (requested.length > 0 ? requested : Object.keys(VARIANTS)) as Variant[];

const work = await mkdtemp(join(tmpdir(), "bun-starter-"));
try {
  // bun create reads local templates from $BUN_CREATE_DIR/<name>; a symlink avoids copying.
  await symlink(root, join(work, "bun-starter"));

  for (const variant of variants) {
    console.log(`\n=== ${variant} ===`);
    const app = join(work, `app-${variant}`);
    await $`bun create bun-starter ${app}`
      .cwd(work)
      .env({ ...Bun.env, BUN_CREATE_DIR: work, STARTER_VARIANT: variant });

    const leftovers = ["setup.ts", "variants", "scripts/check-variants.ts"].filter((path) =>
      existsSync(join(app, path)),
    );
    if (leftovers.length > 0) throw new Error(`Template files left in the ${variant} app: ${leftovers.join(", ")}`);

    await $`bun run ci`.cwd(app);
    console.log(`✓ ${variant}`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
