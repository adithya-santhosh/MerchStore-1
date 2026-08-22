import type { CookieOptions } from "express";
import logger from "./logger";

/**
 * Auth cookie configuration.
 *
 * The JWT is stored in an HttpOnly cookie so client-side JS — and therefore any
 * XSS — can never read it.
 *
 * The SameSite value depends on how the frontend and API are hosted:
 *
 *   "lax"  — frontend and API share a registrable domain, e.g.
 *            www.example.com  +  api.example.com. Browsers treat these as the
 *            SAME SITE, so a Lax cookie is sent on cross-origin fetches between
 *            them. Preferred: unaffected by third-party-cookie restrictions.
 *
 *   "none" — frontend and API are on genuinely different sites, e.g.
 *            my-app.vercel.app  +  my-api.onrender.com. Required for the cookie
 *            to be sent at all, but Safari's ITP and Chrome's third-party
 *            cookie phase-out actively restrict these, which shows up as users
 *            being randomly signed out. Treat as a temporary arrangement.
 *
 * Set COOKIE_SAMESITE to pick. Defaults to "none" in production (the
 * cross-site Vercel + Render arrangement) and "lax" everywhere else.
 */
const isProduction = process.env.NODE_ENV === "production";

const RAW_SAMESITE = (process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax")).toLowerCase();

const VALID_SAMESITE = ["lax", "none", "strict"] as const;
type SameSite = (typeof VALID_SAMESITE)[number];

if (!VALID_SAMESITE.includes(RAW_SAMESITE as SameSite)) {
  logger.error(
    { value: process.env.COOKIE_SAMESITE, allowed: VALID_SAMESITE },
    "FATAL: COOKIE_SAMESITE must be one of lax | none | strict. Refusing to start."
  );
  process.exit(1);
}

const sameSite = RAW_SAMESITE as SameSite;

// SameSite=None is only honoured on a Secure cookie. Without HTTPS the browser
// silently drops it and every request arrives unauthenticated — a failure mode
// that looks like "login is broken" rather than a config error, so fail loudly.
if (sameSite === "none" && !isProduction) {
  logger.warn(
    "COOKIE_SAMESITE=none requires a Secure (HTTPS) cookie, but NODE_ENV is not production. " +
      "Browsers will reject the auth cookie and sign-in will appear to fail."
  );
}

export const AUTH_COOKIE_NAME = "token";

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite,
  path: "/",
};

/** 7 days — kept in step with the JWT's own expiry. */
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
