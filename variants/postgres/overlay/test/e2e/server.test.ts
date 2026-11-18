import { afterAll, describe, expect, test } from "bun:test";
import { startApp } from "../support/app";

const app = await startApp();
afterAll(() => app.stop());

const { call } = app;

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
