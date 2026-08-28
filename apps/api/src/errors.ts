import type { Context } from "hono";

export function problem(c: Context, status: 400 | 401 | 404 | 413 | 415 | 422 | 500, code: string, message: string, details?: unknown) {
  return c.json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
}
