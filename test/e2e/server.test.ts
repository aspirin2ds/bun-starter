import { afterAll, describe, expect, test } from "bun:test";
import { loadConfig } from "../../src/config";
import { createServer } from "../../src/server";

// Port 0 lets the OS pick a free port, so tests never collide with a running dev server.
const server = createServer(loadConfig({ PORT: "0", HOST: "127.0.0.1", NODE_ENV: "test" }));
afterAll(() => server.stop(true));

const call = (path: string, init?: RequestInit) => fetch(new URL(path, server.url), init);

describe("server", () => {
  test("GET /health", async () => {
    const res = await call("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("POST /api/echo returns the trimmed message", async () => {
    const res = await call("/api/echo", { method: "POST", body: JSON.stringify({ message: "  hi  " }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ echo: "hi" });
  });

  test("POST /api/echo rejects malformed JSON with 400", async () => {
    const res = await call("/api/echo", { method: "POST", body: "nope" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Body must be valid JSON" });
  });

  test("POST /api/echo lists invalid fields with 400", async () => {
    const res = await call("/api/echo", { method: "POST", body: JSON.stringify({ message: "" }) });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Invalid request body",
      details: [{ path: "message", message: expect.any(String) }],
    });
  });

  test("unknown path and wrong method return JSON 404", async () => {
    for (const res of [await call("/missing"), await call("/api/echo")]) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not found" });
    }
  });

  test("rejects bodies over the size limit", async () => {
    const res = await call("/api/echo", { method: "POST", body: "x".repeat(1024 * 1024 + 1) });
    expect(res.status).toBe(413);
  });
});
