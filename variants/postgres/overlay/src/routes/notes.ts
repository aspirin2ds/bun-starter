import { desc } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { notes } from "../db/schema";
import { json, readJson } from "../http";

const NewNote = z.object({ body: z.string().trim().min(1).max(10_000) });

/** Example resource. Copy this file's shape for new tables: schema, then routes, then an e2e test. */
export function noteRoutes(db: Db) {
  return {
    "/api/notes": {
      GET: async () => json(await db.select().from(notes).orderBy(desc(notes.id)).limit(100)),

      POST: async (req: Request) => {
        const input = await readJson(req, NewNote);
        const [note] = await db.insert(notes).values(input).returning();
        return json(note, 201);
      },
    },
  };
}
