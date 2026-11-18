import { z } from "zod";

/** Every env var the app reads. Add new settings here, and to `.env.example`. */
const EnvSchema = z
  .object({
    PORT: z.coerce.number().int().min(0).max(65_535).default(3000),
    HOST: z.string().default("0.0.0.0"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  })
  .transform((env) => ({ port: env.PORT, hostname: env.HOST, env: env.NODE_ENV, databaseUrl: env.DATABASE_URL }));

export type Config = Readonly<z.output<typeof EnvSchema>>;
export type Env = Config["env"];

/**
 * Reads and validates settings once at startup. Bad values throw, so the process
 * fails fast instead of serving with a broken config. Takes `env` as a parameter
 * so tests can pass their own.
 */
export function loadConfig(env: Record<string, string | undefined> = Bun.env): Config {
  // `KEY=` in a .env file means "unset", not "empty string" (Number("") would be port 0).
  const defined = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ""));
  const result = EnvSchema.safeParse(defined);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return Object.freeze(result.data);
}
