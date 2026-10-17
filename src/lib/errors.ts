/**
 * Turns database errors into copy an admin can act on. Messages raised on
 * purpose by our own RPCs are already written for
 * people (P0001 / P0002 / 22023), so they pass through; constraint and
 * permission failures do not.
 */
type DbError = { message?: string; code?: string | null } | null | undefined;

export const GENERIC_ERROR =
  "Something went wrong on our side. Please try again in a moment.";

export function friendlyError(
  error: DbError,
  overrides: { duplicate?: string } = {},
): string {
  if (!error) return GENERIC_ERROR;
  const code = error.code ?? "";
  switch (code) {
    // Our RPCs raise these on purpose, with messages written for admins.
    case "P0001":
    case "P0002":
    case "22023":
      return error.message?.trim() || GENERIC_ERROR;
    case "23505":
      return overrides.duplicate ?? "That already exists. Try a different name or email.";
    case "23503":
      return "That's still linked to something else, so it can't be changed yet.";
    case "23502":
    case "23514":
    case "22P02":
    case "22007":
    case "22008":
    case "22001":
      return "Some of those details aren't valid. Check them and try again.";
    case "42501":
    case "PGRST301":
      return "You don't have permission to do that.";
    case "PGRST116":
      return "We couldn't find that. It may have been removed.";
    default:
      if (error.message) console.error("[friendlyError]", code, error.message);
      return GENERIC_ERROR;
  }
}
