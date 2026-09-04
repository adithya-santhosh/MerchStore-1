import crypto from "crypto";
import type { CookieOptions, Request, Response } from "express";
import { SHARED_COOKIE_ATTRS, AUTH_COOKIE_MAX_AGE } from "./auth-cookie";

/**
 * Double-submit cookie CSRF protection.
 *
 * The JWT lives in an HttpOnly cookie, so the browser attaches it to a
 * mutating request automatically — including one a *different* site tricked
 * the victim's browser into sending. This token closes that gap: it's set in
 * a cookie the page's own JS *can* read (unlike the auth cookie), and every
 * mutating request has to echo it back in a header. A cross-site attacker
 * can ride the auth cookie, but can't read this one to put in the header, so
 * the values won't match.
 *
 * This is the "naive" (unsigned) double-submit variant — no server-side
 * storage, just comparing cookie to header. That's adequate as long as an
 * attacker can't set cookies on this app's own domain (e.g. via a sibling
 * subdomain they control, or unrelated XSS); if that ever becomes a real
 * concern, upgrade to an HMAC-signed token tied to the session instead.
 */

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

export const generateCsrfToken = (): string => crypto.randomBytes(32).toString("hex");

/** Readable by JS on purpose — see file header. Never httpOnly. */
export const CSRF_COOKIE_OPTIONS: CookieOptions = {
  ...SHARED_COOKIE_ATTRS,
  httpOnly: false,
};

export const CSRF_COOKIE_MAX_AGE = AUTH_COOKIE_MAX_AGE;

/** Issues a fresh CSRF token cookie — see file header on why it has to be JS-readable. */
export const setCsrfCookie = (res: Response): void => {
  res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), {
    ...CSRF_COOKIE_OPTIONS,
    maxAge: CSRF_COOKIE_MAX_AGE,
  });
};

/** Manual parse to match auth.middleware.ts — no cookie-parser dependency in this app. */
export const parseCookies = (req: Request): Record<string, string> => {
  if (!req.headers.cookie) return {};
  return req.headers.cookie.split(";").reduce(
    (acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    },
    {} as Record<string, string>
  );
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * True if this request needs a CSRF check at all. Only cookie-authenticated,
 * state-changing requests do: a request bearing its own `Authorization`
 * header isn't riding an ambient browser credential, so no cross-site page
 * can forge one on the victim's behalf, and GET/HEAD aren't supposed to
 * change anything.
 */
export const requiresCsrfCheck = (req: Request): boolean => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) return false;
  return MUTATING_METHODS.has(req.method);
};

export const csrfTokenIsValid = (req: Request): boolean => {
  const cookieToken = parseCookies(req)[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];
  return (
    typeof cookieToken === "string" &&
    cookieToken.length > 0 &&
    typeof headerToken === "string" &&
    headerToken === cookieToken
  );
};
