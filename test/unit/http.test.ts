import { describe, expect, spyOn, test } from "bun:test";
import { z } from "zod";
import { errorResponse, HttpError, readJson } from "../../src/http";

const post = (body: string) => new Request("http://x/", { method: "POST", body });
const Schema = z.object({ name: z.string(), age: z.number().int().optional() });

/** Runs readJson and returns the HttpError it throws. */
async function rejection(body: string): Promise<HttpError> {
  const error = await readJson(post(body), Schema).then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(HttpError);
  return error as HttpError;
}

describe("readJson", () => {
  test("returns the parsed, typed body", async () => {
    const body = await readJson(post('{"name":"ann","age":3}'), Schema);
    expect(body).toEqual({ name: "ann", age: 3 });
  });

  test("drops keys the schema doesn't declare", async () => {
    expect(await readJson(post('{"name":"ann","admin":true}'), Schema)).toEqual({ name: "ann" });
  });

  test("rejects malformed JSON with a 400", async () => {
    const error = await rejection("not json");
    expect(error.status).toBe(400);
    expect(error.message).toBe("Body must be valid JSON");
  });

  test.each(["[1,2]", "null", "42", '{"age":3}'])("rejects %p with a 400", async (body) => {
    const error = await rejection(body);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Invalid request body");
  });

  test("lists each invalid field in details", async () => {
    const error = await rejection('{"name":1,"age":1.5}');
    expect(error.details).toEqual([
      { path: "name", message: expect.any(String) },
      { path: "age", message: expect.any(String) },
    ]);
  });
});

describe("errorResponse", () => {
  test("sends an HttpError's status and message", async () => {
    const res = errorResponse(new HttpError(418, "teapot"), false);
    expect(res.status).toBe(418);
    expect(await res.json()).toEqual({ error: "teapot" });
  });

  test("includes details when the HttpError has them", async () => {
    const res = errorResponse(new HttpError(400, "bad", [{ path: "x" }]), false);
    expect(await res.json()).toEqual({ error: "bad", details: [{ path: "x" }] });
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
