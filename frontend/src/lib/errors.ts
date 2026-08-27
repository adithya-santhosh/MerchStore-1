/**
 * Narrows a caught value to a displayable message.
 *
 * Under TypeScript's `strict`, a bare `catch (e)` gives `unknown` — which is
 * correct, since anything can be thrown. The codebase previously annotated the
 * catch variable as `any` to sidestep that, which silently permits reading any
 * property off it. This keeps the safety and reads the same at the call site.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  // Some libraries reject with a plain object carrying `message`.
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
