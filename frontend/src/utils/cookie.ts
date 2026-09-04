export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

/**
 * Double-submit CSRF header for every mutating (POST/PUT/PATCH/DELETE)
 * request. The backend sets `csrf_token` as a script-readable cookie (unlike
 * the HttpOnly auth cookie) specifically so this can read it back and echo it
 * as a header — a cross-site page riding the ambient auth cookie has no way
 * to read this value, so it can't produce a request the backend accepts. See
 * backend/src/lib/csrf.ts for the full mechanism.
 *
 * Returns `{}` (no header) when there's no token yet — e.g. a logged-out
 * visitor's cart requests, which the backend's CSRF check doesn't require in
 * the first place since there's no session cookie to protect.
 */
export const getCsrfHeader = (): Record<string, string> => {
  const token = getCookie("csrf_token");
  return token ? { "X-CSRF-Token": token } : {};
};
