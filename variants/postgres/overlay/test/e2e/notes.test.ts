import { afterAll, describe, expect, test } from "bun:test";
import { notes } from "../../src/db/schema";
import { startApp } from "../support/app";

const app = await startApp();
afterAll(() => app.stop());

const post = (body: unknown) => app.call("/api/notes", { method: "POST", body: JSON.stringify(body) });

describe("/api/notes", () => {
  test("POST stores a note and returns it with 201", async () => {
    const res = await post({ body: "  first  " });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: expect.any(Number), body: "first", createdAt: expect.any(String) });

    const rows = await app.db.select().from(notes);
    expect(rows.map((row) => row.body)).toContain("first");
  });

  test("GET lists notes, newest first", async () => {
    await post({ body: "older" });
    await post({ body: "newer" });

    const res = await app.call("/api/notes");
    expect(res.status).toBe(200);
    const list = (await res.json()) as { body: string }[];
    expect(list.map((note) => note.body).slice(0, 2)).toEqual(["newer", "older"]);
  });

  test("POST rejects an empty body with 400", async () => {
    const res = await post({ body: "   " });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Invalid request body",
      details: [{ path: "body", message: expect.any(String) }],
    });
  });
});
