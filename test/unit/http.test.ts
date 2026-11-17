import { describe, expect, spyOn, test } from "bun:test";
import { errorResponse, HttpError, readJson } from "../../src/http";

const post = (body: string) => new Request("http://x/", { method: "POST", body });

describe("readJson", () => {
  test("returns a JSON object body", async () => {
    expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 });
  });

  test.each(["not json", "[1,2]", "null", "42"])("rejects %p with a 400", async (body) => {
    const error = await readJson(post(body)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(400);
  });
});

describe("errorResponse", () => {
  test("sends an HttpError's status and message", async () => {
    const res = errorResponse(new HttpError(418, "teapot"), false);
    expect(res.status).toBe(418);
    expect(await res.json()).toEqual({ error: "teapot" });
  });

  test("hides unexpected errors unless exposed", async () => {
    const log = spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(await errorResponse(new Error("db down"), false).json()).toEqual({ error: "Internal server error" });
      expect(await errorResponse(new Error("db down"), true).json()).toEqual({ error: "db down" });
      expect(log).toHaveBeenCalledTimes(2);
    } finally {
      log.mockRestore();
    }
  });
});
