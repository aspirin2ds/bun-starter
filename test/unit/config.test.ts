import { describe, expect, test } from "bun:test";
import { loadConfig } from "../../src/config";

describe("loadConfig", () => {
  test("uses defaults when nothing is set", () => {
    expect(loadConfig({})).toEqual({ port: 3000, hostname: "0.0.0.0", env: "development" });
  });

  test("treats empty values as unset", () => {
    expect(loadConfig({ PORT: "", HOST: "", NODE_ENV: "" })).toEqual(loadConfig({}));
  });

  test("reads PORT, HOST and NODE_ENV", () => {
    expect(loadConfig({ PORT: "8080", HOST: "127.0.0.1", NODE_ENV: "production" })).toEqual({
      port: 8080,
      hostname: "127.0.0.1",
      env: "production",
    });
  });

  test("returns a frozen object", () => {
    expect(Object.isFrozen(loadConfig({}))).toBe(true);
  });

  test.each(["abc", "-1", "65536", "3.5"])("rejects PORT=%p", (PORT) => {
    expect(() => loadConfig({ PORT })).toThrow(/Invalid environment[\s\S]*PORT/);
  });

  test("rejects an unknown NODE_ENV", () => {
    expect(() => loadConfig({ NODE_ENV: "staging" })).toThrow(/Invalid environment[\s\S]*NODE_ENV/);
  });
});
