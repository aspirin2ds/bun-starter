import type { z } from "zod";

/** Throw from any handler to send `{ error: message, details? }` with this status. */
export class HttpError extends Error {
  override name = "HttpError";

  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const json = (body: unknown, status = 200): Response => Response.json(body, { status });

/**
 * Parses the request body as JSON and validates it against `schema`. Returns the
 * typed result, or throws a 400 `HttpError` that lists each invalid field.
 */
export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Body must be valid JSON");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    }));
    throw new HttpError(400, "Invalid request body", details);
  }
  return result.data;
}

/**
 * Turns any thrown value into a JSON response. Messages from `HttpError` are
 * sent to the client; any other error is logged and its message is hidden unless `expose` is set.
 */
export function errorResponse(error: unknown, expose: boolean): Response {
  if (error instanceof HttpError) {
    const body =
      error.details === undefined ? { error: error.message } : { error: error.message, details: error.details };
    return json(body, error.status);
  }
  console.error(error);
  const message = expose && error instanceof Error ? error.message : "Internal server error";
  return json({ error: message }, 500);
}
