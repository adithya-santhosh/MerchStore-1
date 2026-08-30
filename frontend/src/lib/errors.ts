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

/** One field-level failure out of a 422 `validate()` response. */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * A 422 from the API's `validate()` middleware, carrying the per-field messages
 * so a form can say which input is wrong rather than only that something is.
 *
 * `message` is set to the first field-level message, so existing callers that
 * render `getErrorMessage(...)` keep showing something specific instead of the
 * API's bare "Validation failed".
 */
export class ApiValidationError extends Error {
  readonly fieldErrors: ApiFieldError[];

  constructor(fieldErrors: ApiFieldError[], fallback: string) {
    super(fieldErrors[0]?.message || fallback);
    this.name = "ApiValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * The field-level errors carried by a caught value, or an empty list when the
 * failure was an ordinary one. Lets a form render a validation summary without
 * narrowing the `unknown` from `catch` itself.
 */
export function getFieldErrors(error: unknown): ApiFieldError[] {
  return error instanceof ApiValidationError ? error.fieldErrors : [];
}
