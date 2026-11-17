/** Throw from any handler to send `{ error: message }` with this status. */
export class HttpError extends Error {
  override name = "HttpError";

  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (body: unknown, status = 200): Response => Response.json(body, { status });

/** Parses the request body as a JSON object, or throws a 400 `HttpError`. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Body must be valid JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

/**
 * Turns any thrown value into a JSON response. Messages from `HttpError` are
 * sent to the client; any other error is logged and its message is hidden unless `expose` is set.
 */
export function errorResponse(error: unknown, expose: boolean): Response {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error(error);
  const message = expose && error instanceof Error ? error.message : "Internal server error";
  return json({ error: message }, 500);
}
