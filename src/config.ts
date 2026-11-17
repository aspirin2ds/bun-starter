const ENVS = ["development", "production", "test"] as const;
export type Env = (typeof ENVS)[number];

export type Config = Readonly<{
  port: number;
  hostname: string;
  env: Env;
}>;

/**
 * Reads and validates settings once at startup. Bad values throw, so the process
 * fails fast instead of serving with a broken config. Takes `env` as a parameter
 * so tests can pass their own.
 */
export function loadConfig(env: Record<string, string | undefined> = Bun.env): Config {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`Invalid PORT "${env.PORT}": expected an integer from 0 to 65535`);
  }

  const mode = env.NODE_ENV ?? "development";
  if (!isEnv(mode)) {
    throw new Error(`Invalid NODE_ENV "${mode}": expected one of ${ENVS.join(", ")}`);
  }

  return Object.freeze({ port, hostname: env.HOST || "0.0.0.0", env: mode });
}

const isEnv = (value: string): value is Env => (ENVS as readonly string[]).includes(value);
