import { describe, expect, test } from "bun:test";
import { loadConfig } from "../../src/config";

const DATABASE_URL = "postgres://app:app@localhost:5432/app";

describe("loadConfig", () => {
  test("uses defaults when nothing is set", () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      port: 3000,
      hostname: "0.0.0.0",
      env: "development",
      databaseUrl: DATABASE_URL,
    });
  });

  test("treats empty values as unset", () => {
    expect(loadConfig({ DATABASE_URL, PORT: "", HOST: "", NODE_ENV: "" })).toEqual(loadConfig({ DATABASE_URL }));
  });

  test("reads PORT, HOST and NODE_ENV", () => {
    expect(loadConfig({ DATABASE_URL, PORT: "8080", HOST: "127.0.0.1", NODE_ENV: "production" })).toEqual({
      port: 8080,
      hostname: "127.0.0.1",
      env: "production",
      databaseUrl: DATABASE_URL,
    });
  });

  test("returns a frozen object", () => {
    expect(Object.isFrozen(loadConfig({ DATABASE_URL }))).toBe(true);
  });

  test.each(["abc", "-1", "65536", "3.5"])("rejects PORT=%p", (PORT) => {
    expect(() => loadConfig({ DATABASE_URL, PORT })).toThrow(/Invalid environment[\s\S]*PORT/);
  });

  test("rejects an unknown NODE_ENV", () => {
    expect(() => loadConfig({ DATABASE_URL, NODE_ENV: "staging" })).toThrow(/Invalid environment[\s\S]*NODE_ENV/);
  });

  test("requires a postgres DATABASE_URL", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ DATABASE_URL: "mysql://localhost/app" })).toThrow(/DATABASE_URL/);
  });
});
