/**
 * Template setup. `bun create` runs this inside the new app (see "bun-create" in package.json):
 *
 *   preinstall:  `setup.ts`           ask for a variant, apply it, create .env
 *   postinstall: `setup.ts finalize`  delete template-only files, fold everything into the initial commit
 *
 * Set STARTER_VARIANT (basic | postgres) to skip the question.
 */
import { cp, readdir, rm } from "node:fs/promises";

export const VARIANTS = {
  basic: "Basic HTTP API",
  postgres: "PostgreSQL + Drizzle ORM",
} as const;
export type Variant = keyof typeof VARIANTS;

const NAMES = Object.keys(VARIANTS) as Variant[];
const isVariant = (value: string): value is Variant => Object.hasOwn(VARIANTS, value);

/** Text between these markers in README.md / AGENTS.md documents the template itself, not the app. */
const TEMPLATE_ONLY = /\n*<!-- template-only:start -->[\s\S]*?<!-- template-only:end -->\n*/g;

function chooseVariant(): Variant {
  const preset = Bun.env.STARTER_VARIANT;
  if (preset) {
    if (isVariant(preset)) return preset;
    throw new Error(`STARTER_VARIANT must be one of: ${NAMES.join(", ")}`);
  }

  console.log("\nWhich template?");
  NAMES.forEach((name, i) => {
    console.log(`  ${i + 1}) ${VARIANTS[name]}`);
  });
  for (;;) {
    // prompt() returns null when there is no input (closed stdin), which picks the default.
    const answer = prompt(`Choose 1-${NAMES.length} [1]:`)?.trim() ?? "";
    if (answer === "") return "basic";
    const picked = NAMES[Number(answer) - 1] ?? (isVariant(answer) ? answer : undefined);
    if (picked) return picked;
    console.log(`Please enter a number from 1 to ${NAMES.length}.`);
  }
}

type PackageJson = Record<string, unknown> & { scripts?: Record<string, string> };

const sortKeys = (obj: Record<string, string>) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

async function apply(variant: Variant) {
  const pkg: PackageJson = await Bun.file("package.json").json();
  delete pkg.scripts?.["ci:variants"];

  if (variant !== "basic") {
    const dir = `variants/${variant}`;
    await cp(`${dir}/overlay`, ".", { recursive: true, force: true });

    // Variant package.json holds only the dependencies and scripts to add.
    const extra: PackageJson = await Bun.file(`${dir}/package.json`).json();
    for (const key of ["dependencies", "devDependencies", "scripts"]) {
      const merged = { ...(pkg[key] as Record<string, string>), ...(extra[key] as Record<string, string>) };
      pkg[key] = key === "scripts" ? merged : sortKeys(merged);
    }

    for (const doc of ["AGENTS.md", "README.md"]) {
      const section = Bun.file(`${dir}/${doc}`);
      if (await section.exists())
        await Bun.write(doc, `${(await Bun.file(doc).text()).trimEnd()}\n\n${await section.text()}`);
    }
  }

  await Bun.write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
  for (const doc of ["AGENTS.md", "README.md"]) {
    let text = (await Bun.file(doc).text()).replace(TEMPLATE_ONLY, "\n\n");
    if (doc === "README.md") text = text.replace(/^# bun-starter$/m, `# ${pkg.name}`);
    await Bun.write(doc, text);
  }
  await rm("variants", { recursive: true, force: true });
  if (!(await Bun.file(".env").exists())) await Bun.write(".env", Bun.file(".env.example"));

  console.log(`\nApplied the "${VARIANTS[variant]}" template.\n`);
}

async function finalize() {
  await rm("scripts/check-variants.ts", { force: true });
  if ((await readdir("scripts").catch(() => [])).length === 0) await rm("scripts", { recursive: true, force: true });
  await rm("setup.ts", { force: true });

  // `bun create` made the initial commit before this script ran. Fold the applied variant and
  // the updated lockfile into it. Skipped when there is no commit (no git identity configured).
  // --no-verify: the starter's `ci:variants` check already ran CI on this exact output.
  if ((await Bun.$`git rev-parse --verify --quiet HEAD`.quiet().nothrow()).exitCode === 0) {
    await Bun.$`git add -A && git commit --amend --no-edit --no-verify --quiet`;
  }
}

if (import.meta.main) {
  if (Bun.argv.includes("finalize")) await finalize();
  else await apply(chooseVariant());
}
