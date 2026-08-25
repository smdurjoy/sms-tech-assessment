import type { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

/** Discriminated result returned by every mutating server action. */
export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; fieldErrors?: FieldErrors; formError?: string };

/** Collapse a ZodError to one message per field, for inline form display. */
export function toFieldErrors(error: ZodError): FieldErrors {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const out: FieldErrors = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages && messages[0]) out[key] = messages[0];
  }
  return out;
}
